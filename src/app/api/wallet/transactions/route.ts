import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // Get transactions from database (Radix transactions are stored when they occur)
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', user.userId)
      .in('type', ['radix_send', 'radix_receive'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in wallet transactions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

