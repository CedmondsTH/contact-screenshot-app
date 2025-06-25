'use client';

import { useState, useEffect, useRef } from 'react';

interface ClipboardUploadProps {
  onFilesPasted: (files: File[]) => void;
  className?: string;
}

export default function ClipboardUpload({ onFilesPasted, className = '' }: ClipboardUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            // Create a proper File object with a good name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const newFile = new File([file], `pasted-screenshot-${timestamp}.png`, {
              type: file.type,
              lastModified: Date.now(),
            });
            files.push(newFile);
          }
        }
      }

      if (files.length > 0) {
        setShowPasteHint(false);
        onFilesPasted(files);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        setShowPasteHint(true);
        setTimeout(() => setShowPasteHint(false), 2000);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      const files = Array.from(e.dataTransfer?.files || []).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (files.length > 0) {
        onFilesPasted(files);
      }
    };

    // Add event listeners
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [onFilesPasted]);

  return (
    <div
      ref={dropZoneRef}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
        ${isDragOver 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : 'border-gray-300 hover:border-blue-400'
        }
        ${className}
      `}
    >
      {/* Paste Hint Overlay */}
      {showPasteHint && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-90 rounded-lg flex items-center justify-center z-10 animate-pulse">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">📋</div>
            <div className="font-semibold">Paste your screenshot now!</div>
            <div className="text-sm opacity-90">Ctrl+V detected</div>
          </div>
        </div>
      )}

      {/* Drag Over Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-80 rounded-lg flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="text-3xl mb-2">📁</div>
            <div className="font-semibold text-lg">Drop images here!</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        <div className="text-5xl">📋</div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Copy & Paste Screenshots
          </h3>
          <div className="text-gray-600 space-y-1">
            <p>📸 Take a screenshot (Windows + Shift + S)</p>
            <p>📋 Paste here with <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">Ctrl+V</kbd></p>
            <p>🖱️ Or drag & drop image files</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          Supports: PNG, JPG, GIF, BMP, WebP
        </div>
      </div>
    </div>
  );
} 