import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId } from '@/lib/utils';

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

    if (eventType === 'virtualcard.created.success') {
      const { cardCode, CustomerEmail } = eventData;

      if (!cardCode || !CustomerEmail) {
        return NextResponse.json(
          { success: false, message: 'Missing cardCode or CustomerEmail' },
          { status: 400 }
        );
      }

      // Find user by email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email, eth_deposit_address')
        .eq('email', CustomerEmail.toLowerCase())
        .single();

      if (!user) {
        console.error('User not found for email:', CustomerEmail);
        await supabaseAdmin
          .from('webhook_logs')
          .update({ processed: true, error_message: 'User not found' })
          .eq('event_type', eventType);
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user has less than 4 cards
      const { count } = await supabaseAdmin
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count >= 4) {
        console.error('User already has 4 cards');
        return NextResponse.json(
          { success: false, message: 'User has reached card limit' },
          { status: 400 }
        );
      }

      // Find pending card by ETH address
      const { data: card } = await supabaseAdmin
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('card_wallet_address', user.eth_deposit_address)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!card) {
        console.error('Pending card not found');
        return NextResponse.json(
          { success: false, message: 'Pending card not found' },
          { status: 404 }
        );
      }

      // Update card with cardCode
      await supabaseAdmin
        .from('cards')
        .update({
          card_code: cardCode,
          customer_code: eventData.CustomerId || null,
          status: 'active',
          balance: eventData.CardBalance || 0,
          last4: eventData.Last4 || null,
          expiry_on: eventData.ExpiryOn || null,
        })
        .eq('id', card.id);

      // Mark webhook as processed
      await supabaseAdmin
        .from('webhook_logs')
        .update({ processed: true })
        .eq('event_type', eventType);

      return NextResponse.json({
        success: true,
        message: 'Card created successfully',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });
  } catch (error: any) {
    console.error('Error in card creation webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

