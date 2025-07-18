import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface QualityAnalysis {
  problem_id: string;
  quality_score: number;
  readability_score: number;
  engagement_score: number;
  completeness_score: number;
  uniqueness_score: number;
  spam_probability: number;
  potential_duplicates: Array<{
    problem_id: string;
    title: string;
    similarity_score: number;
  }>;
  analysis_details: {
    title_length: number;
    description_length: number;
    word_count: number;
    sentence_count: number;
    vote_count: number;
    days_since_creation: number;
    has_categories: boolean;
    content_flags: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problem_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minQualityScore = parseFloat(searchParams.get('min_quality') || '0');
    const maxQualityScore = parseFloat(searchParams.get('max_quality') || '100');

    if (problemId) {
      // Get quality analysis for specific problem
      const analysis = await analyzeContentQuality(supabase, problemId);
      if (!analysis) {
        return NextResponse.json(
          { error: 'Problem not found or analysis failed' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: analysis });
    }

    // Get quality metrics for multiple problems
    const offset = (page - 1) * limit;
    
    const { data: qualityMetrics, error: metricsError } = await supabase
      .from('content_quality_metrics')
      .select(`
        problem_id,
        quality_score,
        readability_score,
        engagement_score,
        completeness_score,
        uniqueness_score,
        spam_probability,
        calculated_at,
        problem:problems!problem_id(
          id,
          title,
          status,
          moderation_status,
          created_at,
          vote_count,
          category:categories!category_id(name)
        )
      `)
      .gte('quality_score', minQualityScore)
      .lte('quality_score', maxQualityScore)
      .order('quality_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (metricsError) {
      throw metricsError;
    }

    return NextResponse.json({ success: true, data: qualityMetrics || [] });

  } catch (error) {
    console.error('Error fetching quality analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, problem_ids } = body;

    if (action === 'bulk_analyze') {
      // Bulk quality analysis
      const results: QualityAnalysis[] = [];
      const errors: Array<{ problem_id: string; error: string }> = [];

      const problemIdsToAnalyze = problem_ids || [];
      
      // If no specific IDs provided, analyze all approved problems
      if (problemIdsToAnalyze.length === 0) {
        const { data: problems } = await supabase
          .from('problems')
          .select('id')
          .eq('moderation_status', 'approved')
          .limit(100); // Limit to prevent timeouts

        problemIdsToAnalyze.push(...(problems?.map(p => p.id) || []));
      }

      for (const problemId of problemIdsToAnalyze) {
        try {
          const analysis = await analyzeContentQuality(supabase, problemId);
          if (analysis) {
            results.push(analysis);
          }
        } catch (error) {
          errors.push({
            problem_id: problemId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          analyzed_count: results.length,
          error_count: errors.length,
          results,
          errors
        }
      });
    }

    if (action === 'detect_duplicates') {
      // Detect potential duplicates across all problems
      const duplicates = await detectDuplicateContent(supabase);
      
      return NextResponse.json({
        success: true,
        data: {
          duplicate_groups: duplicates,
          total_duplicates: duplicates.length
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "bulk_analyze" or "detect_duplicates"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in quality analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to analyze content quality
async function analyzeContentQuality(supabase: any, problemId: string): Promise<QualityAnalysis | null> {
  try {
    // Get problem data
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        description,
        vote_count,
        created_at,
        category_id,
        status,
        moderation_status
      `)
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return null;
    }

    // Get existing flags
    const { count: flagCount } = await supabase
      .from('content_flags')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problemId)
      .eq('status', 'pending');

    // Calculate basic metrics
    const titleLength = problem.title?.length || 0;
    const descriptionLength = problem.description?.length || 0;
    const wordCount = (problem.title + ' ' + problem.description).split(/\s+/).filter(word => word.length > 0).length;
    const sentences = problem.description?.split(/[.!?]+/).filter(s => s.trim().length > 0) || [];
    const sentenceCount = sentences.length;
    const voteCount = problem.vote_count || 0;
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(problem.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate quality scores
    const completenessScore = calculateCompletenessScore(titleLength, descriptionLength, problem.category_id);
    const readabilityScore = calculateReadabilityScore(wordCount, sentenceCount, descriptionLength);
    const engagementScore = calculateEngagementScore(voteCount, daysSinceCreation);
    const spamProbability = calculateSpamProbability(problem.title, problem.description, flagCount || 0);
    
    // Detect potential duplicates
    const { data: potentialDuplicates } = await supabase
      .from('problems')
      .select('id, title')
      .neq('id', problemId)
      .eq('moderation_status', 'approved');

    const duplicates = findSimilarProblems(problem.title, problem.description, potentialDuplicates || []);
    const uniquenessScore = calculateUniquenessScore(duplicates);

    // Calculate overall quality score
    const qualityScore = Math.round(
      (completenessScore * 0.25) +
      (readabilityScore * 0.20) +
      (engagementScore * 0.25) +
      (uniquenessScore * 0.20) +
      ((100 - spamProbability * 100) * 0.10)
    );

    // Save metrics to database
    await supabase
      .from('content_quality_metrics')
      .upsert({
        problem_id: problemId,
        quality_score: qualityScore,
        readability_score: readabilityScore,
        engagement_score: engagementScore,
        completeness_score: completenessScore,
        uniqueness_score: uniquenessScore,
        spam_probability: spamProbability,
        calculated_at: new Date().toISOString()
      });

    // Update problem quality score
    await supabase
      .from('problems')
      .update({ quality_score: qualityScore })
      .eq('id', problemId);

    return {
      problem_id: problemId,
      quality_score: qualityScore,
      readability_score: readabilityScore,
      engagement_score: engagementScore,
      completeness_score: completenessScore,
      uniqueness_score: uniquenessScore,
      spam_probability: spamProbability,
      potential_duplicates: duplicates,
      analysis_details: {
        title_length: titleLength,
        description_length: descriptionLength,
        word_count: wordCount,
        sentence_count: sentenceCount,
        vote_count: voteCount,
        days_since_creation: daysSinceCreation,
        has_categories: !!problem.category_id,
        content_flags: flagCount || 0
      }
    };

  } catch (error) {
    console.error('Error analyzing content quality:', error);
    return null;
  }
}

// Helper functions for quality calculations
function calculateCompletenessScore(titleLength: number, descriptionLength: number, hasCategoryId: boolean): number {
  let score = 0;
  
  // Title quality (30 points)
  if (titleLength >= 20) score += 30;
  else if (titleLength >= 10) score += 20;
  else if (titleLength >= 5) score += 10;
  
  // Description quality (50 points)
  if (descriptionLength >= 200) score += 50;
  else if (descriptionLength >= 100) score += 35;
  else if (descriptionLength >= 50) score += 20;
  else if (descriptionLength >= 20) score += 10;
  
  // Category assignment (20 points)
  if (hasCategoryId) score += 20;
  
  return Math.min(score, 100);
}

function calculateReadabilityScore(wordCount: number, sentenceCount: number, descriptionLength: number): number {
  if (sentenceCount === 0 || wordCount === 0) return 0;
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgCharsPerWord = descriptionLength / wordCount;
  
  let score = 50; // Base score
  
  // Optimal sentence length (10-20 words)
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    score += 25;
  } else if (avgWordsPerSentence >= 5 && avgWordsPerSentence <= 30) {
    score += 15;
  }
  
  // Optimal word length (4-6 characters)
  if (avgCharsPerWord >= 4 && avgCharsPerWord <= 6) {
    score += 25;
  } else if (avgCharsPerWord >= 3 && avgCharsPerWord <= 8) {
    score += 15;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

function calculateEngagementScore(voteCount: number, daysSinceCreation: number): number {
  if (daysSinceCreation === 0) return 50; // New content gets neutral score
  
  const votesPerDay = voteCount / daysSinceCreation;
  
  // Score based on votes per day
  if (votesPerDay >= 5) return 100;
  if (votesPerDay >= 2) return 80;
  if (votesPerDay >= 1) return 60;
  if (votesPerDay >= 0.5) return 40;
  if (votesPerDay >= 0.1) return 20;
  
  return 10;
}

function calculateSpamProbability(title: string, description: string, flagCount: number): number {
  let spamScore = 0;
  
  const text = (title + ' ' + description).toLowerCase();
  
  // Flag-based scoring
  spamScore += flagCount * 0.2;
  
  // Spam patterns
  const spamPatterns = [
    /\b(buy now|click here|free money|guaranteed|limited time)\b/g,
    /\b(viagra|casino|lottery|winner|congratulations)\b/g,
    /[A-Z]{5,}/g, // Excessive caps
    /!{3,}/g, // Multiple exclamation marks
    /\${2,}/g, // Multiple dollar signs
  ];
  
  spamPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      spamScore += matches.length * 0.1;
    }
  });
  
  // Repetitive content
  const words = text.split(/\s+/);
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const maxFreq = Math.max(...Object.values(wordFreq));
  if (maxFreq > words.length * 0.3) {
    spamScore += 0.3;
  }
  
  return Math.min(spamScore, 1);
}

function findSimilarProblems(title: string, description: string, problems: Array<{ id: string; title: string }>): Array<{ problem_id: string; title: string; similarity_score: number }> {
  const similarities: Array<{ problem_id: string; title: string; similarity_score: number }> = [];
  
  problems.forEach(problem => {
    const titleSimilarity = calculateSimilarity(title.toLowerCase(), problem.title.toLowerCase());
    
    if (titleSimilarity > 0.6) {
      similarities.push({
        problem_id: problem.id,
        title: problem.title,
        similarity_score: Math.round(titleSimilarity * 100) / 100
      });
    }
  });
  
  return similarities.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 5);
}

function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter(word => word.length > 2));
  const words2 = new Set(str2.split(/\s+/).filter(word => word.length > 2));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateUniquenessScore(duplicates: Array<{ similarity_score: number }>): number {
  if (duplicates.length === 0) return 100;
  
  const maxSimilarity = Math.max(...duplicates.map(d => d.similarity_score));
  
  if (maxSimilarity >= 0.9) return 10;
  if (maxSimilarity >= 0.8) return 30;
  if (maxSimilarity >= 0.7) return 50;
  if (maxSimilarity >= 0.6) return 70;
  
  return 90;
}

// Helper function to detect duplicates across all content
async function detectDuplicateContent(supabase: any): Promise<Array<{
  group_id: number;
  problems: Array<{
    id: string;
    title: string;
    similarity_score: number;
  }>;
}>> {
  const { data: problems } = await supabase
    .from('problems')
    .select('id, title, description')
    .eq('moderation_status', 'approved')
    .limit(1000); // Limit to prevent performance issues

  if (!problems || problems.length === 0) return [];

  const duplicateGroups: Array<{
    group_id: number;
    problems: Array<{
      id: string;
      title: string;
      similarity_score: number;
    }>;
  }> = [];

  const processed = new Set<string>();
  let groupId = 1;

  for (let i = 0; i < problems.length; i++) {
    if (processed.has(problems[i].id)) continue;

    const currentProblem = problems[i];
    const similarProblems: Array<{
      id: string;
      title: string;
      similarity_score: number;
    }> = [{
      id: currentProblem.id,
      title: currentProblem.title,
      similarity_score: 1.0
    }];

    for (let j = i + 1; j < problems.length; j++) {
      if (processed.has(problems[j].id)) continue;

      const similarity = calculateSimilarity(
        currentProblem.title.toLowerCase(),
        problems[j].title.toLowerCase()
      );

      if (similarity > 0.7) {
        similarProblems.push({
          id: problems[j].id,
          title: problems[j].title,
          similarity_score: Math.round(similarity * 100) / 100
        });
        processed.add(problems[j].id);
      }
    }

    if (similarProblems.length > 1) {
      duplicateGroups.push({
        group_id: groupId++,
        problems: similarProblems.sort((a, b) => b.similarity_score - a.similarity_score)
      });
    }

    processed.add(currentProblem.id);
  }

  return duplicateGroups;
}