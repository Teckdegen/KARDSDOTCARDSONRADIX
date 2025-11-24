import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/utils';
import { buildTransferManifest, signAndSubmitManifest } from '@/lib/radix-engine';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get user's unclaimed earnings
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('weekly_earnings')
      .eq('id', user.userId)
      .single();

    if (!userData || !userData.weekly_earnings || userData.weekly_earnings <= 0) {
      return NextResponse.json(
        { success: false, message: 'No earnings to claim' },
        { status: 400 }
      );
    }

    // Get user's Radix wallet address
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('radix_wallet_address')
      .eq('user_id', user.userId)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Get cashback wallet private key
    const cashbackPrivateKey = decrypt(process.env.CASHBACK_WALLET_PRIVATE_KEY!);
    const cashbackAddress = process.env.CASHBACK_WALLET_ADDRESS!;

    // Build transfer manifest
    const manifest = await buildTransferManifest(
      cashbackAddress,
      wallet.radix_wallet_address,
      userData.weekly_earnings
    );

    // Sign and submit transaction
    const transactionHash = await signAndSubmitManifest(manifest, cashbackPrivateKey);

    // Calculate week ending
    const now = new Date();
    const weekEnding = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    weekEnding.setHours(23, 59, 59, 999);

    // Create claim record
    await supabaseAdmin.from('cashback_claims').insert({
      user_id: user.userId,
      amount: userData.weekly_earnings,
      week_ending: weekEnding.toISOString().split('T')[0],
      status: 'completed',
      transaction_hash: transactionHash,
    });

    // Mark referrals as claimed
    await supabaseAdmin
      .from('referrals')
      .update({ status: 'claimed' })
      .eq('referrer_id', user.userId)
      .eq('status', 'pending');

    // Reset weekly earnings
    await supabaseAdmin
      .from('users')
      .update({ weekly_earnings: 0 })
      .eq('id', user.userId);

    return NextResponse.json({
      success: true,
      transactionHash,
      amount: userData.weekly_earnings,
      message: `$${userData.weekly_earnings} USDC claimed successfully`,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in claim earnings:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

