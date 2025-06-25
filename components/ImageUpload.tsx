'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadedFile } from '../types/contact';

interface ImageUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
}

export default function ImageUpload({ onFilesUploaded }: ImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: 'email-signature' // Default, user can change
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB max file size
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Clean up object URL
      URL.revokeObjectURL(prev[index].preview);
      return updated;
    });
  };

  const updateFileType = (index: number, type: 'email-signature' | 'linkedin-profile') => {
    setUploadedFiles(prev => 
      prev.map((file, i) => i === index ? { ...file, type } : file)
    );
  };

  const handleProcess = () => {
    if (uploadedFiles.length > 0) {
      onFilesUploaded(uploadedFiles);
    }
  };

  const clearAll = () => {
    // Clean up object URLs
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setUploadedFiles([]);
  };

  return (
    <div className="space-y-8">
      {/* Upload Instructions */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Upload Your Screenshots</h2>
        <p className="text-gray-600">
          Upload screenshots of email signatures or LinkedIn profiles to extract contact information
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'dragover' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl text-gray-400">📷</div>
          {isDragActive ? (
            <p className="text-lg text-primary-600 font-medium">Drop the images here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg text-gray-700 font-medium">
                Drag & drop image files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, GIF, BMP, WebP (max 10MB each)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="card">
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* File Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  {/* Type Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">
                      Image Type:
                    </label>
                    <select
                      value={file.type}
                      onChange={(e) => updateFileType(index, e.target.value as 'email-signature' | 'linkedin-profile')}
                      className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="email-signature">Email Signature</option>
                      <option value="linkedin-profile">LinkedIn Profile</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="w-full text-xs text-red-600 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <div className="text-center">
            <button
              onClick={handleProcess}
              className="btn-primary px-8 py-3 text-lg"
            >
              Process Images ({uploadedFiles.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 