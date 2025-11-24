import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get user's cashback information
 * Shows total cashback earned, available, and history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get user's total cashback from referrals
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('total_earnings, weekly_earnings')
      .eq('id', user.userId)
      .single();

    // Get cashback claim history
    const { data: claims } = await supabaseAdmin
      .from('cashback_claims')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      cashback: {
        totalEarned: userData?.total_earnings || 0,
        available: userData?.weekly_earnings || 0,
        claimed: (userData?.total_earnings || 0) - (userData?.weekly_earnings || 0),
        history: claims || [],
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in cashback:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

