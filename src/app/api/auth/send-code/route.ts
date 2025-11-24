import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAuthCode, isValidEmail } from '@/lib/utils';
import { sendAuthCode } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = generateAuthCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store code in database
    const { error } = await supabaseAdmin
      .from('auth_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (error) {
      console.error('Error storing auth code:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to generate code' },
        { status: 500 }
      );
    }

    // Send email
    await sendAuthCode(email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error: any) {
    console.error('Error in send-code:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

