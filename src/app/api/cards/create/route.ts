import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';
import { submitTransaction } from '@/lib/radix-rpc';

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
      referralCode,
      initialAmount,
      walletAddress,
      bridgeTransactionHash,
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

    // Validate wallet address and bridge transaction
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!bridgeTransactionHash) {
      return NextResponse.json(
        { success: false, message: 'Bridge transaction hash is required' },
        { status: 400 }
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

    const INSURANCE_FEE = 10;
    const CARD_AMOUNT = initialAmount;

    // Verify insurance payment was made (check for transaction from walletAddress to insurance wallet)
    // In production, you should verify this on-chain
    // For now, we'll trust that the frontend handled it correctly
    // You could add a verification step here by checking transaction history

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

    // Bridge transaction was already signed and submitted by the client
    // We just need to verify it and create the card record

    // Store bridge transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.userId,
      card_id: card.id,
      type: 'bridge',
      amount: CARD_AMOUNT,
      status: 'pending',
      hash: bridgeTransactionHash,
      sender_address: walletAddress,
      recipient_address: ethAddress,
      description: 'Bridging funds to card wallet',
    });

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

