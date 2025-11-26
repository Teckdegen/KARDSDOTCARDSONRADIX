import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateTopUpAmount } from '@/lib/utils';
import { submitTransaction } from '@/lib/radix-rpc';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardCode: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { cardCode } = await params;
    const { amount, transactionHash, walletAddress } = await request.json();

    // Validation
    if (!amount || amount < 6) {
      return NextResponse.json(
        { success: false, message: 'Minimum top-up amount is $6 USDC' },
        { status: 400 }
      );
    }

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

    if (!card.card_wallet_address) {
      return NextResponse.json(
        { success: false, message: 'Card wallet address not found' },
        { status: 404 }
      );
    }

    // Validate transaction hash
    if (!transactionHash) {
      return NextResponse.json(
        { success: false, message: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Calculate amounts
    const PROCESSING_FEE = 2.5;
    const cardAmount = calculateTopUpAmount(amount);

    // Transaction was already submitted by the client
    // We just need to store it and create the transaction record
    const bridgeHash = transactionHash;

    // Create pending transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.userId,
      card_id: card.id,
      type: 'top_up',
      amount: cardAmount,
      fee: PROCESSING_FEE,
      status: 'pending',
      hash: bridgeHash,
      description: `Top-up card ${cardCode}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Top-up initiated. Processing...',
      transactionHash: bridgeHash,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in top-up:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

