import { NextResponse } from "next/server";
import { getSupabaseClient } from '@/lib/supabase/client';

interface RouteContext {
  params: { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Problem ID is required'
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    // Get problem with category and user info
    const { data: problem, error } = await supabase
      .from('problems')
      .select(`
        *,
        category:categories(name),
        proposer:users(name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Problem fetch error:', error);
      return NextResponse.json({
        success: false,
        error: 'Problem not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: problem
    });

  } catch (error) {
    console.error('Problem API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}
