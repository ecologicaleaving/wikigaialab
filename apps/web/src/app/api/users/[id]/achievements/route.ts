/**
 * User Achievements API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/users/[id]/achievements - Get user's achievements and progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AchievementEngine } from '@wikigaialab/shared/lib/achievementEngine';
import { SocialService } from '@wikigaialab/shared/lib/socialService';
import { UserAchievementsResponse } from '@wikigaialab/shared/types/social';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize services
const socialService = new SocialService({ databaseClient: supabase });
const achievementEngine = new AchievementEngine({ databaseClient: supabase });

/**
 * GET /api/users/[id]/achievements
 * Get user's achievements and progress with privacy controls
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: targetUserId } = params;
    const url = new URL(request.url);
    
    // Get query parameters
    const requestingUserId = url.searchParams.get('requesting_user_id');
    const includeProgress = url.searchParams.get('include_progress') === 'true';
    const category = url.searchParams.get('category');

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Check if requesting user can view this user's profile
    const canViewProfile = await socialService.canViewUserProfile(targetUserId, requestingUserId);
    if (!canViewProfile) {
      return NextResponse.json(
        { error: 'Profile is private' },
        { status: 403 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (includeProgress) {
      // Get comprehensive achievement progress (for own profile or detailed view)
      const progressData = await achievementEngine.getUserAchievementProgress(targetUserId);
      
      // Filter by category if specified
      let filteredAchievements = progressData.achievements;
      if (category) {
        filteredAchievements = progressData.achievements.filter(
          (item: any) => item.achievement.category === category
        );
      }

      const response: UserAchievementsResponse = {
        achievements: filteredAchievements.map((item: any) => ({
          id: item.isEarned ? `${targetUserId}-${item.achievement.id}` : '',
          user_id: targetUserId,
          achievement_id: item.achievement.id,
          earned_at: item.earnedAt || '',
          context: {},
          achievement: item.achievement,
          progress: item.progress,
          isEarned: item.isEarned
        })),
        total: filteredAchievements.length,
        totalPoints: progressData.totalPoints,
        recentAchievements: progressData.recentAchievements
      };

      return NextResponse.json(response);
    } else {
      // Get only earned achievements (for public view)
      let query = supabase
        .from('user_achievements')
        .select(`
          id, user_id, achievement_id, earned_at, context,
          achievement:achievements(
            id, name, description, icon, category, points, is_active
          )
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      // Filter by category if specified
      if (category) {
        query = query.eq('achievement.category', category);
      }

      const { data: achievements, error: achievementsError } = await query;

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        return NextResponse.json(
          { error: 'Failed to fetch achievements' },
          { status: 500 }
        );
      }

      // Calculate total points
      const totalPoints = achievements?.reduce((sum, ua) => 
        sum + (ua.achievement?.points || 0), 0
      ) || 0;

      // Get recent achievements (last 5)
      const recentAchievements = achievements?.slice(0, 5) || [];

      const response: UserAchievementsResponse = {
        achievements: achievements || [],
        total: achievements?.length || 0,
        totalPoints,
        recentAchievements
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/achievements
 * Manually trigger achievement check (admin only or for testing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id: userId } = params;
    
    // Get requesting user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate JWT token and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is admin or checking their own achievements
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (authUser.id !== userId && !userInfo?.is_admin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse request body for optional context
    const body = await request.json().catch(() => ({}));
    const { activity_type = 'manual_check', context = {} } = body;

    // Trigger achievement check
    const newAchievements = await achievementEngine.checkAndAwardAchievements(
      userId,
      activity_type,
      context
    );

    return NextResponse.json({
      message: 'Achievement check completed',
      newAchievements,
      count: newAchievements.length
    });
  } catch (error) {
    console.error('Error triggering achievement check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}