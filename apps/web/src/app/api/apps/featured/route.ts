import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get featured apps
    const { data: apps, error } = await supabase
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
        created_at,
        problems(
          id,
          title
        )
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Database error fetching featured apps:', error);
      return NextResponse.json(
        { error: 'Errore nel caricamento delle app in evidenza' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apps: apps || []
    });

  } catch (error) {
    console.error('Unexpected error in featured apps API:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}