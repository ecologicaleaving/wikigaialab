import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty voting history during migration
    console.log('Mock voting history request during authentication migration');
    
    return NextResponse.json({
      success: true,
      data: {
        votes: [],
        total: 0,
        pagination: {
          page: 1,
          limit: 20,
          hasMore: false
        }
      }
    });

  } catch (error) {
    console.error('Error in voting history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch voting history',
      data: { votes: [], total: 0 }
    }, { status: 500 });
  }
}