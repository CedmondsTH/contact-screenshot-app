'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ClipboardUpload from './ClipboardUpload';

interface ImageUploadProps {
  onFilesUploaded: (files: File[]) => void;
}

export default function ImageUpload({ onFilesUploaded }: ImageUploadProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesUploaded(acceptedFiles);
    }
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    noClick: true, // We will use our own button
  });

  const handleClipboardUpload = (file: File) => {
    onFilesUploaded([file]);
  };

  if (!isClient) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 w-full max-w-2xl mx-auto hover-scale fade-in">
        <div className="relative p-10 border-2 border-dashed rounded-lg text-center transition-all duration-300 ease-in-out border-border hover:border-primary/50 hover:bg-primary/5">
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="w-16 h-16 text-muted-foreground transition-transform duration-300 hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-lg font-semibold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8 w-full max-w-2xl mx-auto hover-scale fade-in">
      <div
        {...getRootProps()}
        className={`relative p-10 border-2 border-dashed rounded-lg text-center
        transition-all duration-300 ease-in-out
        ${isDragActive ? 'border-primary bg-primary/10 drag-enter' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg className="w-16 h-16 text-muted-foreground transition-transform duration-300 hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {isDragActive ? (
            <p className="text-lg font-semibold text-primary">Drop the images here ...</p>
          ) : (
            <p className="text-lg font-semibold">Drag & drop screenshots here</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-muted-foreground">OR</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <label htmlFor="file-upload" className="w-full sm:w-auto cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium text-center transition-all duration-200 hover:scale-105 glow">
          Choose Files
        </label>
        <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFilesUploaded(Array.from(e.target.files || []))} />
        
        <ClipboardUpload onFilesPasted={handleClipboardUpload} />
      </div>

    </div>
  );
} 