import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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

    // Extract address string if it's stored as an object
    let address = wallet.radix_wallet_address;
    if (address && typeof address === 'object') {
      // Handle object structure: { kind: "Static", value: "..." }
      const addrObj = address as any;
      if (addrObj.value && typeof addrObj.value === 'string') {
        address = addrObj.value;
      } else if (addrObj.value && typeof addrObj.value === 'object' && addrObj.value.value) {
        address = addrObj.value.value;
      } else {
        address = String(address);
      }
    }

    return NextResponse.json({
      success: true,
      address: address,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error in wallet address:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

