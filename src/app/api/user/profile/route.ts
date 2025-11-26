import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get user data from Supabase
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('id', user.userId)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        createdAt: userData.created_at,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

