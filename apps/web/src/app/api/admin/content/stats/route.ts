import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

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

    // Get content statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: totalProblems },
      { count: pendingModeration },
      { count: featuredProblems },
      { count: flaggedContent },
      { count: todaySubmissions },
      qualityScoreResult
    ] = await Promise.all([
      // Total problems
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true }),
      
      // Pending moderation
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending'),
      
      // Featured problems
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true),
      
      // Flagged content (problems with active flags)
      supabase
        .from('content_flags')
        .select('problem_id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Today's submissions
      supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString()),

      // Average quality score
      supabase
        .from('content_quality_metrics')
        .select('quality_score')
    ]);

    // Calculate average quality score
    let averageQualityScore = 0;
    if (qualityScoreResult.data && qualityScoreResult.data.length > 0) {
      const totalScore = qualityScoreResult.data.reduce((sum, metric) => sum + (metric.quality_score || 0), 0);
      averageQualityScore = totalScore / qualityScoreResult.data.length;
    }

    const stats = {
      totalProblems: totalProblems || 0,
      pendingModeration: pendingModeration || 0,
      featuredProblems: featuredProblems || 0,
      flaggedContent: flaggedContent || 0,
      todaySubmissions: todaySubmissions || 0,
      qualityScore: averageQualityScore
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Error fetching content stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}