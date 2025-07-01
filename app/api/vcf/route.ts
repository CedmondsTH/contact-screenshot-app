import { NextResponse } from 'next/server';
import vCardsJS from 'vcards-js';
import { type ContactData } from '../../../types/contact';

export async function POST(request: Request) {
  try {
    const contact: ContactData = await request.json();

    if (!contact) {
      return NextResponse.json({ message: 'Contact data is required.' }, { status: 400 });
    }

    const card = vCardsJS();

    card.firstName = contact.firstName || '';
    card.lastName = contact.lastName || '';
    card.organization = contact.company || '';
    card.title = contact.title || '';
    card.email = contact.email || '';
    card.cellPhone = contact.mobilePhone || '';
    card.workPhone = contact.workPhone || '';
    card.url = contact.website || '';
    
    if (contact.address) {
      card.homeAddress.street = contact.address;
    }

    const vcfString = card.getFormattedString();
    const filename = `${contact.firstName || 'contact'}_${contact.lastName || ''}.vcf`.replace(/^_/, '').replace(/_$/, '');

    return new NextResponse(vcfString, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating vCard:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Failed to generate vCard.', error: message }, { status: 500 });
  }
} 