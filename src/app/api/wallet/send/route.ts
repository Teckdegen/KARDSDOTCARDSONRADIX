import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { decrypt } from '@/lib/utils';
import { buildTransferManifest, signAndSubmitManifest } from '@/lib/radix-engine';
import { checkXRDForGas, getUSDCBalance } from '@/lib/radix-rpc';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const { recipientAddress, amount } = await request.json();

    if (!recipientAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid recipient address and amount are required' },
        { status: 400 }
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

    // Check USDC balance
    const usdcBalance = await getUSDCBalance(wallet.radix_wallet_address);
    if (usdcBalance < amount) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. You have $${usdcBalance.toFixed(2)} USDC` },
        { status: 400 }
      );
    }

    // Check XRD balance for gas fees
    const xrdCheck = await checkXRDForGas(wallet.radix_wallet_address);
    if (!xrdCheck.hasEnough) {
      return NextResponse.json(
        { success: false, message: `Insufficient XRD balance. You need at least ${xrdCheck.required.toFixed(4)} XRD ($2 USD worth). Current: ${xrdCheck.balance.toFixed(4)} XRD` },
        { status: 400 }
      );
    }

    // Decrypt private key
    const privateKey = decrypt(wallet.radix_private_key);

    // Build transfer manifest (USDC)
    const manifest = await buildTransferManifest(
      wallet.radix_wallet_address,
      recipientAddress,
      amount
    );

    // Sign and submit transaction
    const transactionHash = await signAndSubmitManifest(manifest, privateKey);

    // Store transaction in database
    await supabaseAdmin.from('transactions').insert({
      user_id: user.userId,
      type: 'radix_send',
      amount,
      status: 'success',
      hash: transactionHash,
      recipient_address: recipientAddress,
      sender_address: wallet.radix_wallet_address,
      description: `Sent ${amount} USDC to ${recipientAddress}`,
    });

    return NextResponse.json({
      success: true,
      transactionHash,
      message: 'Transaction sent successfully',
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in wallet send:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

