import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId, decrypt } from '@/lib/utils';
import { getBridgeQuote } from '@/lib/bridge-client';
import { buildTransferManifest, signAndSubmitManifest } from '@/lib/radix-engine';
import { checkXRDForGas, checkXRDForBridge, getUSDCBalance } from '@/lib/radix-rpc';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const {
      phoneCode,
      phoneNumber,
      dateOfBirth,
      homeAddressNumber,
      homeAddress,
      cardName,
      referralCode,
      initialAmount,
    } = await request.json();

    // Card type and brand are always fixed
    const cardType = 'virtual';
    const cardBrand = 'visa';

    // Validation
    if (!phoneCode || !phoneNumber || !dateOfBirth || !homeAddressNumber || !homeAddress || !cardName) {
      return NextResponse.json(
        { success: false, message: 'All card details are required' },
        { status: 400 }
      );
    }

    if (!initialAmount || initialAmount < 15) {
      return NextResponse.json(
        { success: false, message: 'Initial amount must be at least $15' },
        { status: 400 }
      );
    }

    // Check if user has less than 4 cards
    const { count } = await supabaseAdmin
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId);

    if (count && count >= 4) {
      return NextResponse.json(
        { success: false, message: 'Maximum 4 cards allowed per user' },
        { status: 400 }
      );
    }

    // Get user details
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

    // Find unused ETH address from previous cancelled card creations, or create new one
    // Check for cards with status 'processing' that don't have a card_code yet (cancelled/incomplete)
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
      // Reuse unused ETH address from cancelled card creation
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

    // Charge: $10 insurance + user's initial amount to card
    const INSURANCE_FEE = 10;
    const CARD_AMOUNT = initialAmount; // Amount user wants to fund the card with
    const TOTAL_AMOUNT = INSURANCE_FEE + CARD_AMOUNT;

    // Check USDC balance
    const usdcBalance = await getUSDCBalance(wallet.radix_wallet_address);
    if (usdcBalance < TOTAL_AMOUNT) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. You need $${TOTAL_AMOUNT} USDC ($${INSURANCE_FEE} insurance + $${CARD_AMOUNT} to card). You have $${usdcBalance.toFixed(2)} USDC` },
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

    // Get insurance wallet address
    const insuranceWalletAddress = process.env.CASHBACK_WALLET_ADDRESS!;
    if (!insuranceWalletAddress) {
      return NextResponse.json(
        { success: false, message: 'Insurance wallet not configured' },
        { status: 500 }
      );
    }

    // Decrypt private key
    const privateKey = decrypt(wallet.radix_private_key);

    // Step 1: Send $10 USDC to insurance wallet
    const insuranceManifest = await buildTransferManifest(
      wallet.radix_wallet_address,
      insuranceWalletAddress,
      INSURANCE_FEE
    );
    const insuranceHash = await signAndSubmitManifest(insuranceManifest, privateKey);

    // Store form data for webhook use
    const formData = {
      phoneCode,
      phoneNumber,
      dateOfBirth,
      homeAddressNumber,
      homeAddress,
      cardName,
      cardType,
      cardBrand,
      initialAmount,
    };

    // Create pending card record
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: user.userId,
        card_wallet_address: ethAddress,
        card_name: cardName,
        card_type: cardType,
        card_brand: cardBrand,
        status: 'processing',
        form_data: formData, // Store form data for webhook
      })
      .select()
      .single();

    if (cardError || !card) {
      console.error('Error creating card record:', cardError);
      return NextResponse.json(
        { success: false, message: 'Failed to create card' },
        { status: 500 }
      );
    }

    // Step 2: Bridge the amount user wants to fund the card with (from Radix to ETH)
    const bridgeQuote = await getBridgeQuote(CARD_AMOUNT, wallet.radix_wallet_address, ethAddress);
    const bridgeManifest = bridgeQuote.route.tx.manifest;
    
    // Sign and submit bridge transaction
    const bridgeHash = await signAndSubmitManifest(bridgeManifest, privateKey);

    // Store transactions
    await supabaseAdmin.from('transactions').insert([
      {
        user_id: user.userId,
        card_id: card.id,
        type: 'insurance_fee',
        amount: INSURANCE_FEE,
        status: 'success',
        hash: insuranceHash,
        recipient_address: insuranceWalletAddress,
        sender_address: wallet.radix_wallet_address,
        description: 'Card creation insurance fee ($10 USDC to team wallet)',
      },
      {
        user_id: user.userId,
        card_id: card.id,
        type: 'bridge',
        amount: CARD_AMOUNT,
        status: 'pending',
        hash: bridgeHash,
        description: 'Bridging funds to card wallet',
      },
    ]);

    // Process referral if provided
    if (referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.toLowerCase())
        .single();

      if (referrer) {
        const referrerId = referrer.id === user.userId ? user.userId : referrer.id;
        const earnings = 0.5;

        await supabaseAdmin.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: user.userId,
          referral_code: referralCode.toLowerCase(),
          card_id: card.id,
          earnings,
          status: 'pending',
        });

        // Update earnings
        await supabaseAdmin.rpc('increment_earnings', {
          user_id: referrerId,
          amount: earnings,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Card creation initiated. Processing...',
      cardId: card.id,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in create card:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

