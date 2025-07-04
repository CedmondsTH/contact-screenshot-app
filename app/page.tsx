'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUpload from '../components/ImageUpload';
import OCRProcessor from '../components/OCRProcessor';
import ContactForm from '../components/ContactForm';
import { type ContactData as Contact } from '../types/contact';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcessingComplete = useCallback((results: Contact[]) => {
    setContacts(results);
    setFiles([]); // Clear files after processing
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setFiles([]); // Clear files on error
  }, []);

  const handleStartOver = useCallback(() => {
    setFiles([]);
    setContacts([]);
    setError(null);
  }, []);

  const handleFiles = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    setContacts([]);
    setError(null);
  }

  let content;
  if (files.length > 0) {
    content = (
      <OCRProcessor 
        files={files}
        onComplete={handleProcessingComplete}
        onError={handleError}
      />
    );
  } else if (contacts.length > 0 || error) {
    content = (
      <ContactForm 
        contacts={contacts}
        error={error}
        onStartOver={handleStartOver} 
      />
    );
  } else {
    content = <ImageUpload onFilesUploaded={handleFiles} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8 fade-in">
          <Image
            src="/logo_transparent.png"
            alt="Trackhawk Logo"
            width={400}
            height={100}
            className="mx-auto mb-4 transition-transform duration-300 hover:scale-105"
            priority
          />
        </header>
        
        <main className="w-full height-transition">
          {content}
        </main>

        <footer className="text-center mt-8 text-sm text-muted-foreground fade-in stagger-3">
                        <p>Built by Carson Edmonds</p>
        </footer>
      </div>
    </div>
  );
} 