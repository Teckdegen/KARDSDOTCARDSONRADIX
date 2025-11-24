import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAuthCode, isValidEmail, isValidReferralCode } from '@/lib/utils';
import { generateToken } from '@/lib/jwt';
import { sendAuthCode } from '@/lib/resend';
import { generateRadixWallet } from '@/lib/radix-wallet';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, referralCode } = await request.json();

    // Validation
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!referralCode || !isValidReferralCode(referralCode)) {
      return NextResponse.json(
        { success: false, message: 'Valid referral code is required (3-20 alphanumeric characters, dots, underscores)' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if referral code is taken
    const { data: existingCode } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('referral_code', referralCode.toLowerCase())
      .single();

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'This referral code is already taken' },
        { status: 409 }
      );
    }

    // Generate Radix wallet
    const { address: radixAddress, privateKey: radixPrivateKey } = await generateRadixWallet();

    // Encrypt private key
    const encryptedPrivateKey = CryptoJS.AES.encrypt(
      radixPrivateKey,
      process.env.ENCRYPTION_KEY!
    ).toString();

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        referral_code: referralCode.toLowerCase(),
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { success: false, message: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create wallet
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: user.id,
        radix_wallet_address: radixAddress,
        radix_private_key: encryptedPrivateKey,
      });

    if (walletError) {
      console.error('Error creating wallet:', walletError);
      // Rollback user creation
      await supabaseAdmin.from('users').delete().eq('id', user.id);
      return NextResponse.json(
        { success: false, message: 'Failed to create wallet' },
        { status: 500 }
      );
    }

    // Generate and send verification code
    const code = generateAuthCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await supabaseAdmin.from('auth_codes').insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    await sendAuthCode(email, code);

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email for verification code.',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referral_code,
      },
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

