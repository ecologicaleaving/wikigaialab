import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Mock leaderboards request during authentication migration');
    
    // Return empty leaderboards during migration
    return NextResponse.json({
      success: true,
      data: {
        topVoters: [],
        topContributors: [],
        topRated: [],
        recentActivity: [],
        stats: {
          totalUsers: 0,
          totalProblems: 0,
          totalVotes: 0
        }
      }
    });

  } catch (error) {
    console.error('Error in leaderboards:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leaderboards',
      data: { topVoters: [], topContributors: [], topRated: [] }
    }, { status: 500 });
  }
}