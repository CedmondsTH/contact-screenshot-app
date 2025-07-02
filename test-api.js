// Test the OCR API with the exact text from the user's screenshot
const testOCRText = `Chris Presswood
Partner / Senior Vice President - Mammoth Holdings
chris.p@mammothholdings.com | 270-210-3392
Mammoth Holdings - Mid West Corporate Office
270-575-4990
3510 Park Avenue
Paducah, KY 42001
A
www.mammothholdings.com`;

// Create a mock multipart form data for testing
fetch('http://localhost:3000/api/ocr', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
        image: 'data:image/png;base64,fake', // Mock image data
        mockText: testOCRText // Pass the text directly for testing
    })
})
.then(response => response.json())
.then(data => {
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.contact && data.contact.address) {
        console.log('🔍 Address found:', data.contact.address);
        console.log('Expected: 3510 Park Avenue, Paducah, KY 42001');
        console.log('Match:', data.contact.address === '3510 Park Avenue, Paducah, KY 42001' ? '✅ SUCCESS!' : '❌ FAILED');
    } else {
        console.log('❌ No address in response');
    }
})
.catch(error => {
    console.error('❌ API Error:', error);
}); 