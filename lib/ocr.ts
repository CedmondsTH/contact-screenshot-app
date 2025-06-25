import { createWorker, Worker } from 'tesseract.js';
import { OCRConfig, ProcessingResult } from '../types/contact';

// Initialize Tesseract worker
let worker: Worker | null = null;

async function initializeWorker(config: OCRConfig = { language: 'eng' }): Promise<Worker> {
  if (worker) {
    return worker;
  }

  worker = await createWorker(config.language, 1, {
    logger: config.tesseractOptions?.logger || (() => {}),
  });

  return worker;
}

// Main OCR function
export async function extractTextFromImage(
  imageFile: File,
  config: OCRConfig = { language: 'eng' }
): Promise<ProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Initialize worker
    const ocrWorker = await initializeWorker(config);
    
    // Convert file to image data
    const imageData = await fileToImageData(imageFile);
    
    // Perform OCR
    const { data } = await ocrWorker.recognize(imageData);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      rawText: data.text,
      processingTime,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error',
      processingTime: Date.now() - startTime,
    };
  }
}

// Convert File to ImageData for Tesseract
async function fileToImageData(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

// Preprocess image for better OCR accuracy
export async function preprocessImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = avg > 128 ? 255 : 0; // High contrast
        data[i] = contrast;     // Red
        data[i + 1] = contrast; // Green
        data[i + 2] = contrast; // Blue
        // Alpha channel remains unchanged
      }
      
      // Put processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob and then to file
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(processedFile);
        } else {
          reject(new Error('Failed to create processed image'));
        }
      }, 'image/png');
    };
    
    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
    img.src = URL.createObjectURL(file);
  });
}

// Clean up worker when done
export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

// Worker type already imported and available 