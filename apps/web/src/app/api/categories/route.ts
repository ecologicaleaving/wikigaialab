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

    console.log('Attempting to fetch categories from database...');
    
    const supabase = getSupabaseClient();
    
    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      
      // Return fallback categories if database is not available
      const fallbackCategories = [
        {
          id: 'a1b2c3d4-e5f6-4890-ab12-cd34ef567890',
          name: 'Ambiente',
          description: 'Problemi legati all\'ambiente e sostenibilità',
          color: '#10B981',
          icon: 'leaf',
          is_active: true,
          problem_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'b2c3d4e5-f6a7-4901-bc23-de45af678901', 
          name: 'Mobilità',
          description: 'Trasporti e mobilità urbana',
          color: '#3B82F6',
          icon: 'car',
          is_active: true,
          problem_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'c3d4e5f6-a7b8-4012-cd34-ef56ab789012',
          name: 'Energia',
          description: 'Efficienza energetica e fonti rinnovabili',
          color: '#F59E0B',
          icon: 'lightning-bolt',
          is_active: true,
          problem_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'd4e5f6a7-b8c9-4123-de45-fa67bc890123',
          name: 'Sociale',
          description: 'Problemi sociali e comunitari',
          color: '#EF4444',
          icon: 'users',
          is_active: true,
          problem_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      console.log('Using fallback categories due to database error');
      return NextResponse.json({
        success: true,
        data: fallbackCategories,
        fallback: true
      });
    }

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
    console.log(`Successfully fetched ${result.length} categories from database`);

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