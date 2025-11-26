import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getBridgeQuote } from '@/lib/bridge-client';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';
import { checkXRDForBridge, getUSDCBalance } from '@/lib/radix-rpc';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const {
      phoneCode,
      phoneNumber,
      dateOfBirth,
      homeAddressNumber,
      homeAddress,
      cardName,
      initialAmount,
      walletAddress,
    } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!initialAmount || initialAmount < 15) {
      return NextResponse.json(
        { success: false, message: 'Initial amount must be at least $15' },
        { status: 400 }
      );
    }

    // Get user details for ETH address creation
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email, eth_deposit_address')
      .eq('id', user.userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Find unused ETH address or create new one
    const { data: unusedCard } = await supabaseAdmin
      .from('cards')
      .select('card_wallet_address')
      .eq('user_id', user.userId)
      .eq('status', 'processing')
      .is('card_code', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let ethAddress: string;
    
    if (unusedCard?.card_wallet_address) {
      ethAddress = unusedCard.card_wallet_address;
    } else {
      // Create new ETH address for this card
      const cryptoAddressResponse = await callCashwyreAPI('/CustomerCryptoAddress/createCryptoAddress', {
        requestId: generateRequestId(),
        FirstName: userData.first_name,
        LastName: userData.last_name,
        Email: userData.email,
        AssetType: 'ETH',
        Network: 'USDC',
        Amount: 0.0001,
      });

      ethAddress = cryptoAddressResponse.data.address;
    }

    // Check USDC balance for card amount
    const usdcBalance = await getUSDCBalance(walletAddress);
    if (usdcBalance < initialAmount) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. You need $${initialAmount} USDC. You have $${usdcBalance.toFixed(2)} USDC` },
        { status: 400 }
      );
    }

    // Check XRD balance for bridge
    const xrdBridgeCheck = await checkXRDForBridge(walletAddress);
    if (!xrdBridgeCheck.hasEnough) {
      return NextResponse.json(
        { success: false, message: `Insufficient XRD for bridge transaction. You need roughly 410 XRD. Current: ${xrdBridgeCheck.balance.toFixed(2)} XRD` },
        { status: 400 }
      );
    }

    // Get bridge quote
    const bridgeQuote = await getBridgeQuote(initialAmount, walletAddress, ethAddress);
    const manifest = bridgeQuote.route.tx.manifest;

    return NextResponse.json({
      success: true,
      manifest,
      quote: bridgeQuote,
      ethAddress,
    });
  } catch (error: any) {
    console.error('Error in bridge quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

