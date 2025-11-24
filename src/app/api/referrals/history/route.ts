import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { data: referrals, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching referral history:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch referral history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referrals: referrals || [],
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in referral history:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

