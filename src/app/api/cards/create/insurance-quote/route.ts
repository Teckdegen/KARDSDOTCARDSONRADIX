import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { buildTransferManifest } from '@/lib/radix-engine';
import { getUSDCBalance } from '@/lib/radix-rpc';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, message: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const INSURANCE_FEE = 10;
    const insuranceWalletAddress = process.env.CASHBACK_WALLET_ADDRESS!;
    
    if (!insuranceWalletAddress) {
      return NextResponse.json(
        { success: false, message: 'Insurance wallet not configured' },
        { status: 500 }
      );
    }

    // Check USDC balance
    const usdcBalance = await getUSDCBalance(walletAddress);
    if (usdcBalance < INSURANCE_FEE) {
      return NextResponse.json(
        { success: false, message: `Insufficient USDC balance. You need $${INSURANCE_FEE} USDC. You have $${usdcBalance.toFixed(2)} USDC` },
        { status: 400 }
      );
    }

    // Build insurance payment manifest
    const manifest = await buildTransferManifest(
      walletAddress,
      insuranceWalletAddress,
      INSURANCE_FEE
    );

    return NextResponse.json({
      success: true,
      manifest,
      amount: INSURANCE_FEE,
      recipient: insuranceWalletAddress,
    });
  } catch (error: any) {
    console.error('Error in insurance quote:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

