'use client';

import { useState, useCallback, useEffect } from 'react';

interface ClipboardUploadProps {
  onFilesPasted: (file: File) => void;
}

export default function ClipboardUpload({ onFilesPasted }: ClipboardUploadProps) {
  const [isPasting, setIsPasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    setError(null);
    const items = event.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (imageFile) {
      setIsPasting(true);
      try {
        onFilesPasted(imageFile);
      } catch (err) {
        setError('Could not process the pasted image.');
        console.error(err);
      } finally {
        setIsPasting(false);
      }
    }
  }, [onFilesPasted]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const triggerPaste = () => {
    setError(null);
    navigator.clipboard.read().then(() => {
      // This is a bit of a hack to trigger the 'paste' event listener
      // when the user clicks the button. It relies on the browser's security model
      // for clipboard access, which requires a user gesture.
      // The actual paste logic is in the 'paste' event handler.
      // We can also try to read directly, but the event handler is more robust.
      document.execCommand('paste');
    }).catch(err => {
      console.error('Clipboard permission was denied.', err);
      setError('Clipboard permission denied. Please allow access or use drag & drop.');
    });
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={triggerPaste}
        disabled={isPasting}
        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-wait px-6 py-3 rounded-md font-medium"
      >
        {isPasting ? 'Pasting...' : 'Paste from Clipboard'}
      </button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
} 