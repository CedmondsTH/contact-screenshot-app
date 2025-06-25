'use client';

import { useState, useCallback } from 'react';

interface OCRProcessorProps {
  files: File[];
  onComplete: (results: ExtractedContact[]) => void;
  onError: (error: string) => void;
}

interface ExtractedContact {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  linkedIn?: string;
  rawText?: string;
  confidence: number;
}

export default function OCRProcessor({ files, onComplete, onError }: OCRProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState(0);
  const [progress, setProgress] = useState(0);

  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      // Try Google Vision API first (much more accurate)
      const googleVisionText = await extractWithGoogleVision(file);
      if (googleVisionText) {
        return googleVisionText;
      }
      
      // Fallback to Tesseract.js if Google Vision fails
      return await extractWithTesseract(file);
    } catch (error) {
      throw new Error(`Failed to extract text from image: ${error}`);
    }
  };

  const extractWithGoogleVision = async (file: File): Promise<string | null> => {
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      // Call Google Vision API
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          provider: 'google'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || null;
      }
      
      return null;
    } catch (error) {
      console.warn('Google Vision failed, falling back to Tesseract:', error);
      return null;
    }
  };

  const extractWithTesseract = async (file: File): Promise<string> => {
    // Import Tesseract.js dynamically
    const { createWorker } = await import('tesseract.js');
    
    // Create worker
    const worker = await createWorker('eng');
    
    // Process the image
    const { data: { text } } = await worker.recognize(file);
    
    // Cleanup
    await worker.terminate();
    
    return text;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const parseContactData = (text: string): ExtractedContact => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Regex patterns
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s<>"{}|\\^`[\]]+/gi;

    const contact: ExtractedContact = {
      rawText: text,
      confidence: 0.6 // Lower confidence since OCR is struggling
    };

    // Try to detect if this is a LinkedIn profile based on text content
    const textLower = text.toLowerCase();
    const isLinkedInProfile = textLower.includes('linkedin') || 
                             textLower.includes('connect') || 
                             textLower.includes('follow') ||
                             textLower.includes('message') ||
                             textLower.includes('connections') ||
                             textLower.includes('followers');

    // Extract email (OCR-aware with multiple strategies)
    let emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      contact.email = emails[0];
    } else {
      // Strategy 1: Look for emails with spaces (OCR issue)
      const emailWithSpacesRegex = /[A-Za-z]+\s+[A-Za-z]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;
      const spacedEmails = text.match(emailWithSpacesRegex);
      if (spacedEmails && spacedEmails.length > 0) {
        const emailParts = spacedEmails[0].split('@');
        if (emailParts.length === 2) {
          const localPart = emailParts[0].replace(/\s+/g, '.');
          contact.email = `${localPart}@${emailParts[1]}`;
        }
      } else {
        // Strategy 2: Look for any text followed by @domain
        const broadEmailRegex = /[A-Za-z][A-Za-z\s._%+-]*@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;
        const broadEmails = text.match(broadEmailRegex);
        if (broadEmails && broadEmails.length > 0) {
          const email = broadEmails[0];
          const emailParts = email.split('@');
          if (emailParts.length === 2) {
            // Clean up the local part - remove spaces and convert to dots
            const localPart = emailParts[0].trim().replace(/\s+/g, '.');
            contact.email = `${localPart}@${emailParts[1]}`;
          }
        } else {
          // Strategy 3: Partial emails as fallback
          const partialEmailRegex = /[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;
          const partialEmails = text.match(partialEmailRegex);
          if (partialEmails && partialEmails.length > 0) {
            contact.email = partialEmails[0];
          }
        }
      }
    }
    
        // Try to improve email using contact name if available
    if (contact.email && contact.fullName) {
      const emailParts = contact.email.split('@');
      if (emailParts.length === 2) {
        const [localPart, domain] = emailParts;
        const nameParts = contact.fullName.toLowerCase().split(' ');
        
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          const localPartLower = localPart.toLowerCase();
          
          // Check if email seems incomplete or wrong
          const needsReconstruction = 
            localPart.length < 5 || // Very short local part
            !localPartLower.includes(firstName) || // Missing first name
            localPartLower === lastName || // Only has last name
            (firstName.length >= 3 && !localPartLower.includes(firstName.substring(0, 3))) // Missing significant part of first name
          
          if (needsReconstruction) {
            // Common email patterns - try the most common one
            contact.email = `${firstName}.${lastName}@${domain}`;
          }
        }
      }
    }
    
    // Fallback: If we have name but no email, try to construct one
    if (!contact.email && contact.fullName && contact.company) {
      const nameParts = contact.fullName.toLowerCase().split(' ');
      if (nameParts.length >= 2) {
        const firstName = nameParts[0];
        const lastName = nameParts[nameParts.length - 1];
        const companyDomain = contact.company.toLowerCase().replace(/[^a-z]/g, '');
        
        // Try to construct email based on company
        if (companyDomain.length > 2) {
          contact.email = `${firstName}.${lastName}@${companyDomain}.com`;
        }
      }
    }

    // Extract phone
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      contact.phone = phones[0];
    }

    // Extract LinkedIn URL (ULTRA CONSERVATIVE - only if explicitly found with person's name validation)
    const linkedinUrls = text.match(linkedinRegex);
    if (linkedinUrls && linkedinUrls.length > 0) {
      const linkedinUrl = linkedinUrls[0];
      console.log('Found potential LinkedIn URL:', linkedinUrl);
      
      // ULTRA STRICT validation for LinkedIn URLs
      const isValidLinkedIn = linkedinUrl.includes('/in/') && 
                             linkedinUrl.length > 25 && // Minimum realistic length
                             linkedinUrl.length < 80 && // Not too long
                             !linkedinUrl.includes(' ') && // No spaces (OCR artifact)
                             linkedinUrl.split('/in/')[1]?.length > 4; // Has substantial profile name
      
      if (!isValidLinkedIn) {
        console.log('❌ LinkedIn URL rejected - failed basic validation:', {
          hasIn: linkedinUrl.includes('/in/'),
          length: linkedinUrl.length,
          hasSpaces: linkedinUrl.includes(' '),
          profileNameLength: linkedinUrl.split('/in/')[1]?.length
        });
      }
      
      if (isValidLinkedIn) {
        const profileName = linkedinUrl.split('/in/')[1].split(/[/?]/)[0]; // Get just the profile name
        console.log('Profile name extracted:', profileName);
        
        // Additional validation: Check if the LinkedIn profile name relates to detected name
        let nameMatches = true; // Default to true if no name detected yet
        
        if (contact.fullName) {
          const nameParts = contact.fullName.toLowerCase().split(' ').filter(part => part.length > 2);
          const profileNameLower = profileName.toLowerCase();
          console.log('Checking name match:', { fullName: contact.fullName, nameParts, profileName: profileNameLower });
          
          // Check if profile name contains significant parts of the person's name
          // Must contain at least first name or last name or a combination
          nameMatches = nameParts.some(namePart => 
            profileNameLower.includes(namePart) || 
            namePart.includes(profileNameLower.replace(/[0-9-]/g, ''))
          );
          
          // Additional check: if profile has numbers/hyphens, be more lenient
          if (!nameMatches && /[0-9-]/.test(profileName)) {
            const cleanProfileName = profileName.replace(/[0-9-]/g, '');
            nameMatches = nameParts.some(namePart => 
              cleanProfileName.includes(namePart) || 
              namePart.includes(cleanProfileName)
            );
          }
          
          if (!nameMatches) {
            console.log('❌ LinkedIn URL rejected - profile name doesn\'t match person\'s name');
          }
        }
        
        // Only include if validation passes AND if profile name looks realistic
        const hasRealisticProfileName = /^[a-z]+[a-z0-9-]*[a-z0-9]$/i.test(profileName) && 
                                       profileName.length >= 5 && 
                                       profileName.length <= 30 &&
                                       !/^[0-9]+$/.test(profileName); // Not just numbers
        
        if (!hasRealisticProfileName) {
          console.log('❌ LinkedIn URL rejected - unrealistic profile name:', {
            profileName,
            passesRegex: /^[a-z]+[a-z0-9-]*[a-z0-9]$/i.test(profileName),
            length: profileName.length,
            isJustNumbers: /^[0-9]+$/.test(profileName)
          });
        }
        
        if (nameMatches && hasRealisticProfileName) {
          // Clean up the URL format
          let cleanUrl = linkedinUrl;
          if (!cleanUrl.startsWith('http')) {
            cleanUrl = `https://${cleanUrl}`;
          }
          // Remove any trailing characters that might be OCR artifacts
          cleanUrl = cleanUrl.replace(/[,.\s]+$/, '');
          contact.linkedIn = cleanUrl;
          console.log('✅ LinkedIn URL accepted:', cleanUrl);
        }
      }
    } else {
      console.log('No LinkedIn URLs found in OCR text');
    }

    // Extract other URLs (website)
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      const websiteUrls = urls.filter(url => !url.match(linkedinRegex));
      if (websiteUrls.length > 0) {
        contact.website = websiteUrls[0];
      }
    }

    // Enhanced parsing for LinkedIn profiles and email signatures
    if (isLinkedInProfile) {
      // Special handling for LinkedIn profiles
      // Look for name patterns - often the longest meaningful line near the top
      const potentialNames = lines.slice(0, 5).filter(line => {
        const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
        return cleanLine.length >= 4 && 
               cleanLine.length <= 50 && 
               !cleanLine.toLowerCase().includes('connect') &&
               !cleanLine.toLowerCase().includes('follow') &&
               !cleanLine.toLowerCase().includes('message') &&
               !emailRegex.test(line) && 
               !phoneRegex.test(line) &&
               !urlRegex.test(line);
      });
      
      if (potentialNames.length > 0) {
        // Pick the line that looks most like a name (has spaces, proper length)
        contact.fullName = potentialNames.find(name => name.includes(' ')) || potentialNames[0];
      }
    } else {
      // Enhanced parsing for email signatures
      const emailSignatureStarters = ['regards', 'sincerely', 'best regards', 'thank you', 'thanks', 'cheers', 'best'];
      
      // Skip email signature starters and find the actual name
      let nameFound = false;
      for (let i = 0; i < Math.min(lines.length, 5); i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase().replace(/[,\s]+$/, ''); // Remove trailing comma/spaces
        
        // Skip greeting lines
        if (emailSignatureStarters.some(starter => lineLower.includes(starter))) {
          continue;
        }
        
        // Skip obvious non-name lines
        if (emailRegex.test(line) || phoneRegex.test(line) || urlRegex.test(line)) {
          continue;
        }
        
        // Look for actual names (typically have first and last name)
        const cleanLine = line.replace(/[,\s]+$/, ''); // Remove trailing punctuation
        if (cleanLine.length > 3 && cleanLine.length < 50 && 
            !lineLower.includes('connect') && !lineLower.includes('follow')) {
          
          // Prefer lines that look like names (contain spaces, proper case)
          if (cleanLine.includes(' ') && /^[A-Z]/.test(cleanLine)) {
            contact.fullName = cleanLine;
            nameFound = true;
            break;
          } else if (!nameFound && cleanLine.length > 5) {
            // Fallback if no spaced name found
            contact.fullName = cleanLine;
            nameFound = true;
          }
        }
      }
    }

    // Look for job title - common patterns
    const titleKeywords = [
      'manager', 'director', 'ceo', 'cto', 'cfo', 'president', 'vice president', 'vp',
      'officer', 'engineer', 'developer', 'analyst', 'consultant', 'specialist',
      'coordinator', 'administrator', 'supervisor', 'lead', 'senior', 'junior',
      'associate', 'executive', 'founder', 'owner', 'partner', 'head of', 'chief'
    ];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (titleKeywords.some(keyword => lowerLine.includes(keyword))) {
        // Make sure it's not the name line
        if (line !== contact.fullName && !emailRegex.test(line) && !phoneRegex.test(line)) {
          contact.title = line;
          break;
        }
      }
    }

    // Look for company name (improved for email signatures)
    const emailSignatureStarters = ['regards', 'sincerely', 'best regards', 'thank you', 'thanks', 'cheers', 'best'];
    
    for (const line of lines) {
      const cleanLine = line.replace(/[,\s]+$/, '').trim();
      const lineLower = cleanLine.toLowerCase();
      
             // Skip greeting lines
       if (emailSignatureStarters.some(starter => lineLower.includes(starter))) {
         continue;
       }
       
       // Skip contact info lines
       if (emailRegex.test(line) || phoneRegex.test(line) || urlRegex.test(line)) {
         continue;
       }
       
       // Skip LinkedIn UI elements
       if (lineLower.includes('connect') || lineLower.includes('follow') || 
           lineLower.includes('message') || lineLower.includes('activity') || 
           lineLower.includes('experience')) {
         continue;
       }
       
       // Process potential company names
       if (cleanLine.length > 1 && cleanLine.length < 100) {
        
        // Skip if it's the person's name or title
        if (cleanLine === contact.fullName || cleanLine === contact.title) {
          continue;
        }
        
        // Common company indicators or standalone company names
        const companyIndicators = ['llc', 'inc', 'corp', 'ltd', 'company', 'group', 'solutions', 'services', 'technologies', 'investments'];
        const isLikelyCompany = companyIndicators.some(indicator => lineLower.includes(indicator)) ||
                               (cleanLine.length >= 3 && cleanLine.length <= 50 && 
                                !cleanLine.includes(' ') && // Single word companies like "TresVista"
                                /^[A-Z]/.test(cleanLine)); // Starts with capital
        
        if (isLikelyCompany && !contact.company) {
          contact.company = cleanLine;
          break;
        }
      }
    }

    // Conservative approach: Only include LinkedIn if found in OCR text
    // Don't construct/guess LinkedIn URLs - too risky for accuracy
    
    /* 
     * ULTRA-CONSERVATIVE LINKEDIN DETECTION STRATEGY:
     * 
     * 1. LinkedIn URL must be explicitly found in the OCR text (no guessing/construction)
     * 2. URL must pass strict format validation (/in/ present, realistic length, no spaces)
     * 3. Profile name must be realistic (5-30 chars, alphanumeric with hyphens, not just numbers)
     * 4. If person's name is detected, profile name must relate to it (contains name parts)
     * 5. All OCR artifacts (trailing punctuation, spaces) are cleaned up
     * 
     * This ensures we ONLY include LinkedIn URLs that are:
     * - Actually visible in the screenshot
     * - Properly formatted and realistic
     * - Belong to the specific person (name matching validation)
     * 
     * Better to have NO LinkedIn URL than the WRONG LinkedIn URL in business contexts.
     */

    return contact;
  };

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setProgress(0);
    
    try {
      const results: ExtractedContact[] = [];
      
      for (let i = 0; i < files.length; i++) {
        setCurrentFile(i);
        setProgress((i / files.length) * 100);
        
        const text = await extractTextFromImage(files[i]);
        const contact = parseContactData(text);
        results.push(contact);
      }
      
      setProgress(100);
      onComplete(results);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  }, [files, onComplete, onError]);

  // Auto-start processing when files are provided
  useState(() => {
    if (files.length > 0) {
      processFiles();
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center space-y-6">
        <div className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-2">Processing Images...</h2>
          <p className="text-gray-600">
            Extracting text from image {currentFile + 1} of {files.length}
          </p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>🔍 Using OCR to extract text from images</p>
          <p>📝 Parsing contact information</p>
          <p>✨ This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
} 