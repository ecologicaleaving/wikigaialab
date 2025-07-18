import { NextRequest, NextResponse } from 'next/server';

// Simple mock data for personal recommendations
const mockPersonalProblems = [
  {
    id: '6',
    title: 'Sicurezza stradale per ciclisti',
    description: 'Migliorare la sicurezza delle piste ciclabili nelle città',
    category_id: '2',
    vote_count: 22,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    relevance_score: 0.92,
    similarity_score: 0.85,
    category: { name: 'Mobilità' },
    proposer: { name: 'Paolo Rossi' }
  },
  {
    id: '7',
    title: 'Riciclo intelligente nei condomini',
    description: 'Sistemi smart per migliorare la raccolta differenziata',
    category_id: '1',
    vote_count: 19,
    created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    relevance_score: 0.88,
    similarity_score: 0.82,
    category: { name: 'Ambiente' },
    proposer: { name: 'Sofia Bianchi' }
  },
  {
    id: '8',
    title: 'Telemedicina per zone remote',
    description: 'Portare assistenza medica nelle aree rurali tramite tecnologia',
    category_id: '6',
    vote_count: 16,
    created_at: new Date(Date.now() - 84 * 60 * 60 * 1000).toISOString(),
    relevance_score: 0.85,
    similarity_score: 0.78,
    category: { name: 'Sanità' },
    proposer: { name: 'Dott. Mario Verdi' }
  },
  {
    id: '9',
    title: 'Coworking per freelance',
    description: 'Spazi di lavoro condivisi per professionisti indipendenti',
    category_id: '7',
    vote_count: 14,
    created_at: new Date(Date.now() - 108 * 60 * 60 * 1000).toISOString(),
    relevance_score: 0.82,
    similarity_score: 0.75,
    category: { name: 'Lavoro' },
    proposer: { name: 'Elena Neri' }
  },
  {
    id: '10',
    title: 'App per volontariato locale',
    description: 'Piattaforma per connettere volontari con associazioni locali',
    category_id: '5',
    vote_count: 12,
    created_at: new Date(Date.now() - 132 * 60 * 60 * 1000).toISOString(),
    relevance_score: 0.79,
    similarity_score: 0.72,
    category: { name: 'Sociale' },
    proposer: { name: 'Luca Gialli' }
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const categoryId = url.searchParams.get('category_id') || undefined;

    // Filter by category if specified
    let filteredProblems = mockPersonalProblems;
    if (categoryId) {
      filteredProblems = mockPersonalProblems.filter(p => p.category_id === categoryId);
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
        algorithm_version: 'mock-1.0',
        user_id: 'anonymous'
      }
    });

  } catch (error) {
    console.error('Error in personal recommendations API:', error);
    return NextResponse.json(
      { error: 'Failed to get personal recommendations' },
      { status: 500 }
    );
  }
}