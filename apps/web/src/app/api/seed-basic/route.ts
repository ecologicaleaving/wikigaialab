import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get the current user to use as the proposer
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure user exists in database
    await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'User',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user',
        is_admin: false,
      })
      .select()
      .single();

    // Create a basic category if it doesn't exist
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Generale',
        description: 'Categoria generale per problemi vari',
        icon: '🌍',
        is_active: true,
      })
      .select()
      .single();

    if (categoryError && categoryError.code !== '23505') { // ignore duplicate key error
      console.error('Category creation error:', categoryError);
    }

    // Create a test problem
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .upsert({
        id: '650e8400-e29b-41d4-a716-446655440001',
        title: 'Problema di Test',
        description: 'Questo è un problema di test creato per verificare il funzionamento dell\'applicazione. Puoi votarlo e interagire con esso per testare le funzionalità.',
        status: 'Proposed',
        vote_count: 1,
        proposer_id: user.id,
        category_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      .select()
      .single();

    if (problemError && problemError.code !== '23505') { // ignore duplicate key error
      console.error('Problem creation error:', problemError);
      return NextResponse.json({ 
        error: 'Failed to create test problem',
        details: problemError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Basic data seeded successfully',
      data: {
        user: user.id,
        category: category?.id,
        problem: problem?.id
      }
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      error: 'Failed to seed basic data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}