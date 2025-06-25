# Contact Screenshot App

A Next.js application that converts screenshots of email signatures and LinkedIn profiles into VCF contact cards using advanced OCR technology.

## Features

- **Advanced OCR Processing**: Uses Google Cloud Vision API (primary) with Tesseract.js fallback
- **Smart Contact Parsing**: Extracts names, emails, phone numbers, companies, and job titles
- **Ultra-Conservative LinkedIn Detection**: Only includes LinkedIn URLs that are explicitly found and validated
- **VCF Export**: Generates standard VCF contact cards for easy import
- **Drag & Drop Interface**: Easy file upload with progress tracking
- **Real-time Processing**: Fast OCR processing with visual feedback

## Technology Stack

- **Frontend**: Next.js 15.3.4, React, TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Google Cloud Vision API, Tesseract.js
- **File Processing**: VCF generation, Base64 encoding

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Google Cloud API key (for Vision API)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd contact-screenshot-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# Create .env.local file
echo "GOOGLE_CLOUD_API_KEY=your_api_key_here" > .env.local
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `GOOGLE_CLOUD_API_KEY`: Your Google Cloud Vision API key (required for best OCR accuracy)

## Deployment

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set the environment variable `GOOGLE_CLOUD_API_KEY` in Railway dashboard
3. Railway will automatically build and deploy your app

### Build Commands
- Build: `npm run build`
- Start: `npm start`
- Dev: `npm run dev`

## Usage

1. **Upload Screenshots**: Drag and drop or click to upload screenshots of email signatures or LinkedIn profiles
2. **Processing**: The app uses Google Cloud Vision API for high-accuracy OCR
3. **Review Results**: Check the extracted contact information
4. **Download VCF**: Click "Download VCF" to save the contact card

## OCR Accuracy

- **Google Cloud Vision API**: ~95% accuracy
- **Tesseract.js Fallback**: ~70% accuracy
- **Processing Time**: ~800ms average

## LinkedIn URL Validation

The app uses ultra-conservative LinkedIn URL detection:
- URLs must be explicitly found in the screenshot
- Profile names must match the detected person's name
- Strict format validation prevents false positives
- Better to have no LinkedIn URL than the wrong one

## License

MIT License - feel free to use this project for your own purposes. 