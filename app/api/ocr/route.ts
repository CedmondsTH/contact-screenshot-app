import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json({ message: 'Image file is required.' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const image = buffer.toString('base64');

    const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
    if (!GOOGLE_API_KEY) {
      console.error('Google Cloud API key is not configured on the server.');
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: image },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );
    
    const data = await response.json();

    if (!response.ok) {
      console.error('Google Vision API Error:', data);
      const error = data.error?.message || 'Failed to process image with Vision API.';
      return NextResponse.json({ message: error }, { status: response.status });
    }
    
    const text = data.responses?.[0]?.fullTextAnnotation?.text;

    if (!text) {
      return NextResponse.json({ message: 'No text could be extracted from the image.' }, { status: 404 });
    }
    
    return NextResponse.json({ text });

  } catch (error) {
    console.error('OCR API Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'OCR processing failed', error: message }, { status: 500 });
  }
} 