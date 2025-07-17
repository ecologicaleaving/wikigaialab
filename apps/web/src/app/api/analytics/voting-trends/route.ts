import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily voting totals
    const { data: dailyVotes, error: votesError } = await supabase
      .from('votes')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (votesError) {
      console.error('Error fetching voting data:', votesError);
      return NextResponse.json(
        { error: 'Failed to fetch voting data' },
        { status: 500 }
      );
    }

    // Process daily voting data
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const votesOnDay = dailyVotes?.filter(vote => 
        vote.created_at.startsWith(dateStr)
      ).length || 0;
      
      dailyData.push({
        date: dateStr,
        votes: votesOnDay
      });
    }

    // Get voting by category
    const { data: categoryVotes, error: categoryError } = await supabase
      .from('votes')
      .select(`
        created_at,
        problem:problems!inner(
          category:categories!inner(
            id,
            name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (categoryError) {
      console.error('Error fetching category voting data:', categoryError);
    }

    // Process category data
    const categoryStats = categoryVotes?.reduce((acc, vote) => {
      const categoryName = vote.problem?.category?.name;
      if (categoryName) {
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    // Get milestone achievements
    const { data: milestones, error: milestonesError } = await supabase
      .from('vote_milestones')
      .select(`
        milestone,
        achieved_at,
        problem:problems!inner(
          id,
          title,
          category:categories!inner(
            name
          )
        )
      `)
      .gte('achieved_at', startDate.toISOString())
      .lte('achieved_at', endDate.toISOString())
      .order('achieved_at', { ascending: false });

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
    }

    // Get top voted problems in period
    const { data: topProblems, error: topProblemsError } = await supabase
      .from('votes')
      .select(`
        problem_id,
        problem:problems!inner(
          id,
          title,
          vote_count,
          category:categories!inner(
            name
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (topProblemsError) {
      console.error('Error fetching top problems:', topProblemsError);
    }

    // Process top problems
    const problemVoteCounts = topProblems?.reduce((acc, vote) => {
      const problemId = vote.problem_id;
      if (!acc[problemId]) {
        acc[problemId] = {
          id: vote.problem?.id,
          title: vote.problem?.title,
          categoryName: vote.problem?.category?.name,
          totalVotes: vote.problem?.vote_count || 0,
          votesInPeriod: 0
        };
      }
      acc[problemId].votesInPeriod++;
      return acc;
    }, {} as Record<string, any>) || {};

    const topProblemsList = Object.values(problemVoteCounts)
      .sort((a: any, b: any) => b.votesInPeriod - a.votesInPeriod)
      .slice(0, 10);

    // Calculate summary statistics
    const totalVotes = dailyVotes?.length || 0;
    const avgVotesPerDay = totalVotes / days;
    const peakDay = dailyData.reduce((max, day) => 
      day.votes > max.votes ? day : max, { date: '', votes: 0 }
    );

    // Calculate growth rate (comparing first half vs second half of period)
    const midPoint = Math.floor(days / 2);
    const firstHalfVotes = dailyData.slice(0, midPoint).reduce((sum, day) => sum + day.votes, 0);
    const secondHalfVotes = dailyData.slice(midPoint).reduce((sum, day) => sum + day.votes, 0);
    const growthRate = firstHalfVotes > 0 ? 
      ((secondHalfVotes - firstHalfVotes) / firstHalfVotes) * 100 : 0;

    const analytics = {
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      
      // Summary metrics
      summary: {
        totalVotes,
        avgVotesPerDay: Math.round(avgVotesPerDay * 100) / 100,
        peakDay,
        growthRate: Math.round(growthRate * 100) / 100
      },
      
      // Time series data
      dailyVoting: dailyData,
      
      // Category breakdown
      categoryBreakdown: Object.entries(categoryStats)
        .map(([name, votes]) => ({ name, votes }))
        .sort((a, b) => b.votes - a.votes),
      
      // Recent milestones
      recentMilestones: milestones?.slice(0, 10) || [],
      
      // Top trending problems
      topProblems: topProblemsList
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Unexpected error in voting trends API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}