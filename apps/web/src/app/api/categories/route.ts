import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wikigaialab/database';

// Initialize Supabase client
function getSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const withStats = searchParams.get('withStats') === 'true';

    const supabase = getSupabaseClient();
    
    // Build base query
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    // Filter active categories unless specifically requested
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch categories',
        data: []
      }, { status: 500 });
    }

    let result = categories || [];

    // Add problem counts if requested
    if (withStats && result.length > 0) {
      const { data: problemCounts } = await supabase
        .from('problems')
        .select('category_id')
        .eq('status', 'published');

      if (problemCounts) {
        const countMap = problemCounts.reduce((acc: Record<string, number>, item) => {
          acc[item.category_id] = (acc[item.category_id] || 0) + 1;
          return acc;
        }, {});

        result = result.map(category => ({
          ...category,
          problem_count: countMap[category.id] || 0
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in categories GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
      data: []
    }, { status: 500 });
  }
}