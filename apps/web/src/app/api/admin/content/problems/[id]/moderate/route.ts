import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'Invalid problem ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, reason, notes } = body;

    if (!action || !['approve', 'reject', 'flag', 'feature'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (approve, reject, flag, feature)' },
        { status: 400 }
      );
    }

    // Check if problem exists
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Prepare update data based on our current schema
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Handle different actions with our current schema
    switch (action) {
      case 'approve':
        updateData.status = 'active';
        break;
        
      case 'reject':
        updateData.status = 'rejected';
        break;
        
      case 'flag':
        updateData.status = 'flagged';
        break;
        
      case 'feature':
        updateData.status = 'active';
        // In future, we could add is_featured field
        break;
    }

    // Update the problem
    const { data: updatedProblem, error: updateError } = await supabase
      .from('problems')
      .update(updateData)
      .eq('id', problemId)
      .select(`
        id,
        title,
        description,
        status,
        updated_at,
        proposer_id,
        category_id
      `)
      .single();

    if (updateError) {
      console.error('Error updating problem:', updateError);
      return NextResponse.json(
        { error: 'Failed to update problem' },
        { status: 500 }
      );
    }

    // Log admin activity (simplified for our current schema)
    try {
      console.log(`Admin ${user.id} performed ${action} on problem ${problemId}`, {
        previousStatus: problem.status,
        newStatus: updateData.status,
        reason,
        notes,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('Failed to log admin activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Problem ${action}ed successfully`,
      data: updatedProblem
    });

  } catch (error) {
    console.error('Error in problem moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}