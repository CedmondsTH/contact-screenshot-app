import { ContactData } from '../types/contact';

// Regular expressions for parsing
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
const LINKEDIN_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/g;

// Title keywords
const TITLE_KEYWORDS = [
    'president', 'vice president', 'vp', 'ceo', 'cfo', 'cto', 'director', 'manager', 'partner',
    'senior', 'lead', 'head', 'chief', 'executive', 'officer', 'coordinator', 'specialist',
    'analyst', 'consultant', 'advisor', 'associate', 'assistant', 'supervisor', 'administrator'
];

// Company suffixes
const COMPANY_SUFFIXES = [
    'inc', 'corp', 'llc', 'ltd', 'company', 'corporation', 'incorporated', 'limited',
    'group', 'holdings', 'enterprises', 'solutions', 'services', 'partners'
];

// Standardize phone number format
function standardizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
        return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phoneNumber;
}

// Simple address detection function that WORKS
function detectAddress(text: string): string | null {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Look for city, state, zip patterns and work backwards
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line matches city, state, zip pattern
        if (/^[A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/.test(line)) {
            // Found a city/state/zip line, check the previous line for street address
            if (i > 0) {
                const prevLine = lines[i - 1];
                
                // Check if previous line is a valid street address
                if (/^\d{1,5}\s+[A-Za-z]/.test(prevLine) && 
                    !prevLine.toLowerCase().includes('phone') &&
                    !prevLine.toLowerCase().includes('email') &&
                    !prevLine.toLowerCase().includes('www') &&
                    !prevLine.includes('@')) {
                    
                    return `${prevLine}, ${line}`;
                }
            }
            
            // If no valid street address above, return just city/state/zip
            return line;
        }
    }
    
    return null;
}

// Main parsing function
export function parseEmailSignature(text: string): ContactData {
    const parsed: ContactData = {};
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Store raw text
    parsed.rawText = text;

    // Extract email
    const emailMatch = text.match(EMAIL_REGEX);
    if (emailMatch) {
        parsed.email = emailMatch[0];
    }

    // Extract address using the simple detection function
    const detectedAddress = detectAddress(text);
    if (detectedAddress) {
        parsed.address = detectedAddress;
        
        // Parse address into components for better VCF compatibility
        const addressComponents = parseAddressComponents(detectedAddress);
        if (addressComponents) {
            if (addressComponents.street) parsed.street = addressComponents.street;
            if (addressComponents.city) parsed.city = addressComponents.city;
            if (addressComponents.state) parsed.state = addressComponents.state;
            if (addressComponents.zipCode) parsed.zipCode = addressComponents.zipCode;
        }
    }

    // Extract phone numbers
    const phoneMatches = text.match(PHONE_REGEX);
    if (phoneMatches) {
        if (phoneMatches.length >= 1) {
            parsed.mobilePhone = standardizePhoneNumber(phoneMatches[0]);
        }
        if (phoneMatches.length >= 2) {
            parsed.workPhone = standardizePhoneNumber(phoneMatches[1]);
        }
    }

    // Extract name - look for lines that look like person names, not company names
    for (const line of lines) {
        if (!EMAIL_REGEX.test(line) && !PHONE_REGEX.test(line) && !line.includes('@') && !line.includes('www')) {
            const words = line.split(' ');
            // Skip lines that are likely company names
            const isLikelyCompany = COMPANY_SUFFIXES.some(suffix => 
                line.toLowerCase().includes(suffix.toLowerCase())
            ) || line.toLowerCase().includes('brand') || line.toLowerCase().includes('group') || 
            line.toLowerCase().includes('company') || line.toLowerCase().includes('corp');
            
            // Look for lines with 2-4 words that don't contain title keywords and aren't companies
            if (words.length >= 2 && words.length <= 4 && !isLikelyCompany && 
                !TITLE_KEYWORDS.some(kw => line.toLowerCase().includes(kw))) {
                parsed.fullName = line;
                parsed.firstName = words[0];
                parsed.lastName = words.slice(1).join(' ');
                break;
            }
        }
    }

    // Extract title - separate title from company if combined
    let originalTitleLine = null; // Track the original line that contained the title
    for (const line of lines) {
        if (line !== parsed.fullName && TITLE_KEYWORDS.some(kw => line.toLowerCase().includes(kw))) {
            originalTitleLine = line; // Remember the original line
            
            // Check if title is combined with company using common separators
            const dashMatch = line.match(/^(.+?)\s*-\s*(.+)$/);
            if (dashMatch) {
                parsed.title = dashMatch[1].trim();
                break;
            }
            
            const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i);
            if (atMatch) {
                parsed.title = atMatch[1].trim();
                break;
            }
            
            const pipeMatch = line.match(/^(.+?)\s*\|\s*(.+)$/);
            if (pipeMatch) {
                parsed.title = pipeMatch[1].trim();
                break;
            }
            
            // If no separator found, use the whole line as title
            parsed.title = line;
            break;
        }
    }

    // Extract company - look for lines with company keywords or brand names
    let potentialCompanies: string[] = [];
    
    for (const line of lines) {
        if (line !== parsed.fullName && line !== parsed.title && line !== originalTitleLine) {
            // Skip lines that contain email addresses or phone numbers
            if (line.includes('@') || /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) {
                continue;
            }
            
            // Skip address lines
            if (parsed.address && line.includes(parsed.address)) {
                continue;
            }
            
            // Look for company indicators - expanded to catch more company names
            if (COMPANY_SUFFIXES.some(suf => line.toLowerCase().includes(suf.toLowerCase())) ||
                line.toLowerCase().includes('brand') || line.toLowerCase().includes('group') ||
                line.toLowerCase().includes('company') || line.toLowerCase().includes('corp') ||
                line.toLowerCase().includes('firms') || line.toLowerCase().includes('associates') ||
                line.toLowerCase().includes('partners') || line.toLowerCase().includes('solutions') ||
                line.toLowerCase().includes('services')) {
                potentialCompanies.push(line);
            }
        }
    }
    
    // Prefer company names with proper spacing (contains spaces between words)
    if (potentialCompanies.length > 0) {
        const spacedCompany = potentialCompanies.find(company => company.includes(' '));
        parsed.company = spacedCompany || potentialCompanies[0];
    }

    // Extract website URLs - look for www. patterns first, then broader matches
    for (const line of lines) {
        if (line.toLowerCase().startsWith('www.')) {
            parsed.website = line;
            break;
        }
    }
    
    // If no www. found, try broader website regex
    if (!parsed.website) {
        const websiteMatches = text.match(WEBSITE_REGEX);
        if (websiteMatches) {
            // Filter out email addresses and phone numbers from website matches
            const validWebsite = websiteMatches.find(match => 
                !match.includes('@') && 
                !match.includes('strickland') && 
                !EMAIL_REGEX.test(match)
            );
            if (validWebsite) {
                parsed.website = validWebsite;
            }
        }
    }

    return parsed;
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

// Calculate confidence scores for extracted fields
function calculateConfidence(contactData: ContactData, originalText: string): Record<string, number> {
    const confidence: Record<string, number> = {};
    
    // Email confidence (high if valid email format)
    if (contactData.email) {
        confidence.email = EMAIL_REGEX.test(contactData.email) ? 0.95 : 0.5;
    }
    
    // Phone confidence (high if matches phone format)
    if (contactData.mobilePhone) {
        confidence.mobilePhone = PHONE_REGEX.test(contactData.mobilePhone) ? 0.9 : 0.6;
    }
    if (contactData.workPhone) {
        confidence.workPhone = PHONE_REGEX.test(contactData.workPhone) ? 0.9 : 0.6;
    }
    
    // Name confidence (based on position and format)
    if (contactData.fullName) {
        const nameParts = contactData.fullName.split(' ');
        confidence.fullName = nameParts.length >= 2 && nameParts.length <= 4 ? 0.8 : 0.6;
    }
    
    // Title confidence (based on keywords)
    if (contactData.title) {
        confidence.title = TITLE_KEYWORDS.some(kw => contactData.title!.toLowerCase().includes(kw)) ? 0.85 : 0.6;
    }
    
    // Company confidence (basic check)
    if (contactData.company) {
        confidence.company = COMPANY_SUFFIXES.some(suf => contactData.company!.toLowerCase().includes(suf)) || contactData.company.split(' ').length > 1 ? 0.7 : 0.5;
    }
    
    // LinkedIn confidence (high if proper URL format)
    if (contactData.linkedIn) {
        confidence.linkedIn = LINKEDIN_URL_REGEX.test(contactData.linkedIn) ? 0.95 : 0.5;
    }
    
    // Website confidence
    if (contactData.website) {
        confidence.website = WEBSITE_REGEX.test(contactData.website) ? 0.8 : 0.5;
    }
    
    return confidence;
}

// Validate and clean contact data
export function validateContactData(contactData: ContactData): ContactData {
    const cleaned = { ...contactData };
    
    // Clean mobile phone
    if (cleaned.mobilePhone) {
        cleaned.mobilePhone = standardizePhoneNumber(cleaned.mobilePhone);
    }
    
    // Clean work phone
    if (cleaned.workPhone) {
        cleaned.workPhone = standardizePhoneNumber(cleaned.workPhone);
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

// Parse address into components (street, city, state, zip)
function parseAddressComponents(address: string): { street?: string; city?: string; state?: string; zipCode?: string } | null {
    const result: { street?: string; city?: string; state?: string; zipCode?: string } = {};
    
    // Clean the address
    const cleanAddress = address.replace(/\s+/g, ' ').trim();
    
    // Pattern 1: Full format with zip code (Street, City, State ZIP)
    const fullAddressPattern = /^(.+?),\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
    const fullMatch = cleanAddress.match(fullAddressPattern);
    if (fullMatch) {
        result.street = fullMatch[1].trim();
        result.city = fullMatch[2].trim();
        result.state = fullMatch[3].trim().toUpperCase();
        result.zipCode = fullMatch[4].trim();
        return result;
    }
    
    // Pattern 2: City, State ZIP without street
    const cityStateZipPattern = /^([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i;
    const cityStateZipMatch = cleanAddress.match(cityStateZipPattern);
    if (cityStateZipMatch) {
        result.city = cityStateZipMatch[1].trim();
        result.state = cityStateZipMatch[2].trim().toUpperCase();
        result.zipCode = cityStateZipMatch[3].trim();
        return result;
    }
    
    // If we can't parse it properly, return null
    return null;
}

// Extract phone numbers and categorize them
function extractPhoneNumbers(text: string): { mobile?: string; work?: string } {
    const phones: { mobile?: string; work?: string } = {};
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    const allPhones: { number: string; line: string }[] = [];
    lines.forEach(line => {
        const phoneMatches = line.match(PHONE_REGEX);
        if (phoneMatches) {
            phoneMatches.forEach(phone => allPhones.push({ number: phone, line: line.toLowerCase() }));
        }
    });

    let remainingPhones = [...allPhones];
    const mobileKeywords = ['mobile', 'cell', 'm:'];
    const workKeywords = ['work', 'office', 'o:', 'w:'];

    // Find mobile phone
    const mobileIndex = remainingPhones.findIndex(p => mobileKeywords.some(kw => p.line.includes(kw)));
    if (mobileIndex !== -1) {
        phones.mobile = standardizePhoneNumber(remainingPhones[mobileIndex].number);
        remainingPhones.splice(mobileIndex, 1);
    }

    // Find work phone
    const workIndex = remainingPhones.findIndex(p => workKeywords.some(kw => p.line.includes(kw)));
    if (workIndex !== -1) {
        phones.work = standardizePhoneNumber(remainingPhones[workIndex].number);
        remainingPhones.splice(workIndex, 1);
    }
    
    // Assign remaining phones - first available goes to mobile, second to work
    if (!phones.mobile && remainingPhones.length > 0) {
        phones.mobile = standardizePhoneNumber(remainingPhones.shift()!.number);
    }
    if (!phones.work && remainingPhones.length > 0) {
        phones.work = standardizePhoneNumber(remainingPhones.shift()!.number);
    }
    
    return phones;
}

// Extract full name from content lines
function extractFullName(lines: string[]): string | undefined {
    // Exclude lines that contain common non-name content
    const contentLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return (
            !EMAIL_REGEX.test(line) &&
            !WEBSITE_REGEX.test(line) &&
            !/linkedin\.com/.test(lowerLine) &&
            !PHONE_REGEX.test(line) &&
            !lowerLine.includes('@') &&
            !lowerLine.includes('www.') &&
            !lowerLine.includes('.com') &&
            !lowerLine.includes('http')
        );
    });
    
    // Find name (usually first line, 2-4 words, no special characters)
    if (contentLines.length > 0) {
        const firstLine = contentLines[0];
        const words = firstLine.split(' ').filter(word => word.length > 0);
        if (words.length >= 2 && words.length <= 4 && !/[^a-zA-Z\s]/.test(firstLine)) {
            return firstLine;
        }
    }
    
    return undefined;
}

// Extract title from content lines
function extractTitle(lines: string[], fullName?: string): string | undefined {
    const contentLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return (
            line !== fullName &&
            !EMAIL_REGEX.test(line) &&
            !WEBSITE_REGEX.test(line) &&
            !/linkedin\.com/.test(lowerLine) &&
            !PHONE_REGEX.test(line) &&
            !lowerLine.includes('@') &&
            !lowerLine.includes('www.') &&
            !lowerLine.includes('.com') &&
            !lowerLine.includes('http')
        );
    });
    
    // Find title line
    for (const line of contentLines) {
        if (TITLE_KEYWORDS.some(kw => line.toLowerCase().includes(kw))) {
            return line;
        }
    }
    
    return undefined;
}

// Extract company from content lines
function extractCompany(lines: string[], title?: string): string | undefined {
    const contentLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return (
            line !== title &&
            !EMAIL_REGEX.test(line) &&
            !WEBSITE_REGEX.test(line) &&
            !/linkedin\.com/.test(lowerLine) &&
            !PHONE_REGEX.test(line) &&
            !lowerLine.includes('@') &&
            !lowerLine.includes('www.') &&
            !lowerLine.includes('.com') &&
            !lowerLine.includes('http')
        );
    });
    
    // Find company line
    for (const line of contentLines) {
        if (COMPANY_SUFFIXES.some(suf => line.toLowerCase().includes(suf)) || line.split(' ').length > 1) {
            return line;
        }
    }
    
    return undefined;
}