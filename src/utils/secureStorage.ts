/**
 * Secure localStorage utility with encryption support
 * Uses Web Crypto API for encryption/decryption
 *
 * Features:
 * - AES-GCM encryption for stored data
 * - Optional expiration support
 * - Automatic fallback to plain localStorage if encryption fails
 * - Backward compatibility with existing localStorage data
 *
 * Usage:
 *   import secureStorage from './utils/secureStorage';
 *
 *   // Store with expiration (7 days)
 *   await secureStorage.setItem('token', token, 7 * 24 * 60 * 60 * 1000);
 *
 *   // Store without expiration
 *   await secureStorage.setItem('token', token);
 *
 *   // Retrieve
 *   const token = await secureStorage.getItem('token');
 *
 *   // Remove
 *   secureStorage.removeItem('token');
 *
 * Note: Web Crypto API requires HTTPS in production (localhost is allowed in development)
 */

interface StoredData {
  data: string;
  expiresAt?: number;
}

class SecureStorage {
  private encryptionKey: CryptoKey | null = null;
  private keyPromise: Promise<CryptoKey> | null = null;

  /**
   * Initialize encryption key (derived from a passphrase)
   * Uses a default key derived from domain + user agent for simplicity
   * In production, consider using a more secure key management approach
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    if (this.keyPromise) {
      return this.keyPromise;
    }

    this.keyPromise = (async () => {
      try {
        const passphrase = `${window.location.hostname}-${navigator.userAgent}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(passphrase);

        const keyMaterial = await crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, [
          'deriveBits',
          'deriveKey',
        ]);

        // In production, use a random salt
        const salt = encoder.encode('auth-module-salt');
        const key = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );

        this.encryptionKey = key;
        return key;
      } catch (error) {
        console.error('Failed to generate encryption key:', error);
        throw new Error('Failed to initialize secure storage');
      }
    })();

    return this.keyPromise;
  }

  /**
   * Encrypt data using AES-GCM
   */
  private async encrypt(data: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey();

      const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Set an item in secure storage with optional expiration
   * @param key - Storage key
   * @param value - Value to store
   * @param expiresIn - Optional expiration time in milliseconds
   */
  async setItem(key: string, value: string, expiresIn?: number): Promise<void> {
    try {
      const storedData: StoredData = {
        data: value,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      };

      const encrypted = await this.encrypt(JSON.stringify(storedData));
      localStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
      // Fallback to plain localStorage if encryption fails
      localStorage.setItem(key, value);
    }
  }

  /**
   * Get an item from secure storage
   * @param key - Storage key
   * @returns The stored value or null if not found/expired
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) {
        // Fallback to plain localStorage for backward compatibility
        return localStorage.getItem(key);
      }

      const decrypted = await this.decrypt(encrypted);
      const storedData: StoredData = JSON.parse(decrypted);

      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        this.removeItem(key);
        return null;
      }

      return storedData.data;
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      // Fallback to plain localStorage
      return localStorage.getItem(key);
    }
  }

  /**
   * Remove an item from secure storage
   * @param key - Storage key
   */
  removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    // Also remove plain version for backward compatibility
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if secure storage is supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof localStorage !== 'undefined'
    );
  }
}

// Export a singleton instance
const secureStorage = new SecureStorage();

export default secureStorage;
