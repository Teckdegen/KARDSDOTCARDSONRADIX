import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);

    // Get top referrers for the week
    const { data: leaderboard, error } = await supabaseAdmin
      .from('users')
      .select('referral_code, weekly_earnings, total_referrals')
      .order('weekly_earnings', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leaderboard: leaderboard?.map((user, index) => ({
        rank: index + 1,
        referralCode: user.referral_code,
        weeklyEarnings: user.weekly_earnings || 0,
        referralCount: user.total_referrals || 0,
      })) || [],
    });
  } catch (error: any) {
    console.error('Error in leaderboard:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

