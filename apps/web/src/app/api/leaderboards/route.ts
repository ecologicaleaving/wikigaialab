/**
 * Community Leaderboards API Endpoint
 * Story 4.5: Community Growth Tools
 * 
 * GET /api/leaderboards - Get leaderboard data and rankings
 * POST /api/leaderboards - Create new leaderboard (admin only)
 * PUT /api/leaderboards - Update leaderboard rankings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    reputation_score: number;
  };
  score: number;
  previousRank?: number;
  rankChange: number;
  streakCount: number;
  calculationData?: any;
}

interface LeaderboardResponse {
  leaderboard: {
    id: string;
    name: string;
    description: string;
    type: string;
    period: string;
    isActive: boolean;
    isFeatured: boolean;
    maxEntries: number;
    lastUpdated: string;
  };
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalParticipants: number;
  periodInfo: {
    start: string;
    end: string;
    current: boolean;
  };
}

/**
 * GET /api/leaderboards
 * Get leaderboard data and rankings
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const leaderboardId = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const period = url.searchParams.get('period');
    const userId = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const categoryId = url.searchParams.get('category_id');

    if (leaderboardId) {
      // Get specific leaderboard
      return await getSpecificLeaderboard(leaderboardId, userId, limit);
    } else {
      // Get list of available leaderboards
      return await getLeaderboardsList(type, period, categoryId);
    }
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leaderboards
 * Create new leaderboard (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await getSupabaseClient().auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await getSupabaseClient()
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      type,
      period,
      categoryId,
      categoryFilter,
      maxEntries,
      calculationMethod,
      weightConfig,
      isActive = true,
      isFeatured = false
    } = body;

    // Validate required fields
    if (!name || !type || !period || !calculationMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, period, calculationMethod' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validTypes = ['votes', 'problems', 'referrals', 'engagement', 'reputation', 'streak'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time'];
    const validMethods = ['sum', 'count', 'average', 'max', 'weighted'];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid leaderboard type' },
        { status: 400 }
      );
    }

    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period' },
        { status: 400 }
      );
    }

    if (!validMethods.includes(calculationMethod)) {
      return NextResponse.json(
        { error: 'Invalid calculation method' },
        { status: 400 }
      );
    }

    // Create leaderboard
    const { data: newLeaderboard, error: createError } = await getSupabaseClient()
      .from('leaderboards')
      .insert({
        name,
        description,
        type,
        period,
        category_id: categoryId || null,
        category_filter: categoryFilter || null,
        is_active: isActive,
        is_featured: isFeatured,
        max_entries: maxEntries || 100,
        calculation_method: calculationMethod,
        weight_config: weightConfig || {},
        metadata: {
          created_by: authUser.id,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create leaderboard' },
        { status: 500 }
      );
    }

    // Calculate initial rankings
    await calculateLeaderboardRankings(newLeaderboard.id);

    return NextResponse.json({
      success: true,
      leaderboard: newLeaderboard
    });
  } catch (error) {
    console.error('Error creating leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leaderboards
 * Update leaderboard rankings
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { leaderboardId, action } = body;

    if (!leaderboardId || !action) {
      return NextResponse.json(
        { error: 'Leaderboard ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'recalculate') {
      // Recalculate leaderboard rankings
      const entriesCreated = await calculateLeaderboardRankings(leaderboardId);
      
      if (entriesCreated === -1) {
        return NextResponse.json(
          { error: 'Leaderboard not found or inactive' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Recalculated ${entriesCreated} leaderboard entries`
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function getSpecificLeaderboard(leaderboardId: string, userId?: string | null, limit: number = 50): Promise<NextResponse> {
  // Get leaderboard info
  const { data: leaderboard, error: leaderboardError } = await getSupabaseClient()
    .from('leaderboards')
    .select('*')
    .eq('id', leaderboardId)
    .eq('is_active', true)
    .single();

  if (leaderboardError || !leaderboard) {
    return NextResponse.json(
      { error: 'Leaderboard not found' },
      { status: 404 }
    );
  }

  // Calculate current period
  const now = new Date();
  const { periodStart, periodEnd } = calculatePeriodDates(leaderboard.period, now);

  // Get leaderboard entries for current period
  const { data: entries, error: entriesError } = await getSupabaseClient()
    .from('leaderboard_entries')
    .select(`
      rank, score, previous_rank, rank_change, streak_count, calculation_data, updated_at,
      user:user_id(id, name, avatar_url, reputation_score)
    `)
    .eq('leaderboard_id', leaderboardId)
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString())
    .order('rank', { ascending: true })
    .limit(limit);

  if (entriesError) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard entries' },
      { status: 500 }
    );
  }

  // Get current user's rank if userId provided
  let currentUserRank: number | undefined;
  if (userId) {
    const { data: userEntry } = await getSupabaseClient()
      .from('leaderboard_entries')
      .select('rank')
      .eq('leaderboard_id', leaderboardId)
      .eq('user_id', userId)
      .gte('period_start', periodStart.toISOString())
      .lte('period_end', periodEnd.toISOString())
      .single();

    currentUserRank = userEntry?.rank;
  }

  // Get total participants count
  const { count: totalParticipants } = await getSupabaseClient()
    .from('leaderboard_entries')
    .select('id', { count: 'exact', head: true })
    .eq('leaderboard_id', leaderboardId)
    .gte('period_start', periodStart.toISOString())
    .lte('period_end', periodEnd.toISOString());

  const formattedEntries: LeaderboardEntry[] = (entries || []).map(entry => ({
    rank: entry.rank,
    user: {
      id: entry.user.id,
      name: entry.user.name,
      avatar_url: entry.user.avatar_url,
      reputation_score: entry.user.reputation_score
    },
    score: entry.score,
    previousRank: entry.previous_rank,
    rankChange: entry.rank_change,
    streakCount: entry.streak_count,
    calculationData: entry.calculation_data
  }));

  const response: LeaderboardResponse = {
    leaderboard: {
      id: leaderboard.id,
      name: leaderboard.name,
      description: leaderboard.description,
      type: leaderboard.type,
      period: leaderboard.period,
      isActive: leaderboard.is_active,
      isFeatured: leaderboard.is_featured,
      maxEntries: leaderboard.max_entries,
      lastUpdated: leaderboard.updated_at
    },
    entries: formattedEntries,
    currentUserRank,
    totalParticipants: totalParticipants || 0,
    periodInfo: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      current: now >= periodStart && now <= periodEnd
    }
  };

  return NextResponse.json(response);
}

async function getLeaderboardsList(type?: string | null, period?: string | null, categoryId?: string | null): Promise<NextResponse> {
  let query = getSupabaseClient()
    .from('leaderboards')
    .select(`
      id, name, description, type, period, is_active, is_featured,
      max_entries, updated_at, category_id,
      categories(name)
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }
  if (period) {
    query = query.eq('period', period);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: leaderboards, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboards' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    leaderboards: leaderboards || []
  });
}

async function calculateLeaderboardRankings(leaderboardId: string): Promise<number> {
  const now = new Date();
  
  // Get leaderboard configuration
  const { data: leaderboard, error: leaderboardError } = await getSupabaseClient()
    .from('leaderboards')
    .select('*')
    .eq('id', leaderboardId)
    .eq('is_active', true)
    .single();

  if (leaderboardError || !leaderboard) {
    return -1;
  }

  const { periodStart, periodEnd } = calculatePeriodDates(leaderboard.period, now);
  
  // Call the database function to calculate rankings
  const { data: entriesCreated, error: calcError } = await getSupabaseClient()
    .rpc('calculate_leaderboard_rankings', {
      leaderboard_id: leaderboardId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString()
    });

  if (calcError) {
    console.error('Error calculating leaderboard rankings:', calcError);
    return -1;
  }

  // Update leaderboard's updated_at timestamp
  await getSupabaseClient()
    .from('leaderboards')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', leaderboardId);

  return entriesCreated || 0;
}

function calculatePeriodDates(period: string, currentDate: Date): { periodStart: Date; periodEnd: Date } {
  const now = new Date(currentDate);
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;
    
    case 'weekly':
      const dayOfWeek = now.getDay();
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;
    
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), quarter * 3, 1);
      periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      break;
    
    case 'yearly':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    
    case 'all_time':
    default:
      periodStart = new Date('2020-01-01'); // App launch date
      periodEnd = new Date('2099-12-31');
      break;
  }

  return { periodStart, periodEnd };
}