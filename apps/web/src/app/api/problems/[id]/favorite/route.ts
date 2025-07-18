/**
 * Problem Favorite API Endpoint
 * Story 4.3: User Profiles & Social Features
 * POST /api/problems/[id]/favorite - Favorite a problem
 * DELETE /api/problems/[id]/favorite - Unfavorite a problem
 * GET /api/problems/[id]/favorite - Check if user has favorited the problem
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { AchievementEngine } from '@wikigaialab/shared/lib/achievementEngine';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize services
const socialService = new SocialService({ databaseClient: supabase });
const achievementEngine = new AchievementEngine({ databaseClient: supabase });

/**
 * Helper function to authenticate user
 */
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid authentication token');
  }

  return user;
}

/**
 * POST /api/problems/[id]/favorite
 * Favorite a problem
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: problemId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const userId = authUser.id;

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
      .select('id, title, description, proposer_id')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Favorite the problem
    const favorite = await socialService.favoriteProblem(userId, problemId);
    
    if (!favorite) {
      return NextResponse.json(
        { error: 'Failed to favorite problem' },
        { status: 500 }
      );
    }

    // Trigger achievement check
    await achievementEngine.checkAndAwardAchievements(userId, 'problem_favorited');

    return NextResponse.json({
      message: 'Successfully favorited problem',
      favorite,
      isFavorited: true
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error favoriting problem:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error.message === 'Problem already favorited') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/problems/[id]/favorite
 * Unfavorite a problem
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: problemId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const userId = authUser.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'Invalid problem ID format' },
        { status: 400 }
      );
    }

    // Unfavorite the problem
    const success = await socialService.unfavoriteProblem(userId, problemId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to unfavorite problem' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully unfavorited problem',
      isFavorited: false
    });
  } catch (error: any) {
    console.error('Error unfavoriting problem:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/problems/[id]/favorite
 * Check if current user has favorited the problem
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: problemId } = params;
    
    // Authenticate user
    const authUser = await authenticateUser(request);
    const userId = authUser.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'Invalid problem ID format' },
        { status: 400 }
      );
    }

    // Check favorite status
    const isFavorited = await socialService.isFavorited(userId, problemId);
    
    // Get total favorites count for this problem
    const { count: totalFavorites } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact' })
      .eq('problem_id', problemId);

    return NextResponse.json({
      isFavorited,
      totalFavorites: totalFavorites || 0,
      userId,
      problemId
    });
  } catch (error: any) {
    console.error('Error checking favorite status:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid authentication token') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}