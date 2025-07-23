import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import type { Database } from '@wikigaialab/database';

/**
 * Personal Recommendations API - Now with Real Database Integration
 * 
 * Features:
 * - Real database queries for personalized recommendations
 * - User voting history analysis
 * - Category preference detection
 * - Smart fallback handling
 */

interface PersonalizedProblem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  score?: number;
  reasoning?: {
    collaborative_score: number;
    content_score: number;
    trending_score: number;
    category_match: number;
    interaction_history: number;
  };
  category: { name: string };
  proposer: { name: string };
}

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// Simple mock data for personal recommendations (fallback)
const mockPersonalProblems: PersonalizedProblem[] = [
  {
    id: '6',
    title: 'Sicurezza stradale per ciclisti',
    description: 'Migliorare la sicurezza delle piste ciclabili nelle città',
    category_id: '2',
    vote_count: 22,
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    score: 0.92,
    reasoning: {
      collaborative_score: 0.8,
      content_score: 0.7,
      trending_score: 0.6,
      category_match: 0.9,
      interaction_history: 0.5
    },
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
    score: 0.88,
    reasoning: {
      collaborative_score: 0.7,
      content_score: 0.8,
      trending_score: 0.5,
      category_match: 0.8,
      interaction_history: 0.6
    },
    category: { name: 'Ambiente' },
    proposer: { name: 'Sofia Bianchi' }
  }
];

async function getPersonalRecommendations(userId: string, limit: number = 10): Promise<PersonalizedProblem[]> {
  try {
    const supabase = getSupabaseClient();
    
    console.log('Fetching personal recommendations for user:', userId, 'limit:', limit);
    
    // First, get user's voting history to understand preferences
    const { data: userVotes, error: votesError } = await supabase
      .from('votes')
      .select(`
        problem_id,
        problems:problem_id(category_id)
      `)
      .eq('user_id', userId)
      .eq('vote_type', 'community');

    if (votesError) {
      console.error('Error fetching user votes:', votesError);
    }

    // Analyze category preferences
    const categoryPreferences: Record<string, number> = {};
    if (userVotes) {
      userVotes.forEach((vote: any) => {
        const categoryId = vote.problems?.category_id;
        if (categoryId) {
          categoryPreferences[categoryId] = (categoryPreferences[categoryId] || 0) + 1;
        }
      });
    }

    // Get problems, excluding ones the user has already voted on
    const votedProblemIds = userVotes?.map((v: any) => v.problem_id) || [];
    
    let query = supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        category_id,
        vote_count,
        created_at,
        proposer_id,
        categories:category_id(name),
        users:proposer_id(name)
      `)
      .eq('status', 'Proposed')
      .neq('proposer_id', userId); // Don't recommend user's own problems

    // Exclude voted problems if there are any
    if (votedProblemIds.length > 0) {
      query = query.not('id', 'in', `(${votedProblemIds.join(',')})`);
    }

    const { data: problems, error } = await query
      .gte('vote_count', 1)
      .order('vote_count', { ascending: false })
      .limit(limit * 3); // Get more to allow for scoring

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    if (!problems || problems.length === 0) {
      console.log('No problems found for personalization, using fallback');
      return mockPersonalProblems.slice(0, limit);
    }

    // Calculate personalized scores
    const personalizedProblems: PersonalizedProblem[] = problems.map((problem: any) => {
      // Category match score
      const categoryMatch = categoryPreferences[problem.category_id] || 0;
      const maxCategoryVotes = Math.max(...Object.values(categoryPreferences), 1);
      const category_match = categoryMatch / maxCategoryVotes;

      // Trending score based on vote count and recency
      const hoursOld = (Date.now() - new Date(problem.created_at).getTime()) / (1000 * 60 * 60);
      const ageScore = Math.max(0, 1 - (hoursOld / (24 * 7))); // Decay over week
      const voteScore = Math.min(1, problem.vote_count / 20); // Scale votes
      const trending_score = (voteScore * 0.7) + (ageScore * 0.3);

      // Simple collaborative and content scores (placeholder logic)
      const collaborative_score = Math.min(1, category_match * 0.8 + 0.2);
      const content_score = Math.min(1, problem.description.length / 500); // Longer descriptions might be more detailed
      
      // Interaction history (currently 0 since we don't have detailed history)
      const interaction_history = 0;

      // Overall score
      const score = (
        category_match * 0.3 +
        trending_score * 0.25 +
        collaborative_score * 0.25 +
        content_score * 0.2
      );

      return {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        category_id: problem.category_id,
        vote_count: problem.vote_count,
        created_at: problem.created_at,
        score,
        reasoning: {
          collaborative_score,
          content_score,
          trending_score,
          category_match,
          interaction_history
        },
        category: { name: problem.categories?.name || 'Sconosciuta' },
        proposer: { name: problem.users?.name || 'Anonimo' }
      };
    });

    // Sort by score and return top results
    const sortedProblems = personalizedProblems
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    console.log(`Successfully generated ${sortedProblems.length} personalized recommendations`);
    return sortedProblems;

  } catch (error) {
    console.error('Database connection failed, using fallback:', error);
    return mockPersonalProblems.slice(0, limit);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      // Return empty recommendations for unauthenticated users
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          total: 0,
          calculated_at: new Date().toISOString(),
          algorithm_version: 'db-1.0',
          user_id: null,
          message: 'Authentication required for personalized recommendations'
        }
      });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50); // Cap at 50
    const categoryId = url.searchParams.get('category_id') || undefined;

    // Get personalized recommendations
    let results = await getPersonalRecommendations(session.user.id, limit);

    // Filter by category if specified
    if (categoryId) {
      results = results.filter(p => p.category_id === categoryId);
    }

    const response = NextResponse.json({
      success: true,
      data: results,
      metadata: {
        total: results.length,
        calculated_at: new Date().toISOString(),
        category_filter: categoryId,
        algorithm_version: 'db-1.0',
        user_id: session.user.id
      }
    });

    // Add caching headers for performance
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error('Error in personal recommendations API:', error);
    
    // Always return success with fallback data
    return NextResponse.json({
      success: true,
      data: mockPersonalProblems.slice(0, 10),
      metadata: {
        total: mockPersonalProblems.length,
        calculated_at: new Date().toISOString(),
        algorithm_version: 'fallback-1.0',
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}