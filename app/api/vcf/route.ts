import { NextResponse } from 'next/server';
import { type ContactData } from '../../../types/contact';

export async function POST(request: Request) {
  try {
    const contact: ContactData = await request.json();

    if (!contact) {
      return NextResponse.json({ message: 'Contact data is required.' }, { status: 400 });
    }

    // Try vCard 2.1 format with Microsoft-specific properties
    const vcfLines: string[] = [];
    
    vcfLines.push('BEGIN:VCARD');
    vcfLines.push('VERSION:2.1'); // Use version 2.1 instead of 3.0
    
    // Microsoft-specific properties for display name control
    if (contact.fullName) {
      vcfLines.push(`FN:${contact.fullName}`);
      // Try Microsoft-specific display name property
      vcfLines.push(`X-MS-OL-DN:${contact.fullName}`);
      vcfLines.push(`X-OUTLOOK-DN:${contact.fullName}`);
      
      // Split name for N field but prioritize FN
      const nameParts = contact.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      vcfLines.push(`N:${lastName};${firstName};;;`);
    }
    
    // Add other contact fields
    if (contact.title) {
      vcfLines.push(`TITLE:${contact.title}`);
    }
    
    if (contact.company) {
      vcfLines.push(`ORG:${contact.company}`);
    }
    
    if (contact.email) {
      // Try different email formats for better Outlook compatibility
      vcfLines.push(`EMAIL;PREF;INTERNET:${contact.email}`);
      vcfLines.push(`EMAIL:${contact.email}`);
    }
    
    if (contact.mobilePhone) {
      vcfLines.push(`TEL;CELL:${contact.mobilePhone}`);
    }
    
    if (contact.workPhone) {
      vcfLines.push(`TEL;WORK:${contact.workPhone}`);
    }
    
    // Handle address - use structured fields if available, otherwise use general address
    if (contact.street || contact.city || contact.state || contact.zipCode) {
      const street = contact.street || '';
      const city = contact.city || '';
      const state = contact.state || '';
      const zipCode = contact.zipCode || '';
      const country = contact.country || '';
      
      // Try multiple address formats for better Outlook compatibility
      // Format 1: Standard ADR field
      vcfLines.push(`ADR;WORK:;;${street};${city};${state};${zipCode};${country}`);
      
      // Format 2: Alternative with street on first line, city/state/zip on second
      const line1 = street;
      const line2 = [city, state, zipCode].filter(Boolean).join(', ');
      if (line1 && line2) {
        vcfLines.push(`ADR;HOME:;;${line1};${line2};;;${country}`);
      }
      
      // Format 3: Microsoft-specific address fields
      if (street) vcfLines.push(`X-MS-OL-STREET:${street}`);
      if (city) vcfLines.push(`X-MS-OL-CITY:${city}`);
      if (state) vcfLines.push(`X-MS-OL-STATE:${state}`);
      if (zipCode) vcfLines.push(`X-MS-OL-POSTALCODE:${zipCode}`);
      
    } else if (contact.address) {
      // Parse the full address and try to split it
      const addressParts = contact.address.split(',').map(part => part.trim());
      if (addressParts.length >= 2) {
        const street = addressParts[0];
        const cityStateZip = addressParts.slice(1).join(', ');
        vcfLines.push(`ADR;WORK:;;${street};${cityStateZip};;;`);
      } else {
        vcfLines.push(`ADR;WORK:;;${contact.address};;;`);
      }
    }
    
    // Add additional Microsoft-specific properties to force proper display
    if (contact.fullName) {
      vcfLines.push(`X-MS-OL-DESIGN;CHARSET=utf-8:<card xmlns="http://schemas.microsoft.com/office/outlook/12/electronicbusinesscards" ver="1.0" layout="left" bgcolor="ffffff"><img xmlns="" align="tleft" area="32" use="photo"/><fld xmlns="" prop="name" align="left" dir="ltr" style="b" color="000000" size="10"/><fld xmlns="" prop="org" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="title" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="dept" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="telwork" align="left" dir="ltr" color="000000" size="8"><label>Work</label></fld><fld xmlns="" prop="telhome" align="left" dir="ltr" color="000000" size="8"><label>Home</label></fld><fld xmlns="" prop="email" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="addrwork" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="addrhome" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="webwork" align="left" dir="ltr" color="000000" size="8"/><fld xmlns="" prop="blank" size="8"/><fld xmlns="" prop="blank" size="8"/><fld xmlns="" prop="blank" size="8"/><fld xmlns="" prop="blank" size="8"/><fld xmlns="" prop="blank" size="8"/><fld xmlns="" prop="blank" size="8"/></card>`);
    }
    
    vcfLines.push('END:VCARD');
    
    const vcfContent = vcfLines.join('\r\n');
    
    return new NextResponse(vcfContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${contact.fullName || 'contact'}.vcf"`,
      },
    });
  } catch (error) {
    console.error('VCF API Error:', error);
    return NextResponse.json({ message: 'Failed to generate VCF file.' }, { status: 500 });
  }
} 