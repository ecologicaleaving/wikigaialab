import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data, timestamp, url, user_agent, session_id } = body;

    // Validate required fields
    if (!event || !data || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: event, data, timestamp' },
        { status: 400 }
      );
    }

    // Check if analytics is enabled (to avoid errors in development/testing)
    const analyticsEnabled = process.env.ENABLE_ANALYTICS === 'true';
    
    if (!analyticsEnabled) {
      // Just log the event and return success
      console.log('📊 Analytics Event (disabled):', { event, data });
      return NextResponse.json({ 
        success: true, 
        message: 'Analytics event logged (disabled)' 
      });
    }

    // Extract user info from request
    const user_id = data.user_id || null;
    const ip_address = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const user_agent_string = user_agent || request.headers.get('user-agent') || 'unknown';

    // Create analytics record
    const analyticsRecord = {
      event_type: event,
      event_data: data,
      timestamp: new Date(timestamp).toISOString(),
      session_id: session_id || null,
      user_id: user_id || null,
      url: url || null,
      user_agent: user_agent_string,
      ip_address: ip_address,
      created_at: new Date().toISOString()
    };

    // Since we've removed Supabase, just log the analytics event
    console.log('📊 Analytics Event:', analyticsRecord);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics event logged successfully' 
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't return 500 - just succeed silently
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics event logged (error handled)' 
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}