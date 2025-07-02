// Direct test of the parser logic by importing it
import { parseEmailSignature } from './lib/parser.js';

const testOCRText = `Chris Presswood
Partner / Senior Vice President - Mammoth Holdings
chris.p@mammothholdings.com | 270-210-3392
Mammoth Holdings - Mid West Corporate Office
270-575-4990
3510 Park Avenue
Paducah, KY 42001
A
www.mammothholdings.com`;

console.log('Testing parser directly...');
console.log('Input text:');
console.log(testOCRText);
console.log('');

try {
    const result = parseEmailSignature(testOCRText);
    console.log('Parser result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.address) {
        console.log('');
        console.log('🔍 Address found:', result.address);
        console.log('Expected: 3510 Park Avenue, Paducah, KY 42001');
        console.log('Match:', result.address === '3510 Park Avenue, Paducah, KY 42001' ? '✅ SUCCESS!' : '❌ FAILED');
    } else {
        console.log('❌ No address in result');
    }
} catch (error) {
    console.error('❌ Parser Error:', error);
} 