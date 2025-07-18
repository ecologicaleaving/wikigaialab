import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface FlyerRequest {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventDescription: string;
  eventType: 'birthday' | 'business' | 'party' | 'community';
  contactInfo: string;
  designStyle: string;
}

interface GeneratedFlyer {
  id: string;
  design: {
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
    };
    layout: 'classic' | 'modern' | 'creative';
    elements: {
      title: string;
      subtitle: string;
      body: string;
      footer: string;
    };
  };
  imageUrl?: string;
  createdAt: string;
}

const COLOR_SCHEMES = {
  birthday: {
    primary: '#EC4899',
    secondary: '#F9A8D4',
    accent: '#FDE68A',
    text: '#FFFFFF'
  },
  business: {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    text: '#FFFFFF'
  },
  party: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    accent: '#DDD6FE',
    text: '#FFFFFF'
  },
  community: {
    primary: '#059669',
    secondary: '#10B981',
    accent: '#6EE7B7',
    text: '#FFFFFF'
  }
};

const DESIGN_TEMPLATES = {
  classic: {
    layout: 'classic' as const,
    titleFormat: (name: string) => name.toUpperCase(),
    subtitleFormat: (date: string, location: string) => `${formatDate(date)} • ${location}`,
    bodyFormat: (desc: string) => desc || 'Partecipa al nostro evento speciale!',
    footerFormat: (contact: string) => contact || 'Per informazioni contattaci'
  },
  modern: {
    layout: 'modern' as const,
    titleFormat: (name: string) => name,
    subtitleFormat: (date: string, location: string) => `${formatDate(date)}\n${location}`,
    bodyFormat: (desc: string) => desc || 'Ti aspettiamo per un evento indimenticabile',
    footerFormat: (contact: string) => contact || 'Maggiori info disponibili'
  },
  creative: {
    layout: 'creative' as const,
    titleFormat: (name: string) => `✨ ${name} ✨`,
    subtitleFormat: (date: string, location: string) => `📅 ${formatDate(date)}\n📍 ${location}`,
    bodyFormat: (desc: string) => desc || '🎉 Non perdere questa occasione unica! 🎉',
    footerFormat: (contact: string) => contact || '📞 Contattaci per maggiori informazioni'
  }
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateFlyerContent(data: FlyerRequest): GeneratedFlyer {
  const template = DESIGN_TEMPLATES[data.designStyle] || DESIGN_TEMPLATES.classic;
  const colorScheme = COLOR_SCHEMES[data.eventType];
  
  const flyer: GeneratedFlyer = {
    id: crypto.randomUUID(),
    design: {
      colorScheme,
      layout: template.layout,
      elements: {
        title: template.titleFormat(data.eventName),
        subtitle: template.subtitleFormat(data.eventDate, data.eventLocation),
        body: template.bodyFormat(data.eventDescription),
        footer: template.footerFormat(data.contactInfo)
      }
    },
    createdAt: new Date().toISOString()
  };
  
  return flyer;
}

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
    
    const flyerData: FlyerRequest = await request.json();
    
    // Validate required fields
    if (!flyerData.eventName || !flyerData.eventDate || !flyerData.eventLocation) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti: nome evento, data e luogo' },
        { status: 400 }
      );
    }
    
    // Generate flyer content
    const generatedFlyer = generateFlyerContent(flyerData);
    
    // Save flyer to database for future reference
    const { error: insertError } = await supabase
      .from('app_volantino_flyers')
      .insert({
        id: generatedFlyer.id,
        user_id: user.id,
        event_name: flyerData.eventName,
        event_date: flyerData.eventDate,
        event_location: flyerData.eventLocation,
        event_description: flyerData.eventDescription,
        event_type: flyerData.eventType,
        contact_info: flyerData.contactInfo,
        design_style: flyerData.designStyle,
        design_data: generatedFlyer.design,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error saving flyer to database:', insertError);
      // Continue anyway - the generation was successful
    }
    
    // In a real implementation, you might call an AI service here
    // For now, we'll simulate a delay and return the generated content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return NextResponse.json({
      success: true,
      flyer: generatedFlyer
    });
    
  } catch (error) {
    console.error('Error generating flyer:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    
    // Get user's flyers
    const { data: flyers, error: fetchError } = await supabase
      .from('app_volantino_flyers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('Error fetching flyers:', fetchError);
      return NextResponse.json(
        { error: 'Errore nel recupero dei volantini' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      flyers: flyers || []
    });
    
  } catch (error) {
    console.error('Error in GET /api/apps/volantino-generator/generate:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}