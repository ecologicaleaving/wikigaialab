/**
 * Achievements API Endpoint
 * Story 4.3: User Profiles & Social Features
 * GET /api/achievements - Get all available achievements
 * POST /api/achievements - Create new achievement (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Achievement } from '../../../../../@wikigaialab/shared/types/social';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/achievements
 * Get all available achievements with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    
    // Get query parameters
    const category = url.searchParams.get('category');
    const isActive = url.searchParams.get('active');
    const sortBy = url.searchParams.get('sort_by') || 'category';
    const sortOrder = url.searchParams.get('sort_order') || 'asc';

    // Build query
    let query = supabase
      .from('achievements')
      .select('*');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Apply sorting
    const validSortFields = ['name', 'category', 'points', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'category';
    const ascending = sortOrder === 'asc';

    query = query.order(sortField, { ascending });

    const { data: achievements, error } = await query;

    if (error) {
      console.error('Error fetching achievements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Group achievements by category for better organization
    const achievementsByCategory = (achievements || []).reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);

    return NextResponse.json({
      achievements: achievements || [],
      achievementsByCategory,
      total: achievements?.length || 0,
      categories: Object.keys(achievementsByCategory)
    });
  } catch (error) {
    console.error('Error in achievements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/achievements
 * Create a new achievement (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    // Check if user is admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (!userInfo?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const {
      name,
      description,
      icon,
      category,
      points,
      criteria,
      is_active = true
    } = await request.json();

    // Validate required fields
    if (!name || !description || !category || !criteria) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, category, criteria' },
        { status: 400 }
      );
    }

    // Validate field lengths and constraints
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    if (description.length < 10 || description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be between 10 and 500 characters' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['voting', 'problems', 'community', 'engagement', 'special'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
        { status: 400 }
      );
    }

    // Validate points
    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json(
        { error: 'Points must be a non-negative number' },
        { status: 400 }
      );
    }

    // Validate criteria structure
    if (typeof criteria !== 'object' || !criteria.type) {
      return NextResponse.json(
        { error: 'Criteria must be an object with a type field' },
        { status: 400 }
      );
    }

    const validCriteriaTypes = [
      'vote_count', 'problem_count', 'problem_votes_received', 'following_count',
      'follower_count', 'join_date', 'profile_complete', 'favorite_count', 'activity_streak'
    ];

    if (!validCriteriaTypes.includes(criteria.type)) {
      return NextResponse.json(
        { error: 'Invalid criteria type. Must be one of: ' + validCriteriaTypes.join(', ') },
        { status: 400 }
      );
    }

    // Check for duplicate names
    const { data: existingAchievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('name', name)
      .single();

    if (existingAchievement) {
      return NextResponse.json(
        { error: 'Achievement with this name already exists' },
        { status: 409 }
      );
    }

    // Create achievement
    const { data: newAchievement, error: createError } = await supabase
      .from('achievements')
      .insert({
        name,
        description,
        icon,
        category,
        points,
        criteria,
        is_active
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating achievement:', createError);
      return NextResponse.json(
        { error: 'Failed to create achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json(newAchievement, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/achievements
 * Update achievement (admin only)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
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

    // Check if user is admin
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (!userInfo?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse request body
    const {
      id,
      name,
      description,
      icon,
      category,
      points,
      criteria,
      is_active
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Achievement ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateFields: Partial<Achievement> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (name.length < 2 || name.length > 100) {
        return NextResponse.json(
          { error: 'Name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      updateFields.name = name;
    }

    if (description !== undefined) {
      if (description.length < 10 || description.length > 500) {
        return NextResponse.json(
          { error: 'Description must be between 10 and 500 characters' },
          { status: 400 }
        );
      }
      updateFields.description = description;
    }

    if (icon !== undefined) updateFields.icon = icon;

    if (category !== undefined) {
      const validCategories = ['voting', 'problems', 'community', 'engagement', 'special'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      updateFields.category = category;
    }

    if (points !== undefined) {
      if (typeof points !== 'number' || points < 0) {
        return NextResponse.json(
          { error: 'Points must be a non-negative number' },
          { status: 400 }
        );
      }
      updateFields.points = points;
    }

    if (criteria !== undefined) {
      if (typeof criteria !== 'object' || !criteria.type) {
        return NextResponse.json(
          { error: 'Invalid criteria structure' },
          { status: 400 }
        );
      }
      updateFields.criteria = criteria;
    }

    if (is_active !== undefined) updateFields.is_active = is_active;

    // Update achievement
    const { data: updatedAchievement, error: updateError } = await supabase
      .from('achievements')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating achievement:', updateError);
      return NextResponse.json(
        { error: 'Failed to update achievement' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAchievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}