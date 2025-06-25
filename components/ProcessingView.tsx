'use client';

import { useState, useEffect } from 'react';

interface ProcessingViewProps {
  files: any[];
  onProcessingComplete: (results: any[]) => void;
  onStartOver: () => void;
}

export default function ProcessingView({ files, onProcessingComplete, onStartOver }: ProcessingViewProps) {
  const [processing, setProcessing] = useState(true);
  
  useEffect(() => {
    // Simulate processing
    const timer = setTimeout(() => {
      setProcessing(false);
      // Mock results
      const results = files.map(() => ({
        success: true,
        data: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '(555) 123-4567',
          company: 'Example Corp',
          title: 'Manager'
        }
      }));
      onProcessingComplete(results);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [files, onProcessingComplete]);

  return (
    <div className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">Processing Images...</h2>
      {processing && (
        <div className="loading-spinner w-8 h-8 mx-auto"></div>
      )}
      <button onClick={onStartOver} className="btn-secondary">
        Start Over
      </button>
    </div>
  );
} 