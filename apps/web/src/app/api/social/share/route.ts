/**
 * Social Sharing Optimization API Endpoint
 * Story 4.5: Community Growth Tools
 * 
 * POST /api/social/share - Create social share and track analytics
 * GET /api/social/share - Get sharing statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface ShareRequest {
  problemId: string;
  platform: 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'email' | 'copy' | 'whatsapp';
  userId?: string;
  customMessage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface ShareResponse {
  shareId: string;
  shareUrl: string;
  shareTitle: string;
  shareDescription: string;
  shareImageUrl?: string;
  platformUrl: string;
}

/**
 * POST /api/social/share
 * Create social share and generate optimized content
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ShareRequest = await request.json();
    const { problemId, platform, userId, customMessage, utmSource, utmMedium, utmCampaign } = body;

    if (!problemId || !platform) {
      return NextResponse.json(
        { error: 'Problem ID and platform are required' },
        { status: 400 }
      );
    }

    // Get problem details for sharing
    const { data: problem, error: problemError } = await getSupabaseClient()
      .from('problems')
      .select(`
        id, title, description, vote_count, category_id,
        categories(name),
        user:user_id(name)
      `)
      .eq('id', problemId)
      .eq('moderation_status', 'approved')
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found or not approved' },
        { status: 404 }
      );
    }

    // Generate optimized share content
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.com';
    const problemUrl = `${baseUrl}/problems/${problemId}`;
    
    // Create UTM parameters for tracking
    const utmParams = new URLSearchParams({
      utm_source: utmSource || platform,
      utm_medium: utmMedium || 'social',
      utm_campaign: utmCampaign || 'problem_share',
      utm_content: problemId
    });
    
    const shareUrl = `${problemUrl}?${utmParams.toString()}`;
    
    // Generate platform-specific content
    const shareTitle = customMessage || generateShareTitle(problem, platform);
    const shareDescription = generateShareDescription(problem, platform);
    const shareImageUrl = generateShareImage(problem);

    // Get client info
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const sessionId = `session_${Date.now()}_${Math.random()}`;

    // Create share record
    const { data: shareRecord, error: shareError } = await getSupabaseClient()
      .from('social_shares')
      .insert({
        problem_id: problemId,
        user_id: userId || null,
        platform,
        share_url: shareUrl,
        share_title: shareTitle,
        share_description: shareDescription,
        share_image_url: shareImageUrl,
        utm_source: utmSource || platform,
        utm_medium: utmMedium || 'social',
        utm_campaign: utmCampaign || 'problem_share',
        session_id: sessionId,
        metadata: {
          ip_address: ip,
          user_agent: userAgent,
          custom_message: customMessage
        }
      })
      .select('id')
      .single();

    if (shareError || !shareRecord) {
      return NextResponse.json(
        { error: 'Failed to create share record' },
        { status: 500 }
      );
    }

    // Track share analytics
    await getSupabaseClient()
      .from('share_analytics')
      .insert({
        share_id: shareRecord.id,
        event_type: 'share_created',
        user_id: userId || null,
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          platform,
          problem_id: problemId,
          share_url: shareUrl
        }
      });

    // Generate platform-specific sharing URL
    const platformUrl = generatePlatformUrl(platform, shareUrl, shareTitle, shareDescription);

    const response: ShareResponse = {
      shareId: shareRecord.id,
      shareUrl,
      shareTitle,
      shareDescription,
      shareImageUrl,
      platformUrl
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating social share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/share
 * Get sharing statistics and analytics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const problemId = url.searchParams.get('problem_id');
    const userId = url.searchParams.get('user_id');
    const platform = url.searchParams.get('platform');
    const period = url.searchParams.get('period') || '30'; // days

    const periodStart = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    let query = getSupabaseClient()
      .from('social_shares')
      .select(`
        id, platform, share_url, click_count, conversion_count, created_at,
        problems(title, vote_count),
        users(name)
      `)
      .gte('created_at', periodStart.toISOString())
      .order('created_at', { ascending: false });

    // Apply filters
    if (problemId) {
      query = query.eq('problem_id', problemId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: shares, error: sharesError } = await query;

    if (sharesError) {
      return NextResponse.json(
        { error: 'Failed to fetch share data' },
        { status: 500 }
      );
    }

    // Get aggregated statistics
    const [
      { data: totalShares },
      { data: totalClicks },
      { data: totalConversions },
      { data: platformStats }
    ] = await Promise.all([
      // Total shares
      getSupabaseClient()
        .from('social_shares')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString())
        .apply(query => {
          if (problemId) query = query.eq('problem_id', problemId);
          if (userId) query = query.eq('user_id', userId);
          return query;
        }),

      // Total clicks
      getSupabaseClient()
        .from('social_shares')
        .select('click_count')
        .gte('created_at', periodStart.toISOString())
        .apply(query => {
          if (problemId) query = query.eq('problem_id', problemId);
          if (userId) query = query.eq('user_id', userId);
          return query;
        }),

      // Total conversions
      getSupabaseClient()
        .from('social_shares')
        .select('conversion_count')
        .gte('created_at', periodStart.toISOString())
        .apply(query => {
          if (problemId) query = query.eq('problem_id', problemId);
          if (userId) query = query.eq('user_id', userId);
          return query;
        }),

      // Platform breakdown
      getSupabaseClient()
        .from('social_shares')
        .select('platform, click_count, conversion_count')
        .gte('created_at', periodStart.toISOString())
        .apply(query => {
          if (problemId) query = query.eq('problem_id', problemId);
          if (userId) query = query.eq('user_id', userId);
          return query;
        })
    ]);

    const totalClickCount = totalClicks?.reduce((sum, share) => sum + (share.click_count || 0), 0) || 0;
    const totalConversionCount = totalConversions?.reduce((sum, share) => sum + (share.conversion_count || 0), 0) || 0;

    // Calculate platform statistics
    const platformBreakdown = platformStats?.reduce((acc, share) => {
      if (!acc[share.platform]) {
        acc[share.platform] = { shares: 0, clicks: 0, conversions: 0 };
      }
      acc[share.platform].shares += 1;
      acc[share.platform].clicks += share.click_count || 0;
      acc[share.platform].conversions += share.conversion_count || 0;
      return acc;
    }, {} as Record<string, { shares: number; clicks: number; conversions: number }>) || {};

    const response = {
      shares: shares || [],
      statistics: {
        totalShares: totalShares?.length || 0,
        totalClicks: totalClickCount,
        totalConversions: totalConversionCount,
        conversionRate: totalClickCount > 0 ? (totalConversionCount / totalClickCount * 100).toFixed(2) : '0.00',
        platformBreakdown
      },
      period: parseInt(period)
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching share analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function generateShareTitle(problem: any, platform: string): string {
  const categoryName = problem.categories?.name || 'Community';
  const voteCount = problem.vote_count || 0;
  const author = problem.user?.name || 'Community member';

  switch (platform) {
    case 'twitter':
      return `🌍 ${problem.title} | ${voteCount} votes on @WikiGaiaLab`;
    case 'facebook':
      return `Help solve: ${problem.title}`;
    case 'linkedin':
      return `Community Problem in ${categoryName}: ${problem.title}`;
    case 'reddit':
      return `[${categoryName}] ${problem.title}`;
    default:
      return `${problem.title} - WikiGaiaLab`;
  }
}

function generateShareDescription(problem: any, platform: string): string {
  const description = problem.description || '';
  const truncatedDesc = description.length > 100 ? description.substring(0, 97) + '...' : description;
  
  switch (platform) {
    case 'twitter':
      return truncatedDesc;
    case 'facebook':
      return `${truncatedDesc}\n\nJoin the discussion and vote on this community problem.`;
    case 'linkedin':
      return `${truncatedDesc}\n\nContribute to solving community challenges on WikiGaiaLab.`;
    default:
      return `${truncatedDesc}\n\nJoin the community and help prioritize this important issue.`;
  }
}

function generateShareImage(problem: any): string | undefined {
  // In a real implementation, you would generate dynamic Open Graph images
  // For now, return a default image
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.com';
  return `${baseUrl}/images/og-problem-share.png`;
}

function generatePlatformUrl(platform: string, shareUrl: string, title: string, description: string): string {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`;
    case 'reddit':
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    case 'email':
      return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
    default:
      return shareUrl;
  }
}