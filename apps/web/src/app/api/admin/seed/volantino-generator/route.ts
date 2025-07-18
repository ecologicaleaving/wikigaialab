import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Autenticazione richiesta' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Accesso negato - privilegi di amministratore richiesti' },
        { status: 403 }
      );
    }

    // First, create the database schema
    const schemaSQL = `
      -- Create Volantino Generator tables
      CREATE TABLE IF NOT EXISTS app_volantino_flyers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          event_name TEXT NOT NULL,
          event_date TIMESTAMP WITH TIME ZONE NOT NULL,
          event_location TEXT NOT NULL,
          event_description TEXT,
          event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'business', 'party', 'community')),
          contact_info TEXT,
          design_style TEXT NOT NULL DEFAULT 'classic',
          design_data JSONB NOT NULL,
          image_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_volantino_downloads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          flyer_id UUID NOT NULL REFERENCES app_volantino_flyers(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          format TEXT NOT NULL CHECK (format IN ('png', 'pdf')),
          has_watermark BOOLEAN NOT NULL DEFAULT true,
          downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_volantino_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          template_data JSONB NOT NULL,
          is_public BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_app_volantino_flyers_user_id ON app_volantino_flyers(user_id);
      CREATE INDEX IF NOT EXISTS idx_app_volantino_flyers_created_at ON app_volantino_flyers(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_app_volantino_downloads_user_id ON app_volantino_downloads(user_id);
      CREATE INDEX IF NOT EXISTS idx_app_volantino_downloads_flyer_id ON app_volantino_downloads(flyer_id);

      -- Enable RLS
      ALTER TABLE app_volantino_flyers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app_volantino_downloads ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app_volantino_templates ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Users can view their own flyers" ON app_volantino_flyers;
      CREATE POLICY "Users can view their own flyers" ON app_volantino_flyers
          FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert their own flyers" ON app_volantino_flyers;
      CREATE POLICY "Users can insert their own flyers" ON app_volantino_flyers
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update their own flyers" ON app_volantino_flyers;
      CREATE POLICY "Users can update their own flyers" ON app_volantino_flyers
          FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete their own flyers" ON app_volantino_flyers;
      CREATE POLICY "Users can delete their own flyers" ON app_volantino_flyers
          FOR DELETE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can view their own downloads" ON app_volantino_downloads;
      CREATE POLICY "Users can view their own downloads" ON app_volantino_downloads
          FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert their own downloads" ON app_volantino_downloads;
      CREATE POLICY "Users can insert their own downloads" ON app_volantino_downloads
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can view their own templates" ON app_volantino_templates;
      CREATE POLICY "Users can view their own templates" ON app_volantino_templates
          FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can view public templates" ON app_volantino_templates;
      CREATE POLICY "Users can view public templates" ON app_volantino_templates
          FOR SELECT USING (is_public = true);

      DROP POLICY IF EXISTS "Users can insert their own templates" ON app_volantino_templates;
      CREATE POLICY "Users can insert their own templates" ON app_volantino_templates
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update their own templates" ON app_volantino_templates;
      CREATE POLICY "Users can update their own templates" ON app_volantino_templates
          FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete their own templates" ON app_volantino_templates;
      CREATE POLICY "Users can delete their own templates" ON app_volantino_templates
          FOR DELETE USING (auth.uid() = user_id);
    `;

    // Execute the schema creation
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (schemaError) {
      console.error('Error creating schema:', schemaError);
      return NextResponse.json(
        { error: 'Errore nella creazione dello schema database' },
        { status: 500 }
      );
    }

    // Create the "Generatore di Volantini" problem if it doesn't exist
    const { data: existingProblem, error: problemError } = await supabase
      .from('problems')
      .select('id')
      .eq('title', 'Generatore di Volantini')
      .single();

    let problemId = existingProblem?.id;

    if (!existingProblem) {
      const { data: newProblem, error: createProblemError } = await supabase
        .from('problems')
        .insert({
          title: 'Generatore di Volantini',
          description: 'Uno strumento per creare volantini professionali per eventi locali senza competenze grafiche. Perfetto per feste, eventi di comunità, promozioni commerciali e molto altro.',
          category_id: null, // We'll set this later if needed
          proposer_id: user.id,
          vote_count: 100, // Start with 100 votes to simulate community approval
          status: 'solved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createProblemError) {
        console.error('Error creating problem:', createProblemError);
        return NextResponse.json(
          { error: 'Errore nella creazione del problema' },
          { status: 500 }
        );
      }

      problemId = newProblem.id;
    }

    // Check if the Volantino Generator app already exists
    const { data: existingApp, error: appCheckError } = await supabase
      .from('apps')
      .select('id')
      .eq('slug', 'volantino-generator')
      .single();

    if (existingApp) {
      return NextResponse.json({
        success: true,
        message: 'Volantino Generator già esistente',
        appId: existingApp.id
      });
    }

    // Create the Volantino Generator app
    const { data: newApp, error: createAppError } = await supabase
      .from('apps')
      .insert({
        name: 'Generatore di Volantini',
        slug: 'volantino-generator',
        description: 'Crea volantini professionali in pochi click con l\'aiuto dell\'intelligenza artificiale. Perfetto per eventi, feste, promozioni e molto altro.',
        version: '1.0.0',
        access_model: 'freemium',
        base_features: [
          'Creazione volantini con AI',
          'Template predefiniti',
          'Personalizzazione testi',
          'Download PNG con watermark',
          'Condivisione sui social'
        ],
        premium_features: [
          'Download PDF alta qualità',
          'Rimozione watermark',
          'Template personalizzati',
          'Esportazione modificabile',
          'Cronologia completa'
        ],
        is_published: true,
        problem_id: problemId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createAppError) {
      console.error('Error creating app:', createAppError);
      return NextResponse.json(
        { error: 'Errore nella creazione dell\'app' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Volantino Generator creato con successo',
      appId: newApp.id,
      problemId: problemId
    });

  } catch (error) {
    console.error('Unexpected error in Volantino Generator seed:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}