import React, { useState, useEffect, useRef } from 'react';
import { AxiosError } from 'axios';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/selectors';
import { initializeSocket, getSocket } from '../services/socket';
import api from '../services/api';
import './FileUpload.css';

interface UploadProgress {
  uploadId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  fileName?: string;
  error?: string;
}

interface UploadedFile {
  id?: string;
  filename: string;
  originalName: string;
  size: number;
  url: string;
  mimeType?: string;
}

const isImageFile = (fileName: string, mimeType?: string): boolean => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
  const imageMimeTypes = /^image\//;
  return imageExtensions.test(fileName) || (mimeType ? imageMimeTypes.test(mimeType) : false);
};

const FileUpload: React.FC = () => {
  const user = useAppSelector(selectUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await api.get<{ files: UploadedFile[] }>('/upload/files');
        setUploadedFiles(response.data.files);
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };

    if (!user) {
      return;
    }

    loadFiles();
    initializeSocket().catch((err) => {
      console.error('Failed to initialize socket:', err);
    });

    const socket = getSocket();
    if (!socket) {
      return;
    }

    const handleProgress = (data: UploadProgress) => {
      setUploadProgress(data);
      if (data.status === 'completed') {
        setUploadProgress(null);
        setSelectedFile(null);
        loadFiles();
      }
    };

    const handleError = (data: { uploadId: string; error: string }) => {
      setUploadProgress({
        uploadId: data.uploadId,
        progress: 0,
        status: 'error',
        error: data.error,
      });
      setError(data.error);
    };

    socket.on('upload:progress', handleProgress);
    socket.on('upload:error', handleError);

    return () => {
      socket.off('upload:progress', handleProgress);
      socket.off('upload:error', handleError);
    };
  }, [user]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);

      if (isImageFile(file.name, file.type)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const uploadId = `upload-${Date.now()}`;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadId', uploadId);

    setUploadProgress({
      uploadId,
      progress: 0,
      status: 'uploading',
      fileName: selectedFile.name,
    });

    const socket = getSocket();
    if (socket) {
      socket.emit('upload:start', {
        uploadId,
        fileName: selectedFile.name,
      });
    }

    try {
      const response = await api.post<{ message: string; file: UploadedFile }>(
        '/upload/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress({
                uploadId,
                progress,
                status: 'uploading',
                fileName: selectedFile.name,
              });
            }
          },
        }
      );

      const uploadedFile: UploadedFile = {
        ...response.data.file,
        mimeType: selectedFile.type,
      };
      setUploadedFiles((prev) => [uploadedFile, ...prev]);
      setUploadProgress({
        uploadId,
        progress: 100,
        status: 'completed',
        fileName: selectedFile.name,
      });

      setTimeout(() => {
        setUploadProgress(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Upload failed';
      setError(errorMessage);
      setUploadProgress({
        uploadId,
        progress: 0,
        status: 'error',
        error: errorMessage,
      });
    }
  };

  return (
    <div className="file-upload-container">
      <h2>File Upload</h2>

      <div className="upload-section">
        <div className="file-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            Choose File
          </label>
          {selectedFile && <span className="file-name">{selectedFile.name}</span>}
        </div>

        {previewUrl && (
          <div className="preview-container">
            <img src={previewUrl} alt="Preview" className="preview-image" />
          </div>
        )}

        {selectedFile && (
          <button onClick={handleUpload} className="upload-button" disabled={!!uploadProgress}>
            {uploadProgress?.status === 'uploading' ? 'Uploading...' : 'Upload'}
          </button>
        )}

        {error && <div className="error-message">{error}</div>}

        {uploadProgress && (
          <div className="progress-container">
            <div className="progress-bar-wrapper">
              <div
                className={`progress-bar ${uploadProgress.status}`}
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <div className="progress-text">
              {uploadProgress.status === 'uploading' && `${uploadProgress.progress}%`}
              {uploadProgress.status === 'completed' && '✓ Upload Complete'}
              {uploadProgress.status === 'error' && `✗ ${uploadProgress.error}`}
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Uploaded Files</h3>
          <div className="files-grid">
            {uploadedFiles.map((file, index) => {
              const fileUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${file.url}`;
              const isImage = isImageFile(file.originalName, file.mimeType);

              return (
                <div key={index} className="file-card">
                  {isImage ? (
                    <div className="image-preview-wrapper">
                      <img src={fileUrl} alt={file.originalName} className="uploaded-image" />
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="image-overlay"
                      >
                        <span className="view-full">View Full Size</span>
                      </a>
                    </div>
                  ) : (
                    <div className="document-icon">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                  )}
                  <div className="file-info">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-name-link"
                    >
                      {file.originalName}
                    </a>
                    <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
