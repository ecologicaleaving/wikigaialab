import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get dashboard statistics
    const [
      { count: totalProblems },
      { count: totalUsers }, 
      { count: totalVotes },
      { count: totalCategories }
    ] = await Promise.all([
      supabase.from('problems').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true })
    ]);

    // Get recent problems
    const { data: recentProblems } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        created_at,
        vote_count,
        status,
        categories:category_id(name),
        users:proposer_id(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get category distribution
    const { data: categoryStats } = await supabase
      .from('problems')
      .select(`
        category_id,
        categories:category_id(name)
      `);

    const categoryDistribution = categoryStats?.reduce((acc: any, problem: any) => {
      const categoryName = problem.categories?.name || 'Unknown';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {}) || {};

    // Mock some additional stats for now
    const dashboardData = {
      stats: {
        totalProblems: totalProblems || 0,
        totalUsers: totalUsers || 0,
        totalVotes: totalVotes || 0,
        totalCategories: totalCategories || 0,
        pendingModeration: 0,
        featuredProblems: 0,
        averageVotes: totalProblems > 0 ? Math.round((totalVotes || 0) / totalProblems) : 0,
        totalCollections: 0,
        recentActivity: recentProblems?.length || 0
      },
      trends: {
        problemsGrowth: '+12%',
        votesGrowth: '+8%',
        usersGrowth: '+15%'
      },
      categoryDistribution: Object.entries(categoryDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round(((count as number) / (totalProblems || 1)) * 100)
      })),
      recentActivity: recentProblems?.map((problem: any) => ({
        id: problem.id,
        type: 'problem_created',
        title: problem.title,
        user: problem.users?.name || 'Unknown',
        timestamp: problem.created_at,
        status: problem.status
      })) || [],
      moderationQueue: []
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
