import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies() 
    });

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (currentUserError || !currentUserData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { is_admin } = body;
    const targetUserId = params.id;

    if (typeof is_admin !== 'boolean') {
      return NextResponse.json(
        { error: 'is_admin must be a boolean value' },
        { status: 400 }
      );
    }

    // Prevent users from removing admin status from themselves
    if (targetUserId === session.user.id && !is_admin) {
      return NextResponse.json(
        { error: 'Cannot remove admin status from yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, email, name, is_admin')
      .eq('id', targetUserId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        is_admin,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select('id, email, name, is_admin')
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    // Log the admin action
    console.log(`Admin ${session.user.id} ${is_admin ? 'granted' : 'revoked'} admin role ${is_admin ? 'to' : 'from'} user ${targetUserId}`, {
      adminId: session.user.id,
      targetUserId,
      newRole: is_admin ? 'admin' : 'user',
      previousRole: targetUser.is_admin ? 'admin' : 'user',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `User role ${is_admin ? 'promoted to admin' : 'demoted to user'} successfully`,
      data: updatedUser
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}