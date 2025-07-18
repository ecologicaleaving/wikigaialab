import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface ContentAnalytics {
  overview: {
    total_problems: number;
    pending_moderation: number;
    approved_problems: number;
    rejected_problems: number;
    featured_problems: number;
    avg_quality_score: number;
    total_votes: number;
    total_views: number;
  };
  trends: {
    daily_submissions: Array<{ date: string; count: number }>;
    quality_distribution: Array<{ score_range: string; count: number }>;
    category_performance: Array<{
      category_name: string;
      problem_count: number;
      avg_votes: number;
      avg_quality: number;
    }>;
    moderation_actions: Array<{
      action_type: string;
      count: number;
      last_7_days: number;
    }>;
  };
  content_health: {
    spam_detection: {
      flagged_content: number;
      spam_probability_avg: number;
      auto_rejected: number;
    };
    quality_metrics: {
      low_quality_count: number;
      medium_quality_count: number;
      high_quality_count: number;
      duplicate_groups: number;
    };
    engagement: {
      avg_votes_per_problem: number;
      problems_with_no_votes: number;
      most_voted_problem: {
        id: string;
        title: string;
        votes: number;
      } | null;
    };
  };
  recent_activity: Array<{
    id: string;
    type: 'submission' | 'moderation' | 'flag' | 'feature';
    title: string;
    timestamp: string;
    user_name?: string;
    details: any;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30'; // days
    const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

    // Gather analytics data
    const analytics = await gatherContentAnalytics(supabase, startDate);

    return NextResponse.json({ success: true, data: analytics });

  } catch (error) {
    console.error('Error fetching content analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function gatherContentAnalytics(supabase: any, startDate: Date): Promise<ContentAnalytics> {
  // Overview statistics
  const [
    { count: totalProblems },
    { count: pendingModeration },
    { count: approvedProblems },
    { count: rejectedProblems },
    { count: featuredProblems }
  ] = await Promise.all([
    supabase.from('problems').select('*', { count: 'exact', head: true }),
    supabase.from('problems').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
    supabase.from('problems').select('*', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
    supabase.from('problems').select('*', { count: 'exact', head: true }).eq('moderation_status', 'rejected'),
    supabase.from('problems').select('*', { count: 'exact', head: true }).eq('is_featured', true)
  ]);

  // Quality and engagement metrics
  const { data: qualityMetrics } = await supabase
    .from('content_quality_metrics')
    .select('quality_score');

  const { data: problems } = await supabase
    .from('problems')
    .select('vote_count');

  const avgQualityScore = qualityMetrics?.length > 0 
    ? qualityMetrics.reduce((sum: number, m: any) => sum + (m.quality_score || 0), 0) / qualityMetrics.length 
    : 0;

  const totalVotes = problems?.reduce((sum: number, p: any) => sum + (p.vote_count || 0), 0) || 0;

  // Daily submissions trend
  const { data: dailySubmissions } = await supabase
    .from('problems')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  const submissionsByDay = getDailyTrends(dailySubmissions || [], startDate);

  // Quality distribution
  const qualityDistribution = getQualityDistribution(qualityMetrics || []);

  // Category performance
  const { data: categoryStats } = await supabase
    .from('problems')
    .select(`
      category_id,
      vote_count,
      quality_score,
      categories!category_id(name)
    `)
    .eq('moderation_status', 'approved');

  const categoryPerformance = getCategoryPerformance(categoryStats || []);

  // Moderation actions
  const { data: moderationActions } = await supabase
    .from('moderation_actions')
    .select('action_type, created_at')
    .gte('created_at', startDate.toISOString());

  const moderationTrends = getModerationTrends(moderationActions || []);

  // Content health metrics
  const { count: flaggedContent } = await supabase
    .from('content_flags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { data: spamMetrics } = await supabase
    .from('content_quality_metrics')
    .select('spam_probability')
    .gt('spam_probability', 0);

  const avgSpamProbability = spamMetrics?.length > 0
    ? spamMetrics.reduce((sum: number, m: any) => sum + (m.spam_probability || 0), 0) / spamMetrics.length
    : 0;

  // Quality breakdown
  const lowQualityCount = qualityMetrics?.filter((m: any) => (m.quality_score || 0) < 40).length || 0;
  const mediumQualityCount = qualityMetrics?.filter((m: any) => (m.quality_score || 0) >= 40 && (m.quality_score || 0) < 70).length || 0;
  const highQualityCount = qualityMetrics?.filter((m: any) => (m.quality_score || 0) >= 70).length || 0;

  // Engagement metrics
  const avgVotesPerProblem = problems?.length > 0 
    ? totalVotes / problems.length 
    : 0;

  const problemsWithNoVotes = problems?.filter((p: any) => (p.vote_count || 0) === 0).length || 0;

  const { data: mostVotedProblem } = await supabase
    .from('problems')
    .select('id, title, vote_count')
    .order('vote_count', { ascending: false })
    .limit(1)
    .single();

  // Recent activity
  const { data: recentProblems } = await supabase
    .from('problems')
    .select(`
      id,
      title,
      created_at,
      proposer:users!proposer_id(name)
    `)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentModerations } = await supabase
    .from('moderation_actions')
    .select(`
      id,
      action_type,
      created_at,
      problem:problems!problem_id(id, title),
      moderator:users!moderator_id(name)
    `)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  const recentActivity = combineRecentActivity(recentProblems || [], recentModerations || []);

  return {
    overview: {
      total_problems: totalProblems || 0,
      pending_moderation: pendingModeration || 0,
      approved_problems: approvedProblems || 0,
      rejected_problems: rejectedProblems || 0,
      featured_problems: featuredProblems || 0,
      avg_quality_score: Math.round(avgQualityScore * 100) / 100,
      total_votes: totalVotes,
      total_views: 0 // Would need to implement view tracking
    },
    trends: {
      daily_submissions: submissionsByDay,
      quality_distribution: qualityDistribution,
      category_performance: categoryPerformance,
      moderation_actions: moderationTrends
    },
    content_health: {
      spam_detection: {
        flagged_content: flaggedContent || 0,
        spam_probability_avg: Math.round(avgSpamProbability * 1000) / 1000,
        auto_rejected: 0 // Would need to track auto-rejections
      },
      quality_metrics: {
        low_quality_count: lowQualityCount,
        medium_quality_count: mediumQualityCount,
        high_quality_count: highQualityCount,
        duplicate_groups: 0 // Would need to calculate from duplicate detection
      },
      engagement: {
        avg_votes_per_problem: Math.round(avgVotesPerProblem * 100) / 100,
        problems_with_no_votes: problemsWithNoVotes,
        most_voted_problem: mostVotedProblem ? {
          id: mostVotedProblem.id,
          title: mostVotedProblem.title,
          votes: mostVotedProblem.vote_count || 0
        } : null
      }
    },
    recent_activity: recentActivity
  };
}

function getDailyTrends(submissions: Array<{ created_at: string }>, startDate: Date): Array<{ date: string; count: number }> {
  const dailyCounts: { [key: string]: number } = {};
  
  // Initialize all days with 0
  for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyCounts[dateStr] = 0;
  }
  
  // Count submissions per day
  submissions.forEach(submission => {
    const dateStr = submission.created_at.split('T')[0];
    if (dailyCounts.hasOwnProperty(dateStr)) {
      dailyCounts[dateStr]++;
    }
  });
  
  return Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getQualityDistribution(metrics: Array<{ quality_score: number }>): Array<{ score_range: string; count: number }> {
  const distribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };
  
  metrics.forEach(metric => {
    const score = metric.quality_score || 0;
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });
  
  return Object.entries(distribution).map(([score_range, count]) => ({ score_range, count }));
}

function getCategoryPerformance(problems: Array<any>): Array<{
  category_name: string;
  problem_count: number;
  avg_votes: number;
  avg_quality: number;
}> {
  const categoryStats: { [key: string]: { votes: number[]; quality: number[]; count: number } } = {};
  
  problems.forEach(problem => {
    const categoryName = problem.categories?.name || 'Uncategorized';
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { votes: [], quality: [], count: 0 };
    }
    
    categoryStats[categoryName].votes.push(problem.vote_count || 0);
    categoryStats[categoryName].quality.push(problem.quality_score || 0);
    categoryStats[categoryName].count++;
  });
  
  return Object.entries(categoryStats).map(([category_name, stats]) => ({
    category_name,
    problem_count: stats.count,
    avg_votes: Math.round((stats.votes.reduce((sum, v) => sum + v, 0) / stats.votes.length) * 100) / 100,
    avg_quality: Math.round((stats.quality.reduce((sum, q) => sum + q, 0) / stats.quality.length) * 100) / 100
  }));
}

function getModerationTrends(actions: Array<{ action_type: string; created_at: string }>): Array<{
  action_type: string;
  count: number;
  last_7_days: number;
}> {
  const actionCounts: { [key: string]: { total: number; recent: number } } = {};
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  actions.forEach(action => {
    if (!actionCounts[action.action_type]) {
      actionCounts[action.action_type] = { total: 0, recent: 0 };
    }
    
    actionCounts[action.action_type].total++;
    
    if (new Date(action.created_at) >= sevenDaysAgo) {
      actionCounts[action.action_type].recent++;
    }
  });
  
  return Object.entries(actionCounts).map(([action_type, counts]) => ({
    action_type,
    count: counts.total,
    last_7_days: counts.recent
  }));
}

function combineRecentActivity(
  problems: Array<any>,
  moderations: Array<any>
): Array<{
  id: string;
  type: 'submission' | 'moderation' | 'flag' | 'feature';
  title: string;
  timestamp: string;
  user_name?: string;
  details: any;
}> {
  const activities: Array<{
    id: string;
    type: 'submission' | 'moderation' | 'flag' | 'feature';
    title: string;
    timestamp: string;
    user_name?: string;
    details: any;
  }> = [];
  
  // Add problem submissions
  problems.forEach(problem => {
    activities.push({
      id: problem.id,
      type: 'submission',
      title: problem.title,
      timestamp: problem.created_at,
      user_name: problem.proposer?.name,
      details: { type: 'new_submission' }
    });
  });
  
  // Add moderation actions
  moderations.forEach(moderation => {
    activities.push({
      id: moderation.id,
      type: 'moderation',
      title: moderation.problem?.title || 'Unknown Problem',
      timestamp: moderation.created_at,
      user_name: moderation.moderator?.name,
      details: { action_type: moderation.action_type }
    });
  });
  
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}