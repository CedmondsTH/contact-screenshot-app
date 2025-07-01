// Core contact data interface
export interface ContactData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  title?: string;
  company?: string;
  email?: string;
  mobilePhone?: string;
  workPhone?: string;
  linkedIn?: string;
  website?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  // Additional fields for LinkedIn profiles
  headline?: string;
  location?: string;
  profileUrl?: string;
  rawText?: string;
  // Confidence scores for extracted fields
  confidence?: {
    [key: string]: number;
  };
}

// Processing result interface
export interface ProcessingResult {
  success: boolean;
  data?: ContactData;
  rawText?: string;
  error?: string;
  processingTime?: number;
}

// Upload types
export interface UploadedFile {
  file: File;
  preview: string;
  type: 'email-signature' | 'linkedin-profile';
}

// LinkedIn search result
export interface LinkedInMatch {
  name: string;
  headline: string;
  profileUrl: string;
  company?: string;
  location?: string;
  imageUrl?: string;
  confidence: number;
}

// OCR configuration
export interface OCRConfig {
  language: string;
  tesseractOptions?: {
    logger?: (info: any) => void;
  };
}

// VCF generation options
export interface VCFOptions {
  includePhoto?: boolean;
  includeNotes?: boolean;
  customFields?: Record<string, string>;
} 