import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

// Generate unique request ID (starts with KARDS, followed by alphanumeric only)
export function generateRequestId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 12; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KARDS${randomPart}`;
}

// Encrypt data
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

// Decrypt data
export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Generate 6-digit code
export function generateAuthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate referral code (username-style)
export function isValidReferralCode(code: string): boolean {
  // Alphanumeric, dots, underscores, 3-20 characters
  const codeRegex = /^[a-zA-Z0-9._]{3,20}$/;
  return codeRegex.test(code);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Calculate top-up amount (minus processing fee)
export function calculateTopUpAmount(amount: number): number {
  const PROCESSING_FEE = 2.5;
  return Math.max(0, amount - PROCESSING_FEE);
}

