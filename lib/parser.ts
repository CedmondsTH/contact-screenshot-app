import { ContactData } from '../types/contact';

// Regular expressions for common patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?/g;
const LINKEDIN_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s<>"{}|\\^`[\]]+/gi;

// Address patterns
const ADDRESS_REGEX = /\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)/gi;
const ZIP_REGEX = /\b\d{5}(?:-\d{4})?\b/g;
const STATE_REGEX = /\b[A-Z]{2}\b|\b(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/gi;

// Common title keywords for job titles
const TITLE_KEYWORDS = [
  'manager', 'director', 'executive', 'president', 'ceo', 'cto', 'cfo',
  'developer', 'engineer', 'designer', 'analyst', 'consultant', 'specialist',
  'coordinator', 'assistant', 'associate', 'senior', 'junior', 'lead',
  'head', 'chief', 'vice', 'founder', 'owner', 'partner'
];

// Parse email signature text
export function parseEmailSignature(text: string): ContactData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const contactData: ContactData = {};
  
  // Extract emails
  const emails = text.match(EMAIL_REGEX);
  if (emails && emails.length > 0) {
    contactData.email = emails[0];
  }
  
  // Extract phone numbers
  const phones = text.match(PHONE_REGEX);
  if (phones && phones.length > 0) {
    contactData.phone = phones[0];
    if (phones.length > 1) {
      contactData.mobilePhone = phones[1];
    }
  }
  
  // Extract LinkedIn URL
  const linkedinUrls = text.match(LINKEDIN_URL_REGEX);
  if (linkedinUrls && linkedinUrls.length > 0) {
    contactData.linkedIn = linkedinUrls[0];
  }
  
  // Extract other URLs (website)
  const urls = text.match(URL_REGEX);
  if (urls && urls.length > 0) {
    // Filter out LinkedIn URLs to get website
    const websiteUrls = urls.filter(url => !url.match(LINKEDIN_URL_REGEX));
    if (websiteUrls.length > 0) {
      contactData.website = websiteUrls[0];
    }
  }
  
  // Extract address information
  const addressInfo = parseAddress(text);
  if (addressInfo) {
    contactData.address = addressInfo;
  }
  
  // Parse name, title, and company from lines
  const structuredData = parseStructuredText(lines);
  Object.assign(contactData, structuredData);
  
  // Add confidence scores
  contactData.confidence = calculateConfidence(contactData, text);
  
  return contactData;
}

// Parse LinkedIn profile text
export function parseLinkedInProfile(text: string): ContactData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const contactData: ContactData = {};
  
  // LinkedIn profiles have specific structure
  // First lines usually contain name and headline
  if (lines.length > 0) {
    contactData.fullName = lines[0];
    const nameParts = lines[0].split(' ');
    if (nameParts.length >= 2) {
      contactData.firstName = nameParts[0];
      contactData.lastName = nameParts[nameParts.length - 1];
    }
  }
  
  if (lines.length > 1) {
    contactData.headline = lines[1];
    // Try to extract title and company from headline
    const titleCompany = parseLinkedInHeadline(lines[1]);
    Object.assign(contactData, titleCompany);
  }
  
  // Look for location information
  for (const line of lines) {
    if (line.includes('Greater') || line.includes('Area') || line.includes(',')) {
      if (!contactData.location && line.length < 100) {
        contactData.location = line;
        break;
      }
    }
  }
  
  // Extract contact info if visible
  const emails = text.match(EMAIL_REGEX);
  if (emails && emails.length > 0) {
    contactData.email = emails[0];
  }
  
  // Add confidence scores
  contactData.confidence = calculateConfidence(contactData, text);
  
  return contactData;
}

// Parse structured text to identify name, title, company
function parseStructuredText(lines: string[]): Partial<ContactData> {
  const result: Partial<ContactData> = {};
  
  if (lines.length === 0) return result;
  
  // Common patterns:
  // Pattern 1: Name | Title | Company
  // Pattern 2: Name \n Title \n Company
  // Pattern 3: Name, Title at Company
  
  // Try to identify the largest text as name (often formatted differently)
  let nameIndex = 0;
  let maxLength = lines[0].length;
  
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    if (lines[i].length > maxLength && !hasSpecialChars(lines[i])) {
      maxLength = lines[i].length;
      nameIndex = i;
    }
  }
  
  // Extract name
  const nameLine = lines[nameIndex];
  result.fullName = nameLine;
  const nameParts = nameLine.split(' ');
  if (nameParts.length >= 2) {
    result.firstName = nameParts[0];
    result.lastName = nameParts[nameParts.length - 1];
  }
  
  // Look for title (usually contains title keywords)
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    if (i !== nameIndex && containsTitleKeywords(lines[i])) {
      result.title = lines[i];
      break;
    }
  }
  
  // Look for company (usually after title or name)
  // First, try to find company after the title
  let titleIndex = -1;
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    if (lines[i] === result.title) {
      titleIndex = i;
      break;
    }
  }
  
  // If we found a title, look for company right after it
  if (titleIndex !== -1 && titleIndex + 1 < lines.length) {
    const potentialCompany = lines[titleIndex + 1];
    if (potentialCompany && !hasContactInfo(potentialCompany) && !containsTitleKeywords(potentialCompany)) {
      result.company = potentialCompany;
    }
  }
  
  // If no company found yet, look for any line that could be a company
  if (!result.company) {
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      if (i !== nameIndex && lines[i] !== result.title && lines[i]) {
        // Skip if it looks like contact info
        if (!hasContactInfo(lines[i]) && !containsTitleKeywords(lines[i])) {
          // Check if it looks like a company name (contains common company words or multiple words)
          if (isLikelyCompanyName(lines[i])) {
            result.company = lines[i];
            break;
          }
        }
      }
    }
  }
  
  return result;
}

// Parse LinkedIn headline for title and company
function parseLinkedInHeadline(headline: string): Partial<ContactData> {
  const result: Partial<ContactData> = {};
  
  // Common patterns: "Title at Company", "Title | Company", "Title - Company"
  const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    result.title = atMatch[1].trim();
    result.company = atMatch[2].trim();
    return result;
  }
  
  const pipeMatch = headline.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) {
    result.title = pipeMatch[1].trim();
    result.company = pipeMatch[2].trim();
    return result;
  }
  
  const dashMatch = headline.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    result.title = dashMatch[1].trim();
    result.company = dashMatch[2].trim();
    return result;
  }
  
  // If no clear pattern, assume it's just the title
  result.title = headline;
  return result;
}

// Check if text contains title keywords
function containsTitleKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TITLE_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

// Check if text is likely a company name
function isLikelyCompanyName(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Common company suffixes and words
  const companyIndicators = [
    'llc', 'inc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited',
    'group', 'services', 'solutions', 'systems', 'technologies', 'tech',
    'enterprises', 'consulting', 'associates', 'partners', 'firm', 'agency',
    'studio', 'design', 'marketing', 'media', 'communications', 'bank',
    'financial', 'insurance', 'real estate', 'construction', 'manufacturing',
    'retail', 'restaurant', 'hotel', 'hospital', 'clinic', 'school',
    'university', 'college', 'institute', 'center', 'centre', 'foundation',
    'express', 'auto', 'car', 'wash', 'store', 'shop', 'market'
  ];
  
  // Check if it contains company indicators
  if (companyIndicators.some(indicator => lowerText.includes(indicator))) {
    return true;
  }
  
  // Check if it has multiple words (many company names do)
  const words = text.trim().split(/\s+/);
  if (words.length >= 2 && words.length <= 6) {
    // Check if it doesn't look like a person's name (no common first names)
    const commonFirstNames = ['john', 'jane', 'michael', 'sarah', 'david', 'mary', 'chris', 'jennifer'];
    const firstWord = words[0].toLowerCase();
    if (!commonFirstNames.includes(firstWord)) {
      return true;
    }
  }
  
  return false;
}

// Check if text has special characters indicating contact info
function hasSpecialChars(text: string): boolean {
  return /[@|+().-]/.test(text);
}

// Parse address information from text
function parseAddress(text: string): string | null {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for street addresses
  const streetAddresses = text.match(ADDRESS_REGEX);
  if (streetAddresses && streetAddresses.length > 0) {
    const streetAddress = streetAddresses[0];
    
    // Try to find the complete address by looking for zip codes and states
    const zipCodes = text.match(ZIP_REGEX);
    const states = text.match(STATE_REGEX);
    
    if (zipCodes && states) {
      // Try to find the line that contains the full address
      for (const line of lines) {
        if (line.includes(streetAddress) || (zipCodes.some(zip => line.includes(zip)) && states.some(state => line.includes(state)))) {
          return line;
        }
      }
    }
    
    return streetAddress;
  }
  
  // Look for lines that contain city, state, zip patterns
  for (const line of lines) {
    const zipMatches = line.match(ZIP_REGEX);
    const stateMatches = line.match(STATE_REGEX);
    
    if (zipMatches && stateMatches) {
      // This line likely contains address information
      return line;
    }
  }
  
  return null;
}

// Check if text contains contact information
function hasContactInfo(text: string): boolean {
  return EMAIL_REGEX.test(text) || PHONE_REGEX.test(text) || URL_REGEX.test(text);
}

// Calculate confidence scores for extracted fields
function calculateConfidence(contactData: ContactData, originalText: string): Record<string, number> {
  const confidence: Record<string, number> = {};
  
  // Email confidence (high if valid email format)
  if (contactData.email) {
    confidence.email = EMAIL_REGEX.test(contactData.email) ? 0.95 : 0.5;
  }
  
  // Phone confidence (high if matches phone format)
  if (contactData.phone) {
    confidence.phone = PHONE_REGEX.test(contactData.phone) ? 0.9 : 0.6;
  }
  
  // Name confidence (based on position and format)
  if (contactData.fullName) {
    const nameParts = contactData.fullName.split(' ');
    confidence.fullName = nameParts.length >= 2 && nameParts.length <= 4 ? 0.8 : 0.6;
  }
  
  // Title confidence (based on keywords)
  if (contactData.title) {
    confidence.title = containsTitleKeywords(contactData.title) ? 0.85 : 0.6;
  }
  
  // Company confidence (basic check)
  if (contactData.company) {
    confidence.company = contactData.company.length > 2 && contactData.company.length < 50 ? 0.7 : 0.5;
  }
  
  // LinkedIn confidence (high if proper URL format)
  if (contactData.linkedIn) {
    confidence.linkedIn = LINKEDIN_URL_REGEX.test(contactData.linkedIn) ? 0.95 : 0.5;
  }
  
  // Website confidence
  if (contactData.website) {
    confidence.website = URL_REGEX.test(contactData.website) ? 0.8 : 0.5;
  }
  
  return confidence;
}

// Validate and clean contact data
export function validateContactData(contactData: ContactData): ContactData {
  const cleaned = { ...contactData };
  
  // Clean phone numbers
  if (cleaned.phone) {
    cleaned.phone = cleaned.phone.replace(/\D/g, '').replace(/^1/, '');
    if (cleaned.phone.length === 10) {
      cleaned.phone = `(${cleaned.phone.slice(0, 3)}) ${cleaned.phone.slice(3, 6)}-${cleaned.phone.slice(6)}`;
    }
  }
  
  // Ensure LinkedIn URL is complete
  if (cleaned.linkedIn && !cleaned.linkedIn.startsWith('http')) {
    cleaned.linkedIn = 'https://' + cleaned.linkedIn;
  }
  
  // Ensure website URL is complete
  if (cleaned.website && !cleaned.website.startsWith('http')) {
    cleaned.website = 'https://' + cleaned.website;
  }
  
  // Clean up names
  if (cleaned.fullName) {
    cleaned.fullName = cleaned.fullName.replace(/\s+/g, ' ').trim();
  }
  if (cleaned.firstName) {
    cleaned.firstName = cleaned.firstName.trim();
  }
  if (cleaned.lastName) {
    cleaned.lastName = cleaned.lastName.trim();
  }
  
  return cleaned;
} 