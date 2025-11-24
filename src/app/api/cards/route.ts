import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const { data: cards, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cards: cards || [],
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in cards list:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

