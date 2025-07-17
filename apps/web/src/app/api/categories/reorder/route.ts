import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

// Reorder categories (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryIds } = body;

    // Validate input
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Array di ID categorie richiesto' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of categoryIds) {
      if (!uuidRegex.test(id)) {
        return NextResponse.json(
          { error: `ID categoria non valido: ${id}` },
          { status: 400 }
        );
      }
    }

    // Update order_index for each category
    const updates = categoryIds.map((categoryId: string, index: number) => 
      supabase
        .from('categories')
        .update({ 
          order_index: index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Errore nel riordinamento delle categorie' },
        { status: 500 }
      );
    }

    // Get updated categories
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Errore nel recupero delle categorie aggiornate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Categorie riordinate con successo',
      categories
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}