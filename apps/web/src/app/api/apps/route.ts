import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const accessModel = searchParams.get('accessModel');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('apps')
      .select(`
        id,
        name,
        description,
        version,
        slug,
        access_model,
        base_features,
        premium_features,
        is_published,
        created_at,
        updated_at,
        problems(
          id,
          title
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (accessModel) {
      query = query.eq('access_model', accessModel);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('apps')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);

    // Apply same filters to count
    if (accessModel) countQuery.eq('access_model', accessModel);
    if (search) countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    const [{ data: apps, error: appsError }, { count }] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery
    ]);

    if (appsError) {
      console.error('Database error fetching apps:', appsError);
      return NextResponse.json(
        { error: 'Errore nel caricamento delle app' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      apps: apps || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Unexpected error in apps API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}