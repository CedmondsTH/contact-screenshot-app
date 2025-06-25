import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, provider } = await request.json();

    if (provider === 'google') {
      // Google Cloud Vision API
      const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
      
      console.log('Environment variables check:', {
        hasKey: !!GOOGLE_API_KEY,
        keyLength: GOOGLE_API_KEY?.length,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
      });
      
      if (!GOOGLE_API_KEY) {
        throw new Error('Google Cloud API key not configured');
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
                image: {
                  content: image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
        const text = data.responses[0].textAnnotations[0].description;
        return NextResponse.json({ text, provider: 'google' });
      }
      
      throw new Error('No text detected');
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 