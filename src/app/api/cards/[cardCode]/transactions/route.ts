import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardCode: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { cardCode } = await params;

    // Verify user owns the card
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('user_id', user.userId)
      .eq('card_code', cardCode)
      .single();

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Card not found' },
        { status: 404 }
      );
    }

    // Get transactions from Cashwyre API (not stored in database)
    const cashwyreData = await callCashwyreAPI('/CustomerCard/getCardTransactions', {
      requestId: generateRequestId(),
      cardCode,
    });

    return NextResponse.json({
      success: true,
      transactions: cashwyreData.CardTransactions || [],
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in card transactions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

