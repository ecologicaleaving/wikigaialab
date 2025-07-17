import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

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

    // Store in Supabase (or your preferred database)
    const { data: result, error } = await supabase
      .from('analytics_events')
      .insert([analyticsRecord]);

    if (error) {
      console.error('Failed to store analytics event:', error);
      return NextResponse.json(
        { error: 'Failed to store analytics event' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics event stored successfully' 
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}