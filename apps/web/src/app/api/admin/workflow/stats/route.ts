import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

/**
 * Get workflow statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Get problems by status
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('status');
    
    if (problemsError) {
      console.error('Error fetching problems:', problemsError);
      return NextResponse.json(
        { error: 'Failed to fetch problems data' },
        { status: 500 }
      );
    }
    
    // Count problems by status
    const statusCounts = {
      'Proposed': 0,
      'Under Review': 0,
      'Priority Queue': 0,
      'In Development': 0,
      'Completed': 0,
      'Rejected': 0
    };
    
    problems?.forEach(problem => {
      if (problem.status in statusCounts) {
        statusCounts[problem.status as keyof typeof statusCounts]++;
      }
    });
    
    // Get recent workflow changes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentChanges, error: changesError } = await supabase
      .from('workflow_logs')
      .select('id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    return NextResponse.json({
      success: true,
      totalProblems: problems?.length || 0,
      byStatus: statusCounts,
      recentChanges: recentChanges?.length || 0,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}