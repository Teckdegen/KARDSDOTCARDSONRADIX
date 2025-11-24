import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/utils';
import { getBridgeQuote } from '@/lib/bridge-client';
import { calculateTopUpAmount } from '@/lib/utils';
import { signAndSubmitManifest } from '@/lib/radix-engine';
import { checkXRDForBridge, getUSDCBalance } from '@/lib/radix-rpc';

export async function POST(
  request: NextRequest,
  { params }: { params: { cardCode: string } }
) {
  try {
    const user = requireAuth(request);
    const { cardCode } = params;
    const { amount } = await request.json();

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

    // Get user's wallet
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('radix_wallet_address, radix_private_key')
      .eq('user_id', user.userId)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Calculate amounts
    const PROCESSING_FEE = 2.5;
    const cardAmount = calculateTopUpAmount(amount);
    const TOTAL_NEEDED = amount; // User needs to have the full amount (fee is deducted from it)

    // Check USDC balance
    const usdcBalance = await getUSDCBalance(wallet.radix_wallet_address);
    if (usdcBalance < TOTAL_NEEDED) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. You need $${TOTAL_NEEDED} USDC. You have $${usdcBalance.toFixed(2)} USDC` },
        { status: 400 }
      );
    }

    // Check XRD balance for bridge transaction (needs ~410 XRD)
    const xrdBridgeCheck = await checkXRDForBridge(wallet.radix_wallet_address);
    if (!xrdBridgeCheck.hasEnough) {
      return NextResponse.json(
        { success: false, message: `Insufficient XRD for bridge transaction. You need roughly 410 XRD for Ethereum tx cost and bridge fee. Current: ${xrdBridgeCheck.balance.toFixed(2)} XRD` },
        { status: 400 }
      );
    }

    // Get bridge quote - inputAmount is what user wants to fund the card with
    const privateKey = decrypt(wallet.radix_private_key);
    const bridgeQuote = await getBridgeQuote(amount, wallet.radix_wallet_address, card.card_wallet_address);
    const manifest = bridgeQuote.route.tx.manifest;

    // Sign and submit bridge transaction
    const bridgeHash = await signAndSubmitManifest(manifest, privateKey);

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

