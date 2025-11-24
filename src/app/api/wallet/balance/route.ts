import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { getBalances } from '@/lib/radix-rpc';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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

    // Get USDC and XRD balances
    const { usdc, xrd } = await getBalances(wallet.radix_wallet_address);

    return NextResponse.json({
      success: true,
      balance: usdc, // USDC balance (primary)
      xrdBalance: xrd, // XRD balance (for gas)
      address: wallet.radix_wallet_address,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in wallet balance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

