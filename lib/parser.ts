import { ContactData } from '../types/contact';

// Regular expressions for common patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi;
const LINKEDIN_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[^\s<>"{}|\\^`[\]]+/gi;
const PHONE_REGEX = /(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const ADDRESS_REGEX = /(\d{1,5}\s+[\w\s.-]+?,\s+[A-Z]{2,}\s+\d{5}(-\d{4})?)/;

const TITLE_KEYWORDS = ['partner', 'president', 'ceo', 'cto', 'cfo', 'vp', 'vice president', 'director', 'manager', 'lead', 'senior', 'associate', 'analyst', 'consultant', 'engineer', 'developer', 'specialist', 'advisor'];
const COMPANY_SUFFIXES = ['inc', 'llc', 'ltd', 'corp', 'co', 'group', 'advisors', 'holdings', 'corporate', 'capital', 'bank', 'financial'];

function standardizePhoneNumber(phoneNumber: string): string {
    const digits = phoneNumber.replace(/[^\d]/g, '');
    if (digits.length === 10) {
        return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
    }
    if (digits.length === 11 && (digits.startsWith('1') || digits.startsWith('0'))) {
        const cleanDigits = digits.substring(1);
        return `(${cleanDigits.substring(0, 3)}) ${cleanDigits.substring(3, 6)}-${cleanDigits.substring(6, 10)}`;
    }
    return phoneNumber;
}

export function parseEmailSignature(text: string): ContactData {
    const parsed: ContactData = {};
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    // Store raw text for reference
    parsed.rawText = text;

    // Extract email
    const emailMatch = text.match(EMAIL_REGEX);
    if (emailMatch) {
        parsed.email = emailMatch[0];
    }

    // Extract LinkedIn
    const linkedinMatch = text.match(LINKEDIN_URL_REGEX);
    if (linkedinMatch) {
        parsed.linkedIn = linkedinMatch[0];
    }

    // Extract website
    const websiteMatches = text.match(WEBSITE_REGEX);
    if (websiteMatches) {
        const sites = websiteMatches.filter(
            (site) =>
            (!parsed.email || !site.includes(parsed.email.split('@')[1])) &&
            !site.includes('linkedin.com') &&
            site.includes('.')
        );
        if (sites.length > 0) {
            parsed.website = sites.sort((a, b) => b.length - a.length)[0];
        }
    }
    
    // Extract address
    const addressMatch = text.match(ADDRESS_REGEX);
    if (addressMatch) {
        parsed.address = addressMatch[0].replace(/, ,/g, ',').trim();
    }
    
    // Extract and categorize phone numbers
    const allPhones: { number: string; line: string }[] = [];
    lines.forEach(line => {
        const phones = line.match(PHONE_REGEX);
        if (phones) {
            phones.forEach(phone => allPhones.push({ number: phone, line: line.toLowerCase() }));
        }
    });

    let remainingPhones = [...allPhones];
    const mobileKeywords = ['mobile', 'cell', 'm:'];
    const workKeywords = ['work', 'office', 'o:', 'w:'];

    // Find mobile phone
    const mobileIndex = remainingPhones.findIndex(p => mobileKeywords.some(kw => p.line.includes(kw)));
    if (mobileIndex !== -1) {
        parsed.mobilePhone = standardizePhoneNumber(remainingPhones[mobileIndex].number);
        remainingPhones.splice(mobileIndex, 1);
    }

    // Find work phone
    const workIndex = remainingPhones.findIndex(p => workKeywords.some(kw => p.line.includes(kw)));
    if (workIndex !== -1) {
        parsed.workPhone = standardizePhoneNumber(remainingPhones[workIndex].number);
        remainingPhones.splice(workIndex, 1);
    }
    
    // Assign remaining phones - first available goes to mobile, second to work
    if (!parsed.mobilePhone && remainingPhones.length > 0) {
        parsed.mobilePhone = standardizePhoneNumber(remainingPhones.shift()!.number);
    }
    if (!parsed.workPhone && remainingPhones.length > 0) {
        parsed.workPhone = standardizePhoneNumber(remainingPhones.shift()!.number);
    }

    // Extract name, title, and company from remaining content lines
    const contentLines = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return (
            !lowerLine.includes(parsed.email || 'nonexistent') &&
            !lowerLine.includes(parsed.website || 'nonexistent') &&
            !/linkedin\.com/.test(lowerLine) &&
            !PHONE_REGEX.test(lowerLine) &&
            !ADDRESS_REGEX.test(lowerLine)
        );
    });
    
    let nameLineIndex = -1;
    let titleLineIndex = -1;
    
    // Find name (usually first line, 2-4 words)
    if (contentLines.length > 0) {
        const firstLine = contentLines[0];
        const words = firstLine.split(' ');
        if (words.length >= 2 && words.length <= 4) {
            parsed.fullName = firstLine;
            parsed.firstName = words[0];
            parsed.lastName = words[words.length - 1];
            nameLineIndex = 0;
        }
    }

    // Find title line
    for (let i = 0; i < contentLines.length; i++) {
        if (i === nameLineIndex) continue;
        const line = contentLines[i];
        if (TITLE_KEYWORDS.some(kw => line.toLowerCase().includes(kw))) {
            parsed.title = line;
            titleLineIndex = i;
            break;
        }
    }

    // Find company line
    for (let i = 0; i < contentLines.length; i++) {
        if (i === nameLineIndex || i === titleLineIndex) continue;
        const line = contentLines[i];
        if (COMPANY_SUFFIXES.some(suf => line.toLowerCase().includes(suf)) || line.split(' ').length > 1) {
            parsed.company = line;
            break;
        }
    }

    // Refine: if company is mentioned in title, separate it
    if (parsed.title && !parsed.company) {
        const titleParts = parsed.title.split(/,|-|\/| at /);
        if (titleParts.length > 1) {
            const lastPart = titleParts[titleParts.length - 1].trim();
            if (COMPANY_SUFFIXES.some(suf => lastPart.toLowerCase().includes(suf)) || lastPart.split(' ').length > 1) {
                parsed.company = lastPart;
                parsed.title = titleParts.slice(0, -1).join(', ').trim();
            }
        }
    }

    // Clean up title if it contains company name
    if (parsed.title && parsed.company && parsed.title.toLowerCase().includes(parsed.company.toLowerCase())) {
        parsed.title = parsed.title.replace(new RegExp(parsed.company, 'i'), '').replace(/(\s-)?\s*$/, '').trim();
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