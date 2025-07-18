import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface DownloadRequest {
  flyerId: string;
  format: 'png' | 'pdf';
}

// Mock function to generate image data
function generateMockImageData(format: 'png' | 'pdf', hasWatermark: boolean = true): Buffer {
  // In a real implementation, you would:
  // 1. Retrieve the flyer design from database
  // 2. Use a library like Puppeteer, Canvas, or Sharp to generate the image
  // 3. For PDF, use libraries like PDFKit or jsPDF
  // 4. Apply watermark if user doesn't have premium access
  
  const sampleContent = format === 'pdf' 
    ? '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Volantino Generato) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000206 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n299\n%%EOF'
    : 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return Buffer.from(sampleContent, format === 'pdf' ? 'ascii' : 'base64');
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
    
    const { flyerId, format }: DownloadRequest = await request.json();
    
    if (!flyerId || !format) {
      return NextResponse.json(
        { error: 'Parametri mancanti: flyerId e format sono obbligatori' },
        { status: 400 }
      );
    }
    
    if (!['png', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa png o pdf' },
        { status: 400 }
      );
    }
    
    // Get flyer data
    const { data: flyer, error: fetchError } = await supabase
      .from('app_volantino_flyers')
      .select('*')
      .eq('id', flyerId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !flyer) {
      return NextResponse.json(
        { error: 'Volantino non trovato' },
        { status: 404 }
      );
    }
    
    // Check if user has premium access for this app
    // This is a simplified check - in a real app you'd have more complex logic
    const { data: userVotes, error: voteError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    const hasPremiumAccess = userVotes && userVotes.length > 0;
    
    // For PDF downloads, premium access is required
    if (format === 'pdf' && !hasPremiumAccess) {
      return NextResponse.json(
        { error: 'Accesso premium richiesto per il download PDF' },
        { status: 403 }
      );
    }
    
    // Generate the image/PDF
    const hasWatermark = format === 'png' && !hasPremiumAccess;
    const imageData = generateMockImageData(format, hasWatermark);
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', format === 'pdf' ? 'application/pdf' : 'image/png');
    headers.set('Content-Disposition', `attachment; filename="volantino-${flyer.event_name.replace(/\s+/g, '-')}.${format}"`);
    headers.set('Content-Length', imageData.length.toString());
    
    // Log the download
    await supabase
      .from('app_volantino_downloads')
      .insert({
        flyer_id: flyerId,
        user_id: user.id,
        format,
        has_watermark: hasWatermark,
        downloaded_at: new Date().toISOString()
      });
    
    return new NextResponse(imageData, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error in download endpoint:', error);
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
    
    // Get user's download history
    const { data: downloads, error: fetchError } = await supabase
      .from('app_volantino_downloads')
      .select(`
        *,
        app_volantino_flyers (
          event_name,
          event_date,
          event_location
        )
      `)
      .eq('user_id', user.id)
      .order('downloaded_at', { ascending: false })
      .limit(20);
    
    if (fetchError) {
      console.error('Error fetching download history:', fetchError);
      return NextResponse.json(
        { error: 'Errore nel recupero della cronologia' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      downloads: downloads || []
    });
    
  } catch (error) {
    console.error('Error in GET /api/apps/volantino-generator/download:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}