import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardCode: string }> }
) {
  try {
    const user = requireAuth(request);
    const { cardCode } = await params;

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

    // Call Cashwyre unfreeze API
    await callCashwyreAPI('/Customer/unfreezeCard', {
      requestId: generateRequestId(),
      cardCode,
    });

    // Update card status
    await supabaseAdmin
      .from('cards')
      .update({ status: 'active' })
      .eq('id', card.id);

    return NextResponse.json({
      success: true,
      message: 'Card unfrozen successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in unfreeze card:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

