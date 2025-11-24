import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Find valid code
    const { data: authCode, error: findError } = await supabaseAdmin
      .from('auth_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !authCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    // Mark code as used
    await supabaseAdmin
      .from('auth_codes')
      .update({ used: true })
      .eq('id', authCode.id);

    // Find or create user
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      // User doesn't exist, they need to register first
      return NextResponse.json(
        { success: false, message: 'Please register first' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Error in verify-code:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

