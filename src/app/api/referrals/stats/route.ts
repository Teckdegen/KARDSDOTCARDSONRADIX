import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('total_earnings, weekly_earnings, total_referrals')
      .eq('id', user.userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      weeklyEarnings: userData.weekly_earnings || 0,
      allTimeEarnings: userData.total_earnings || 0,
      referralCount: userData.total_referrals || 0,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in referral stats:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

