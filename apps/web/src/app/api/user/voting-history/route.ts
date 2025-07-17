import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    // Get user's voting history with problem details
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        created_at,
        problem:problems!inner(
          id,
          title,
          description,
          vote_count,
          status,
          created_at,
          category:categories!inner(
            id,
            name,
            icon
          ),
          proposer:users!proposer_id(
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (votesError) {
      console.error('Error fetching voting history:', votesError);
      return NextResponse.json(
        { error: 'Failed to fetch voting history' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting votes:', countError);
    }

    // Get user's voting statistics
    const { data: userStats, error: statsError } = await supabase
      .from('users')
      .select('total_votes_cast, created_at')
      .eq('id', user.id)
      .single();

    if (statsError) {
      console.error('Error fetching user stats:', statsError);
    }

    // Calculate additional statistics
    const totalVotes = count || 0;
    const votesThisMonth = votes?.filter(vote => {
      const voteDate = new Date(vote.created_at);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return voteDate >= monthAgo;
    }).length || 0;

    const categoriesVoted = votes?.reduce((acc, vote) => {
      const categoryName = vote.problem?.category?.name;
      if (categoryName && !acc.includes(categoryName)) {
        acc.push(categoryName);
      }
      return acc;
    }, [] as string[]) || [];

    return NextResponse.json({
      success: true,
      data: {
        votes: votes || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        statistics: {
          totalVotes,
          votesThisMonth,
          categoriesVoted: categoriesVoted.length,
          memberSince: userStats?.created_at,
          avgVotesPerMonth: userStats?.created_at ? 
            totalVotes / Math.max(1, Math.ceil((Date.now() - new Date(userStats.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))) 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Unexpected error in voting history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}