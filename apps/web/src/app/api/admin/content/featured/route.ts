import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

// Get featured content management interface
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || 'all'; // 'featured', 'not_featured', 'all'

    const offset = (page - 1) * limit;

    // Build query for problems eligible for featuring
    let query = supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        vote_count,
        created_at,
        is_featured,
        featured_until,
        moderation_status,
        proposer:users!proposer_id(id, name, avatar_url),
        category:categories!category_id(id, name, color_hex)
      `, { count: 'exact' })
      .eq('moderation_status', 'approved')
      .range(offset, offset + limit - 1)
      .order('vote_count', { ascending: false });

    // Apply featured status filter
    if (status === 'featured') {
      query = query.eq('is_featured', true);
    } else if (status === 'not_featured') {
      query = query.eq('is_featured', false);
    }

    const { data: problems, error: problemsError, count } = await query;

    if (problemsError) {
      console.error('Error fetching problems for featuring:', problemsError);
      return NextResponse.json(
        { error: 'Failed to fetch problems' },
        { status: 500 }
      );
    }

    // Get content collections
    const { data: collections, error: collectionsError } = await supabase
      .from('content_collections')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        collection_problems(
          problem_id,
          display_order,
          problems(id, title, vote_count)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError);
    }

    // Get featured content statistics
    const { count: totalFeatured } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true);

    const { count: activeFeatured } = await supabase
      .from('problems')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`);

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        problems: problems || [],
        collections: collections || [],
        stats: {
          totalFeatured: totalFeatured || 0,
          activeFeatured: activeFeatured || 0,
          eligibleForFeaturing: count || 0
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: count || 0,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error in featured content API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Manage featured content and collections
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, problemIds, collectionData, duration } = body;

    if (!action || !['feature', 'unfeature', 'create_collection', 'add_to_collection'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'feature':
        if (!problemIds || !Array.isArray(problemIds)) {
          return NextResponse.json(
            { error: 'Problem IDs are required for featuring' },
            { status: 400 }
          );
        }

        // Calculate featured_until date based on duration
        let featuredUntil = null;
        if (duration && duration !== 'permanent') {
          const durationMap = {
            '1week': 7,
            '1month': 30,
            '3months': 90
          };
          const days = durationMap[duration as keyof typeof durationMap] || 7;
          featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }

        const { error: featureError } = await supabase
          .from('problems')
          .update({
            is_featured: true,
            featured_until: featuredUntil,
            updated_at: new Date().toISOString()
          })
          .in('id', problemIds)
          .eq('moderation_status', 'approved');

        if (featureError) {
          return NextResponse.json(
            { error: 'Failed to feature problems' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Featured ${problemIds.length} problem(s)`,
          data: { featuredCount: problemIds.length, duration: duration || 'permanent' }
        });

      case 'unfeature':
        if (!problemIds || !Array.isArray(problemIds)) {
          return NextResponse.json(
            { error: 'Problem IDs are required for unfeaturing' },
            { status: 400 }
          );
        }

        const { error: unfeatureError } = await supabase
          .from('problems')
          .update({
            is_featured: false,
            featured_until: null,
            updated_at: new Date().toISOString()
          })
          .in('id', problemIds);

        if (unfeatureError) {
          return NextResponse.json(
            { error: 'Failed to unfeature problems' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Unfeatured ${problemIds.length} problem(s)`,
          data: { unfeaturedCount: problemIds.length }
        });

      case 'create_collection':
        if (!collectionData || !collectionData.name) {
          return NextResponse.json(
            { error: 'Collection name is required' },
            { status: 400 }
          );
        }

        const { data: newCollection, error: collectionError } = await supabase
          .from('content_collections')
          .insert({
            name: collectionData.name,
            description: collectionData.description || null,
            created_by: user.id,
            is_active: true
          })
          .select('*')
          .single();

        if (collectionError) {
          return NextResponse.json(
            { error: 'Failed to create collection' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Collection created successfully',
          data: newCollection
        });

      case 'add_to_collection':
        const { collectionId, problemId } = body;
        
        if (!collectionId || !problemId) {
          return NextResponse.json(
            { error: 'Collection ID and problem ID are required' },
            { status: 400 }
          );
        }

        const { error: addError } = await supabase
          .from('collection_problems')
          .insert({
            collection_id: collectionId,
            problem_id: problemId,
            added_by: user.id,
            display_order: 0
          });

        if (addError) {
          if (addError.code === '23505') { // Unique constraint violation
            return NextResponse.json(
              { error: 'Problem is already in this collection' },
              { status: 409 }
            );
          }
          return NextResponse.json(
            { error: 'Failed to add problem to collection' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Problem added to collection successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in featured content management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}