import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'ID problema non valido' },
        { status: 400 }
      );
    }

    // Fetch problem with related data
    const { data: problem, error } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        status,
        vote_count,
        created_at,
        proposer:users!proposer_id(id, name, avatar_url),
        category:categories!category_id(id, name)
      `)
      .eq('id', problemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Problema non trovato' },
          { status: 404 }
        );
      }
      
      // console.error('Database error fetching problem:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento del problema' },
        { status: 500 }
      );
    }

    return NextResponse.json(problem);

  } catch (error) {
    // console.error('Unexpected error in problem detail API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}