# Contact Screenshot App

Convert email signatures and LinkedIn profiles into downloadable contact cards (.vcf files) using OCR technology.

## 🚀 **Live Demo**
Deploy this app to see it in action!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CedmondsTH/contact-screenshot-app)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/contact-screenshot-app)

## ✨ **Features**

- 📧 **Email Signature Processing**: Extract contact info from email signature screenshots
- 💼 **LinkedIn Profile Processing**: Convert LinkedIn profiles to contact cards  
- 📱 **VCF File Generation**: Compatible with Outlook, Apple Contacts, and more
- 🖼️ **Drag & Drop Upload**: Easy file upload with preview
- 📋 **Clipboard Support**: Paste screenshots directly with Ctrl+V
- ✏️ **Editable Fields**: Review and edit extracted information before download
- 🏠 **Address Support**: Automatically detect and include addresses
- 🔍 **OCR Technology**: Powered by Tesseract.js for accurate text extraction
- 📦 **Batch Processing**: Download multiple contacts at once

## 🛠️ **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/CedmondsTH/contact-screenshot-app.git
cd contact-screenshot-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 **How to Use**

1. **Take a Screenshot**: Use `Win + Shift + S` on Windows to capture email signatures or LinkedIn profiles
2. **Paste or Upload**: Press `Ctrl + V` to paste directly, or drag & drop image files
3. **Review & Edit**: Check the extracted information and make any necessary corrections
4. **Download**: Get your VCF contact card(s) ready for import

## 🏗️ **Tech Stack**

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Tesseract.js
- **Contact Cards**: vcards-js
- **File Handling**: react-dropzone

## 🚀 **Deployment**

### Vercel (Recommended)
1. Fork this repository
2. Connect your GitHub account to [Vercel](https://vercel.com)
3. Import the project - Vercel will auto-configure everything
4. Deploy with one click!

### Railway
1. Connect your GitHub account to [Railway](https://railway.app)
2. Deploy from GitHub repo
3. Railway will use the included `railway.json` configuration

### Other Platforms
The app works on any platform that supports Next.js:
- Netlify
- AWS Amplify  
- Digital Ocean App Platform
- Heroku

## 🔧 **Environment Variables**
No environment variables required! The app runs entirely client-side for privacy.

## 📄 **Recent Updates**

- ✅ Added address field support
- ✅ Fixed contact editing functionality  
- ✅ Improved VCF format compatibility
- ✅ Enhanced phone number display in Outlook
- ✅ Removed app branding from contact notes
- ✅ Added clipboard paste support
- ✅ Improved OCR accuracy for LinkedIn profiles

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 **License**

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Ensure you're using a modern browser with clipboard API support
3. Try with different image formats (PNG, JPG, WebP)
4. Make sure images are clear and text is readable

---

Built with ❤️ using Next.js, Tailwind CSS, and Tesseract.js OCR 