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

interface RouteContext {
  params: { id: string };
}

// GET - Check if user has voted on this problem
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { id: problemId } = params;
    const supabase = getSupabaseClient();

    // Check if user has voted
    const { data: vote, error } = await supabase
      .from('votes')
      .select('*')
      .eq('problem_id', problemId)
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Vote check error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to check vote status'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hasVoted: !!vote,
      voteType: vote?.vote_type || null
    });

  } catch (error) {
    console.error('Vote GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Toggle vote on a problem
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const { id: problemId } = params;
    const supabase = getSupabaseClient();

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('problem_id', problemId)
      .eq('user_id', session.user.id)
      .eq('vote_type', 'community')
      .single();

    if (existingVote) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('Vote deletion error:', deleteError);
        return NextResponse.json({
          success: false,
          error: 'Failed to remove vote'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'removed',
        hasVoted: false
      });
    } else {
      // Add vote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          problem_id: problemId,
          user_id: session.user.id,
          vote_type: 'community',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Vote insertion error:', insertError);
        
        // Handle the P0001 error (users can't vote on own problems)
        if (insertError.code === 'P0001') {
          return NextResponse.json({
            success: false,
            error: 'Non puoi votare i tuoi stessi problemi'
          }, { status: 400 });
        }
        
        return NextResponse.json({
          success: false,
          error: 'Failed to add vote'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'added',
        hasVoted: true
      });
    }

  } catch (error) {
    console.error('Vote POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}
