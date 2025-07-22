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

export async function POST(request: NextRequest) {
  try {
    console.log('Seeding categories...');
    
    const supabase = getSupabaseClient();

    // Check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing categories:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + checkError.message
      }, { status: 500 });
    }

    if (existingCategories && existingCategories.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Categories already exist',
        count: existingCategories.length
      });
    }

    // Create default categories
    const defaultCategories = [
      {
        id: 'a1b2c3d4-e5f6-4890-ab12-cd34ef567890',
        name: 'Ambiente',
        description: 'Problemi legati all\'ambiente e sostenibilità',
        color: '#10B981',
        icon: 'leaf',
        is_active: true,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: insertedCategories, error: insertError } = await supabase
      .from('categories')
      .insert(defaultCategories)
      .select();

    if (insertError) {
      console.error('Error inserting categories:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert categories: ' + insertError.message
      }, { status: 500 });
    }

    console.log(`Successfully seeded ${insertedCategories?.length || 0} categories`);

    return NextResponse.json({
      success: true,
      message: 'Categories seeded successfully',
      data: insertedCategories,
      count: insertedCategories?.length || 0
    });

  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to seed categories'
    }, { status: 500 });
  }
}