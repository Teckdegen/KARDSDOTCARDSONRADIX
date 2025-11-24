import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { cardCode: string } }
) {
  try {
    const user = requireAuth(request);
    const { cardCode } = params;

    // Verify user owns the card
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('user_id', user.userId)
      .eq('card_code', cardCode)
      .single();

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Card not found' },
        { status: 404 }
      );
    }

    // Get full card details from Cashwyre
    const cashwyreData = await callCashwyreAPI('/CustomerCard/getCard', {
      requestId: generateRequestId(),
      cardCode,
    });

    return NextResponse.json({
      success: true,
      card: {
        ...card,
        ...cashwyreData.data,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in card details:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

