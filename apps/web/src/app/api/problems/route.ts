import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Mock problems list request during authentication migration');
    
    // Return empty problems list
    return NextResponse.json({
      success: true,
      data: {
        problems: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 20,
          hasMore: false
        }
      }
    });

  } catch (error) {
    console.error('Error in problems GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch problems',
      data: { problems: [], total: 0 }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('Mock problem creation during authentication migration:', {
      title: body.title,
      category_id: body.category_id,
      user: session.user.email
    });

    // Generate a mock problem ID and return success
    const mockProblemId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      message: 'Problema creato con successo! (Demo Mode)',
      id: mockProblemId,
      data: {
        id: mockProblemId,
        title: body.title,
        description: body.description,
        category_id: body.category_id,
        proposer_id: session.user.id || 'mock-user',
        vote_count: 1, // Auto-vote from creator
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating problem:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create problem'
    }, { status: 500 });
  }
}