import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId, calculateTopUpAmount } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    // Log webhook
    await supabaseAdmin.from('webhook_logs').insert({
      event_type: eventType,
      event_data: body,
      processed: false,
    });

    if (eventType === 'stablecoin.usdt.received.success' || eventType === 'stablecoin.usdc.received.success') {
      const { address, amount } = eventData;

      if (!address || !amount) {
        return NextResponse.json(
          { success: false, message: 'Missing address or amount' },
          { status: 400 }
        );
      }

      // Find card by wallet address
      const { data: card } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('card_wallet_address', address)
        .single();

      if (!card) {
        // Check if this is a pending card creation
        // Find card by wallet address (each card has its own ETH address)
        const { data: pendingCard } = await supabaseAdmin
          .from('cards')
          .select('*')
          .eq('card_wallet_address', address)
          .eq('status', 'processing')
          .is('card_code', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!pendingCard) {
          console.error('Pending card not found for address:', address);
          return NextResponse.json(
            { success: false, message: 'Pending card not found' },
            { status: 404 }
          );
        }

        // Get user details
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', pendingCard.user_id)
          .single();

        if (user && pendingCard && pendingCard.form_data) {
          // This is card creation - call createCard API
          const formData = pendingCard.form_data;
            
          // Call createCard API with stored form data
          await callCashwyreAPI('/CustomerCard/createCard', {
            requestId: generateRequestId(),
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phoneCode: formData.phoneCode,
            phoneNumber: formData.phoneNumber,
            dateOfBirth: formData.dateOfBirth,
            homeAddressNumber: formData.homeAddressNumber,
            homeAddress: formData.homeAddress,
            cardName: formData.cardName,
            cardType: formData.cardType,
            cardBrand: formData.cardBrand,
            amountInUSD: formData.initialAmount || 15, // The amount user wants to fund card with
          });

          await supabaseAdmin
            .from('webhook_logs')
            .update({ processed: true })
            .eq('event_type', eventType);

          return NextResponse.json({
            success: true,
            message: 'Card creation initiated',
          });
        }

        console.error('Card not found for address:', address);
        return NextResponse.json(
          { success: false, message: 'Card not found' },
          { status: 404 }
        );
      }

      // This is a top-up
      if (!card.card_code) {
        return NextResponse.json(
          { success: false, message: 'Card code not found' },
          { status: 404 }
        );
      }

      // Calculate top-up amount (minus processing fee)
      const topUpAmount = calculateTopUpAmount(parseFloat(amount));

      // Call Cashwyre topup API
      await callCashwyreAPI('/CustomerCard/topup', {
        requestId: generateRequestId(),
        cardCode: card.card_code,
        amountInUSD: topUpAmount,
      });

      // Update card balance
      await supabaseAdmin
        .from('cards')
        .update({
          balance: (card.balance || 0) + topUpAmount,
        })
        .eq('id', card.id);

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'success',
          amount: topUpAmount,
        })
        .eq('card_id', card.id)
        .eq('type', 'top_up')
        .eq('status', 'pending');

      // Mark webhook as processed
      await supabaseAdmin
        .from('webhook_logs')
        .update({ processed: true })
        .eq('event_type', eventType);

      return NextResponse.json({
        success: true,
        message: 'Top-up processed successfully',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('Error in payment webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
