import SecureLS from 'secure-ls';

interface StoredData {
  data: string;
  expiresAt?: number;
}

class SecureStorage {
  private ls: SecureLS;
  private prefix = 'secure_';

  constructor() {
    const passphrase =
      typeof window !== 'undefined'
        ? `${window.location.hostname}-${navigator.userAgent}`
        : 'default-passphrase';

    this.ls = new SecureLS({
      encodingType: 'aes',
      isCompression: false,
      encryptionSecret: passphrase.substring(0, 16),
    });
  }

  async setItem(key: string, value: string, expiresIn?: number): Promise<void> {
    try {
      const storedData: StoredData = {
        data: value,
        expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      };

      this.ls.set(`${this.prefix}${key}`, JSON.stringify(storedData));
    } catch (error) {
      console.error('Failed to set secure storage item:', error);
      try {
        localStorage.setItem(key, value);
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = this.ls.get(`${this.prefix}${key}`);

      if (encrypted) {
        const storedData: StoredData = JSON.parse(encrypted);

        if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
          await this.removeItem(key);
          return null;
        }

        return storedData.data;
      }

      const plainValue = localStorage.getItem(key);
      if (plainValue) {
        await this.setItem(key, plainValue);
        localStorage.removeItem(key);
        return plainValue;
      }

      return null;
    } catch (error) {
      console.error('Failed to get secure storage item:', error);
      return localStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.ls.remove(`${this.prefix}${key}`);
    } catch (error) {
      console.error('Failed to remove secure storage item:', error);
    }
    localStorage.removeItem(key);
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('secure-ls') || key.startsWith(this.prefix)) {
          try {
            this.ls.remove(key.replace('secure-ls.', '').replace(this.prefix, ''));
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined' && this.ls !== null;
  }
}

const secureStorage = new SecureStorage();

export default secureStorage;
