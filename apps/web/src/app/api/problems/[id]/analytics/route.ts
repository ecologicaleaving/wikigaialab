import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'Invalid problem ID format' },
        { status: 400 }
      );
    }

    // Check if problem exists
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('id, title, vote_count, created_at, status')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Get voting timeline (votes per day for the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: votingTimeline, error: timelineError } = await supabase
      .from('votes')
      .select('created_at')
      .eq('problem_id', problemId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (timelineError) {
      console.error('Error fetching voting timeline:', timelineError);
    }

    // Process timeline data into daily buckets
    const timelineData = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const votesOnDay = votingTimeline?.filter(vote => 
        vote.created_at.startsWith(dateStr)
      ).length || 0;
      
      timelineData.push({
        date: dateStr,
        votes: votesOnDay
      });
    }

    // Get vote milestones achieved
    const { data: milestones, error: milestonesError } = await supabase
      .from('vote_milestones')
      .select('milestone, achieved_at, notification_sent')
      .eq('problem_id', problemId)
      .order('milestone', { ascending: true });

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
    }

    // Calculate voting velocity (votes per day since creation)
    const problemAge = Math.max(1, Math.ceil((Date.now() - new Date(problem.created_at).getTime()) / (24 * 60 * 60 * 1000)));
    const votingVelocity = problem.vote_count / problemAge;

    // Get recent voters (last 10, for premium users or problem owner)
    const { data: { user } } = await supabase.auth.getUser();
    let recentVoters = null;
    
    if (user) {
      // Check if user is problem owner or has premium access
      const { data: userProblem } = await supabase
        .from('problems')
        .select('proposer_id')
        .eq('id', problemId)
        .eq('proposer_id', user.id)
        .single();

      if (userProblem) {
        const { data: voters, error: votersError } = await supabase
          .from('votes')
          .select(`
            created_at,
            user:users!inner(
              id,
              name
            )
          `)
          .eq('problem_id', problemId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!votersError) {
          recentVoters = voters?.map(vote => ({
            voterName: vote.user?.name || 'Anonymous',
            votedAt: vote.created_at
          }));
        }
      }
    }

    // Calculate next milestone
    const nextMilestone = [50, 75, 100, 150, 200, 500, 1000]
      .find(milestone => problem.vote_count < milestone);

    const analytics = {
      problemId,
      title: problem.title,
      currentVotes: problem.vote_count,
      status: problem.status,
      createdAt: problem.created_at,
      
      // Voting metrics
      votingVelocity: Math.round(votingVelocity * 100) / 100,
      problemAge,
      
      // Milestones
      milestonesAchieved: milestones || [],
      nextMilestone,
      progressToNextMilestone: nextMilestone ? 
        Math.round((problem.vote_count / nextMilestone) * 100) : 100,
      
      // Timeline data
      votingTimeline: timelineData,
      
      // Recent activity
      recentVoters: recentVoters || [],
      
      // Summary stats
      totalVotesLast7Days: timelineData.slice(-7).reduce((sum, day) => sum + day.votes, 0),
      totalVotesLast30Days: timelineData.reduce((sum, day) => sum + day.votes, 0),
      peakVotingDay: timelineData.reduce((max, day) => 
        day.votes > max.votes ? day : max, { date: '', votes: 0 }
      )
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Unexpected error in problem analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}