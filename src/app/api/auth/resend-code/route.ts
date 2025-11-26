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

    // Check if there's an existing code that hasn't expired yet
    const { data: existingCode } = await supabaseAdmin
      .from('auth_codes')
      .select('expires_at, created_at')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If code exists and hasn't expired, check if 10 minutes have passed since creation
    if (existingCode) {
      const createdAt = new Date(existingCode.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      // Only allow resend if 10 minutes have passed (code expired)
      if (minutesSinceCreation < 10) {
        const remainingMinutes = Math.ceil(10 - minutesSinceCreation);
        return NextResponse.json(
          { 
            success: false, 
            message: `Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} before requesting a new code`,
            canResend: false,
            remainingSeconds: Math.ceil((10 - minutesSinceCreation) * 60)
          },
          { status: 400 }
        );
      }
    }

    // Mark all previous codes for this email as used
    await supabaseAdmin
      .from('auth_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Generate new 6-digit code
    const code = generateAuthCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store new code in database
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
      message: 'New verification code sent to your email',
    });
  } catch (error: any) {
    console.error('Error in resend-code:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

