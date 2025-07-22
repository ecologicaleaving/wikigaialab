import { NextRequest, NextResponse } from 'next/server';

// Fallback categories that always work
const FALLBACK_CATEGORIES = [
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

export async function GET(request: NextRequest) {
  try {
    console.log('Categories API called');
    
    // Check if we have required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase environment variables, using fallback categories');
      return NextResponse.json({
        success: true,
        data: FALLBACK_CATEGORIES,
        fallback: true,
        reason: 'missing_env_vars'
      });
    }

    // Try to import and use Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      console.log('Testing database connection...');
      
      // Simple database test
      const { data: testData, error: testError } = await supabase
        .from('categories')
        .select('id, name')
        .limit(1);

      if (testError) {
        console.error('Database test failed:', testError.message);
        return NextResponse.json({
          success: true,
          data: FALLBACK_CATEGORIES,
          fallback: true,
          reason: 'db_connection_failed',
          error: testError.message
        });
      }

      // If test succeeds, fetch real categories
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error.message);
        return NextResponse.json({
          success: true,
          data: FALLBACK_CATEGORIES,
          fallback: true,
          reason: 'fetch_failed',
          error: error.message
        });
      }

      if (!categories || categories.length === 0) {
        console.log('No categories found in database, attempting to seed them...');
        
        // Try to seed default categories
        const { error: seedError } = await supabase
          .from('categories')
          .insert(FALLBACK_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            is_active: cat.is_active,
            created_at: cat.created_at,
            updated_at: cat.updated_at
          })));

        if (seedError) {
          console.error('Failed to seed categories:', seedError);
          return NextResponse.json({
            success: true,
            data: FALLBACK_CATEGORIES,
            fallback: true,
            reason: 'seed_failed'
          });
        }

        console.log('Categories seeded successfully, returning seeded data');
        return NextResponse.json({
          success: true,
          data: FALLBACK_CATEGORIES,
          seeded: true
        });
      }

      console.log(`Successfully fetched ${categories.length} categories from database`);
      return NextResponse.json({
        success: true,
        data: categories
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        success: true,
        data: FALLBACK_CATEGORIES,
        fallback: true,
        reason: 'db_error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }

  } catch (error) {
    console.error('Categories API error:', error);
    
    // Always return success with fallback categories to prevent frontend errors
    return NextResponse.json({
      success: true,
      data: FALLBACK_CATEGORIES,
      fallback: true,
      reason: 'api_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}