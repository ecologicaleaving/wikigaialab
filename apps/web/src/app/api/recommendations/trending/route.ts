import { NextRequest, NextResponse } from 'next/server';

// Simple mock data for development
const mockTrendingProblems = [
  {
    id: '1',
    title: 'Ridurre l\'inquinamento plastico negli oceani',
    description: 'Sviluppare strategie innovative per ridurre l\'inquinamento plastico nei mari',
    category_id: '1',
    vote_count: 45,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    trending_score: 95,
    vote_velocity: 2.5,
    engagement_score: 0.8,
    category: { name: 'Ambiente' },
    proposer: { name: 'Maria Rossi' }
  },
  {
    id: '2',
    title: 'Migliorare il trasporto pubblico urbano',
    description: 'Rendere il trasporto pubblico più efficiente e sostenibile nelle città',
    category_id: '2',
    vote_count: 38,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    trending_score: 82,
    vote_velocity: 1.8,
    engagement_score: 0.7,
    category: { name: 'Mobilità' },
    proposer: { name: 'Giuseppe Bianchi' }
  },
  {
    id: '3',
    title: 'Energia rinnovabile per tutti',
    description: 'Rendere l\'energia rinnovabile accessibile a tutte le famiglie',
    category_id: '3',
    vote_count: 32,
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    trending_score: 78,
    vote_velocity: 1.5,
    engagement_score: 0.6,
    category: { name: 'Energia' },
    proposer: { name: 'Anna Verdi' }
  },
  {
    id: '4',
    title: 'Educazione digitale nelle scuole',
    description: 'Migliorare l\'alfabetizzazione digitale degli studenti',
    category_id: '4',
    vote_count: 28,
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    trending_score: 71,
    vote_velocity: 1.2,
    engagement_score: 0.5,
    category: { name: 'Educazione' },
    proposer: { name: 'Marco Neri' }
  },
  {
    id: '5',
    title: 'Supporto per anziani in solitudine',
    description: 'Creare reti di supporto per combattere l\'isolamento degli anziani',
    category_id: '5',
    vote_count: 25,
    created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    trending_score: 65,
    vote_velocity: 1.0,
    engagement_score: 0.4,
    category: { name: 'Sociale' },
    proposer: { name: 'Laura Gialli' }
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const categoryId = url.searchParams.get('category_id') || undefined;

    // Filter by category if specified
    let filteredProblems = mockTrendingProblems;
    if (categoryId) {
      filteredProblems = mockTrendingProblems.filter(p => p.category_id === categoryId);
    }

    // Limit results
    const results = filteredProblems.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        total: results.length,
        calculated_at: new Date().toISOString(),
        category_filter: categoryId,
        algorithm_version: 'mock-1.0'
      }
    });

  } catch (error) {
    console.error('Error in trending API:', error);
    return NextResponse.json(
      { error: 'Failed to get trending problems' },
      { status: 500 }
    );
  }
}