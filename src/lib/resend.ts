import { Resend } from 'resend';

// Use placeholder API key for build time, actual key will be used at runtime in Vercel
const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_key_for_build';
const resend = new Resend(resendApiKey);

export async function sendAuthCode(email: string, code: string): Promise<void> {
  try {
    await resend.emails.send({
      from: 'KARDS <noreply@assetid.site>',
      to: email,
      subject: 'Your KARDS Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0A0E27;">Welcome to KARDS</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #F5F5DC; font-size: 32px; letter-spacing: 4px;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification code');
  }
}

