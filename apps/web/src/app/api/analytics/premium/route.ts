import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Check user's premium access (vote-based)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('total_votes_cast, subscription_status')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const hasVotedEnough = (userData.total_votes_cast || 0) >= 5;
    const hasActiveSubscription = userData.subscription_status === 'active';
    const hasPremiumAccess = hasVotedEnough || hasActiveSubscription;

    if (!hasPremiumAccess) {
      return NextResponse.json(
        { error: 'Premium access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch user's voting history for the time range
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select(`
        created_at,
        problems(
          id,
          title,
          category_id,
          vote_count,
          status,
          categories(name)
        )
      `)
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return NextResponse.json(
        { error: 'Failed to fetch voting data' },
        { status: 500 }
      );
    }

    // Fetch trending problems
    const { data: trendingProblems, error: trendingError } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        vote_count,
        status,
        created_at,
        categories(name)
      `)
      .eq('status', 'active')
      .gte('created_at', startDate.toISOString())
      .order('vote_count', { ascending: false })
      .limit(6);

    if (trendingError) {
      console.error('Error fetching trending problems:', trendingError);
    }

    // Process analytics data
    const analyticsData = generateAnalyticsData(userVotes || [], trendingProblems || [], timeRange);

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAnalyticsData(userVotes: any[], trendingProblems: any[], timeRange: string) {
  // Calculate category breakdown
  const categoryVotes = userVotes.reduce((acc, vote) => {
    const categoryName = vote.problems?.categories?.name || 'Uncategorized';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalVotes = userVotes.length;
  const categoryBreakdown = Object.entries(categoryVotes).map(([category, votes]) => ({
    category,
    votes,
    percentage: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
  })).sort((a, b) => b.votes - a.votes);

  // Calculate weekly trends
  const weeklyVotes: Record<string, number> = {};
  userVotes.forEach(vote => {
    const weekStart = getWeekStart(new Date(vote.created_at));
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyVotes[weekKey] = (weeklyVotes[weekKey] || 0) + 1;
  });

  const sortedWeeks = Object.keys(weeklyVotes).sort();
  const weeklyTrends = sortedWeeks.map((week, index) => {
    const votes = weeklyVotes[week];
    const prevWeekVotes = index > 0 ? weeklyVotes[sortedWeeks[index - 1]] : votes;
    const change = prevWeekVotes > 0 ? Math.round(((votes - prevWeekVotes) / prevWeekVotes) * 100) : 0;
    
    return {
      week: formatWeekDate(new Date(week)),
      votes,
      change
    };
  });

  // Generate popular problems with trend simulation
  const popularProblems = trendingProblems.slice(0, 6).map((problem, index) => ({
    id: problem.id,
    title: problem.title,
    votes: problem.vote_count,
    category: problem.categories?.name || 'Uncategorized',
    trend: index < 2 ? 'up' : index < 4 ? 'stable' : 'down' as 'up' | 'down' | 'stable'
  }));

  // Generate recommendations based on user activity
  const recommendations = generateRecommendations(userVotes, categoryBreakdown);

  return {
    overview: {
      totalViews: Math.round(totalVotes * 2.5 + Math.random() * 100), // Simulated
      engagementRate: Math.min(95, Math.round(50 + (totalVotes / 10) * 5)), // Simulated based on activity
      averageVotes: Math.round(totalVotes / Math.max(1, getUniqueDays(userVotes))),
      trendingScore: Math.round(60 + (totalVotes * 2) + Math.random() * 20) // Simulated
    },
    votingPatterns: {
      categoryBreakdown,
      timePatterns: generateTimePatterns(userVotes),
      weeklyTrends
    },
    problemInsights: {
      popularProblems,
      myProblemsPerformance: [] // Would require additional queries for user's own problems
    },
    recommendations
  };
}

function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function formatWeekDate(date: Date): string {
  return date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
}

function getUniqueDays(votes: any[]): number {
  const days = new Set(votes.map(vote => vote.created_at.split('T')[0]));
  return days.size;
}

function generateTimePatterns(votes: any[]) {
  const hourly: Record<number, number> = {};
  
  votes.forEach(vote => {
    const hour = new Date(vote.created_at).getHours();
    hourly[hour] = (hourly[hour] || 0) + 1;
  });

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    votes: hourly[hour] || 0
  }));
}

function generateRecommendations(userVotes: any[], categoryBreakdown: any[]): any[] {
  const recommendations = [];

  // Low activity recommendation
  if (userVotes.length < 5) {
    recommendations.push({
      type: 'vote',
      title: 'Aumenta la tua attività',
      description: 'Vota più problemi per sbloccare insights più dettagliati',
      action: 'Esplora problemi',
      href: '/problems'
    });
  }

  // Category diversification
  if (categoryBreakdown.length < 3) {
    recommendations.push({
      type: 'engage',
      title: 'Diversifica i tuoi interessi',
      description: 'Prova a votare problemi in diverse categorie per una visione più ampia',
      action: 'Scopri categorie',
      href: '/problems'
    });
  }

  // Propose a problem
  recommendations.push({
    type: 'propose',
    title: 'Condividi le tue idee',
    description: 'Basandoti sulla tua attività, potresti proporre soluzioni innovative',
    action: 'Proponi problema',
    href: '/problems/new'
  });

  // Trending engagement
  recommendations.push({
    type: 'vote',
    title: 'Partecipa alle tendenze',
    description: 'Scopri e vota i problemi più discussi della community',
    action: 'Vedi tendenze',
    href: '/problems?sort=trending'
  });

  return recommendations;
}