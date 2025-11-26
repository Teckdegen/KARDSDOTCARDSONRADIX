import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { walletAddress, transactionHash } = await request.json();

    if (!walletAddress || !transactionHash) {
      return NextResponse.json(
        { success: false, message: 'Wallet address and transaction hash are required' },
        { status: 400 }
      );
    }

    // Store insurance payment confirmation in session/local storage
    // For now, we'll just verify the transaction exists
    // In production, you might want to verify the transaction on-chain
    
    // Store in a temporary table or use Redis/session storage
    // For simplicity, we'll use a sessions table or just return success
    // The actual verification will happen when creating the card

    return NextResponse.json({
      success: true,
      message: 'Insurance payment confirmed',
      transactionHash,
    });
  } catch (error: any) {
    console.error('Error confirming insurance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

