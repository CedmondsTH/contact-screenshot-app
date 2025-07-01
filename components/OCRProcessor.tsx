'use client';

import { useState, useCallback, useEffect } from 'react';
import { parseEmailSignature } from '../lib/parser';
import { type ContactData } from '../types/contact';

interface OCRProcessorProps {
  files: File[];
  onComplete: (results: ContactData[]) => void;
  onError: (error: string) => void;
}

export default function OCRProcessor({ files, onComplete, onError }: OCRProcessorProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  const processFile = useCallback(async (file: File) => {
    try {
      setStatus('Uploading and processing image...');
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown API error' }));
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.message}`);
      }
      
      const { text } = await response.json();
      if (!text) {
        throw new Error('No text could be extracted from the image.');
      }
      
      setStatus('Parsing contact information...');
      const contact = parseEmailSignature(text);
      contact.rawText = text;

      return contact;
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (files.length === 0) return;

    const run = async () => {
      const results: ContactData[] = [];
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        try {
          const result = await processFile(files[i]);
          results.push(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing.';
          onError(`Failed to process image ${i + 1}: ${errorMessage}`);
          return; // Stop processing on the first error
        }
      }
      onComplete(results);
    };

    run();
  }, [files, processFile, onComplete, onError]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const progress = files.length > 0 ? ((currentFileIndex + 1) / files.length) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center w-full max-w-lg mx-auto">
      <div className="flex justify-center items-center mb-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
      <h2 className="text-2xl font-semibold text-foreground">
        Processing...
      </h2>
      <p className="text-muted-foreground mt-2 mb-6">
        {status} ({currentFileIndex + 1} of {files.length})
      </p>
      <div className="w-full bg-secondary rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
} 
