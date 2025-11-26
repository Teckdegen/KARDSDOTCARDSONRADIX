const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// Generate 42-character encryption key (21 bytes = 42 hex characters)
const encryptionKey = crypto.randomBytes(21).toString('hex');

// Generate 64-character JWT secret (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('='.repeat(60));
console.log('GENERATED ENCRYPTION KEYS');
console.log('='.repeat(60));
console.log('\n1. ENCRYPTION_KEY (42 characters):');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`   Length: ${encryptionKey.length} characters`);

console.log('\n2. JWT_SECRET (64 characters):');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`   Length: ${jwtSecret.length} characters`);

// Test encryption/decryption
console.log('\n' + '='.repeat(60));
console.log('TESTING ENCRYPTION/DECRYPTION');
console.log('='.repeat(60));

const testData = 'test_private_key_12345';
const encrypted = CryptoJS.AES.encrypt(testData, encryptionKey).toString();
const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8);

console.log('\nOriginal data:', testData);
console.log('Encrypted:', encrypted.substring(0, 50) + '...');
console.log('Decrypted:', decrypted);
console.log('\n✓ Encryption/Decryption works:', testData === decrypted ? 'YES' : 'NO');

console.log('\n' + '='.repeat(60));
console.log('Copy these values to your .env.local file');
console.log('='.repeat(60));

