import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Since we're using JWT tokens, logout is handled client-side
  // by removing the token. This endpoint is for consistency.
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}

