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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'ID problema non valido' },
        { status: 400 }
      );
    }

    // Check if problem exists and get proposer info
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('id, proposer_id, vote_count')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problema non trovato' },
        { status: 404 }
      );
    }

    // Prevent self-voting
    if (problem.proposer_id === user.id) {
      return NextResponse.json(
        { error: 'Non puoi votare il tuo stesso problema' },
        { status: 403 }
      );
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single();

    let newVoteCount = problem.vote_count;
    let hasVoted = false;

    if (existingVote) {
      // User has voted - remove vote (toggle off)
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_id', problemId);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Errore nella rimozione del voto' },
          { status: 500 }
        );
      }

      newVoteCount = Math.max(0, problem.vote_count - 1);
      hasVoted = false;
    } else {
      // User hasn't voted - add vote (toggle on)
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          problem_id: problemId,
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Errore nell\'aggiunta del voto' },
          { status: 500 }
        );
      }

      newVoteCount = problem.vote_count + 1;
      hasVoted = true;
    }

    // Update problem vote count
    const { error: updateError } = await supabase
      .from('problems')
      .update({ 
        vote_count: newVoteCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', problemId);

    if (updateError) {
      // console.error('Error updating problem vote count:', updateError);
      // Vote was already added/removed, but count update failed
      // This will be eventually consistent through triggers
    }

    // Check for vote milestones and send notifications
    if (hasVoted && newVoteCount > problem.vote_count) {
      // Only check milestones when vote count increases
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/vote-milestone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId,
            newVoteCount,
            oldVoteCount: problem.vote_count
          })
        });
      } catch (notificationError) {
        // Don't fail the vote if notification fails
        console.error('Failed to send milestone notification:', notificationError);
      }
    }

    // Update user's total votes cast
    const { data: userData } = await supabase
      .from('users')
      .select('total_votes_cast')
      .eq('id', user.id)
      .single();

    if (userData) {
      const newTotalVotes = hasVoted 
        ? (userData.total_votes_cast || 0) + 1
        : Math.max(0, (userData.total_votes_cast || 0) - 1);

      await supabase
        .from('users')
        .update({ 
          total_votes_cast: newTotalVotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      hasVoted,
      newVoteCount,
      message: hasVoted ? 'Voto aggiunto' : 'Voto rimosso'
    });

  } catch (error) {
    // console.error('Unexpected error in vote API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        hasVoted: false,
        voteCount: 0
      });
    }

    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'ID problema non valido' },
        { status: 400 }
      );
    }

    // Check vote status and get current vote count
    const [{ data: voteData }, { data: problemData }] = await Promise.all([
      supabase
        .from('votes')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .single(),
      supabase
        .from('problems')
        .select('vote_count')
        .eq('id', problemId)
        .single()
    ]);

    return NextResponse.json({
      hasVoted: !!voteData,
      voteCount: problemData?.vote_count || 0
    });

  } catch (error) {
    // console.error('Unexpected error in vote status API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}