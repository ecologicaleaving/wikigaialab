import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    id: string;
  };
}

// Get single category (Admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const categoryId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { error: 'ID categoria non valido' },
        { status: 400 }
      );
    }

    // Get category with problem count
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        *,
        problems_count
      `)
      .eq('id', categoryId)
      .single();

    if (error || !category) {
      return NextResponse.json(
        { error: 'Categoria non trovata' },
        { status: 404 }
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

// Update category (Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const categoryId = params.id;
    const body = await request.json();
    const { name, description, icon_name, color_hex, keywords, is_active, order_index } = body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { error: 'ID categoria non valido' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (name && (name.length < 2 || name.length > 50)) {
      return NextResponse.json(
        { error: 'Nome categoria deve essere tra 2 e 50 caratteri' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon_name !== undefined) updateData.icon_name = icon_name;
    if (color_hex !== undefined) updateData.color_hex = color_hex;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (order_index !== undefined) updateData.order_index = order_index;

    // Update category
    const { data: category, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', categoryId)
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
        { error: 'Errore nell\'aggiornamento della categoria' },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria non trovata' },
        { status: 404 }
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

// Delete category (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const categoryId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { error: 'ID categoria non valido' },
        { status: 400 }
      );
    }

    // Check if category has problems
    const { data: problemsCheck } = await supabase
      .from('problems')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (problemsCheck && problemsCheck.length > 0) {
      // Soft delete (deactivate) instead of hard delete
      const { data: category, error } = await supabase
        .from('categories')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Errore nella disattivazione della categoria' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Categoria disattivata (contiene problemi esistenti)',
        category
      });
    }

    // Hard delete if no problems
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      return NextResponse.json(
        { error: 'Errore nell\'eliminazione della categoria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Categoria eliminata definitivamente'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}