import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getApiUser(request);
    if (!user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('Leaderboards request for user:', user.email);
    
    // Return expected leaderboards format
    return NextResponse.json({
      leaderboards: [
        {
          id: 'weekly-votes',
          name: 'Voti Settimanali',
          description: 'I migliori votanti di questa settimana',
          type: 'votes',
          period: 'weekly',
          isActive: true,
          isFeatured: true,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'monthly-problems',
          name: 'Problemi Mensili',
          description: 'Chi ha proposto più problemi questo mese',
          type: 'problems',
          period: 'monthly',
          isActive: true,
          isFeatured: false,
          lastUpdated: new Date().toISOString()
        }
      ],
      entries: [
        {
          rank: 1,
          user: {
            id: 'demo-user-1',
            name: 'Mario Rossi',
            avatar_url: null,
            reputation_score: 150
          },
          score: 25,
          previousRank: 2,
          rankChange: 1,
          streakCount: 5
        },
        {
          rank: 2,
          user: {
            id: 'demo-user-2',
            name: 'Giulia Bianchi',
            avatar_url: null,
            reputation_score: 120
          },
          score: 22,
          previousRank: 1,
          rankChange: -1,
          streakCount: 3
        },
        {
          rank: 3,
          user: {
            id: 'demo-user-3',
            name: 'Luca Verdi',
            avatar_url: null,
            reputation_score: 95
          },
          score: 18,
          previousRank: 3,
          rankChange: 0,
          streakCount: 1
        }
      ],
      currentUserRank: 15
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