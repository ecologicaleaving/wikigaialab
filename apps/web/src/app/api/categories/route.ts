import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if this is an admin request (include inactive categories)
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    if (includeInactive) {
      // Admin view - check admin permissions
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

      // Fetch all categories for admin
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: 'Errore nel caricamento delle categorie' },
          { status: 500 }
        );
      }

      return NextResponse.json(categories || []);
    }
    
    // Public view - fetch active categories only
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, description, order_index, is_active, icon_name, color_hex')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Errore nel caricamento delle categorie' },
        { status: 500 }
      );
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Create new category (Admin only)
export async function POST(request: NextRequest) {
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
    const { name, description, icon_name, color_hex, keywords } = body;

    // Validate required fields
    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Nome categoria deve essere tra 2 e 50 caratteri' },
        { status: 400 }
      );
    }

    // Get next order index
    const { data: lastCategory } = await supabase
      .from('categories')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastCategory?.order_index || 0) + 1;

    // Create category
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        description: description || null,
        icon_name: icon_name || 'folder',
        color_hex: color_hex || '#6B7280',
        keywords: keywords || [],
        order_index: nextOrderIndex,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Una categoria con questo nome esiste già' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Errore nella creazione della categoria' },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}