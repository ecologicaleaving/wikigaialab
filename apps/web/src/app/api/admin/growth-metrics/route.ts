/**
 * Admin Growth Metrics API Endpoint
 * Story 4.5: Community Growth Tools
 * GET /api/admin/growth-metrics - Get comprehensive growth analytics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/growth-metrics
 * Get comprehensive growth metrics for admin dashboard
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';
    
    // Calculate date ranges
    const now = new Date();
    const periodDays = parseInt(period.replace('d', ''));
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Fetch all metrics in parallel
    const [
      userAcquisitionMetrics,
      userRetentionMetrics,
      referralMetrics,
      socialSharingMetrics,
      emailDigestMetrics,
      leaderboardMetrics,
      campaignMetrics
    ] = await Promise.all([
      getUserAcquisitionMetrics(periodStart, now, previousPeriodStart),
      getUserRetentionMetrics(periodStart, now),
      getReferralMetrics(periodStart, now),
      getSocialSharingMetrics(periodStart, now),
      getEmailDigestMetrics(periodStart, now),
      getLeaderboardMetrics(periodStart, now),
      getCampaignMetrics(periodStart, now)
    ]);

    const metrics = {
      userAcquisition: userAcquisitionMetrics,
      userRetention: userRetentionMetrics,
      referralMetrics: referralMetrics,
      socialSharing: socialSharingMetrics,
      emailDigests: emailDigestMetrics,
      leaderboards: leaderboardMetrics,
      campaigns: campaignMetrics,
      periodInfo: {
        period,
        startDate: periodStart.toISOString(),
        endDate: now.toISOString(),
        days: periodDays
      }
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for each metric type

async function getUserAcquisitionMetrics(periodStart: Date, now: Date, previousPeriodStart: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: totalUsers },
    { count: newUsersToday },
    { count: newUsersThisWeek },
    { count: newUsersThisMonth },
    { count: newUsersThisPeriod },
    { count: newUsersPreviousPeriod }
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true }),
    
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString()),
    
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisWeekStart.toISOString()),
    
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart.toISOString()),
    
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', now.toISOString()),
    
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', periodStart.toISOString())
  ]);

  const growthRate = newUsersPreviousPeriod > 0 
    ? ((newUsersThisPeriod - newUsersPreviousPeriod) / newUsersPreviousPeriod) * 100 
    : 0;

  // Calculate conversion rate (users who voted after signing up)
  const { count: convertedUsers } = await supabase
    .from('votes')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', now.toISOString());

  const conversionRate = newUsersThisPeriod > 0 ? (convertedUsers / newUsersThisPeriod) * 100 : 0;

  return {
    totalUsers: totalUsers || 0,
    newUsersToday: newUsersToday || 0,
    newUsersThisWeek: newUsersThisWeek || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
    growthRate,
    conversionRate
  };
}

async function getUserRetentionMetrics(periodStart: Date, now: Date) {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get active users (users who have interacted in the timeframe)
  const [
    { data: dailyActiveUsers },
    { data: weeklyActiveUsers },
    { data: monthlyActiveUsers }
  ] = await Promise.all([
    supabase
      .from('content_analytics')
      .select('user_id')
      .gte('recorded_at', dayAgo.toISOString())
      .then(result => ({ data: new Set(result.data?.map(r => r.user_id)).size || 0 })),
    
    supabase
      .from('content_analytics')
      .select('user_id')
      .gte('recorded_at', weekAgo.toISOString())
      .then(result => ({ data: new Set(result.data?.map(r => r.user_id)).size || 0 })),
    
    supabase
      .from('content_analytics')
      .select('user_id')
      .gte('recorded_at', monthAgo.toISOString())
      .then(result => ({ data: new Set(result.data?.map(r => r.user_id)).size || 0 }))
  ]);

  // Calculate retention rates
  const { count: newUsersWeekAgo } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())
    .lt('created_at', dayAgo.toISOString());

  const { count: newUsersMonthAgo } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthAgo.toISOString())
    .lt('created_at', weekAgo.toISOString());

  // This is a simplified retention calculation - in production, you'd want more sophisticated cohort analysis
  const retentionRate7Day = newUsersWeekAgo > 0 ? (weeklyActiveUsers / newUsersWeekAgo) * 100 : 0;
  const retentionRate30Day = newUsersMonthAgo > 0 ? (monthlyActiveUsers / newUsersMonthAgo) * 100 : 0;

  return {
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    retentionRate7Day,
    retentionRate30Day
  };
}

async function getReferralMetrics(periodStart: Date, now: Date) {
  const [
    { count: totalReferrals },
    { count: successfulReferrals },
    { data: topReferrers }
  ] = await Promise.all([
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString()),
    
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('converted_at', periodStart.toISOString()),
    
    supabase
      .from('referrals')
      .select(`
        referrer_id,
        status,
        users!referrals_referrer_id_fkey(name)
      `)
      .gte('created_at', periodStart.toISOString())
  ]);

  // Process top referrers
  const referrerStats = topReferrers?.reduce((acc, referral) => {
    const userId = referral.referrer_id;
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName: referral.users?.name || 'Unknown',
        referralCount: 0,
        successfulReferrals: 0
      };
    }
    acc[userId].referralCount++;
    if (referral.status === 'completed') {
      acc[userId].successfulReferrals++;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const topReferrersList = Object.values(referrerStats)
    .sort((a: any, b: any) => b.successfulReferrals - a.successfulReferrals)
    .slice(0, 10);

  const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

  return {
    totalReferrals: totalReferrals || 0,
    successfulReferrals: successfulReferrals || 0,
    conversionRate,
    topReferrers: topReferrersList
  };
}

async function getSocialSharingMetrics(periodStart: Date, now: Date) {
  const [
    { count: totalShares },
    { data: sharesByPlatform },
    { data: topSharedProblems },
    { data: shareClicks }
  ] = await Promise.all([
    supabase
      .from('social_shares')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString()),
    
    supabase
      .from('social_shares')
      .select('platform, click_count')
      .gte('created_at', periodStart.toISOString()),
    
    supabase
      .from('social_shares')
      .select(`
        problem_id, click_count,
        problems(title)
      `)
      .gte('created_at', periodStart.toISOString()),
    
    supabase
      .from('social_shares')
      .select('click_count')
      .gte('created_at', periodStart.toISOString())
  ]);

  // Process platform breakdown
  const platformStats = sharesByPlatform?.reduce((acc, share) => {
    acc[share.platform] = (acc[share.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Process top shared problems
  const problemStats = topSharedProblems?.reduce((acc, share) => {
    const problemId = share.problem_id;
    if (!acc[problemId]) {
      acc[problemId] = {
        problemId,
        title: share.problems?.title || 'Unknown',
        shareCount: 0,
        clickCount: 0
      };
    }
    acc[problemId].shareCount++;
    acc[problemId].clickCount += share.click_count || 0;
    return acc;
  }, {} as Record<string, any>) || {};

  const topSharedProblemsList = Object.values(problemStats)
    .sort((a: any, b: any) => b.shareCount - a.shareCount)
    .slice(0, 10);

  const totalClicks = shareClicks?.reduce((sum, share) => sum + (share.click_count || 0), 0) || 0;
  const clickThroughRate = totalShares > 0 ? (totalClicks / totalShares) * 100 : 0;

  return {
    totalShares: totalShares || 0,
    sharesByPlatform: platformStats,
    clickThroughRate,
    topSharedProblems: topSharedProblemsList
  };
}

async function getEmailDigestMetrics(periodStart: Date, now: Date) {
  const [
    { count: subscribersCount },
    { data: digestSends },
    { count: digestsSentThisWeek }
  ] = await Promise.all([
    supabase
      .from('email_digests')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .neq('frequency', 'disabled'),
    
    supabase
      .from('email_digest_sends')
      .select('opened_at, clicked_at, unsubscribed_at')
      .gte('sent_at', periodStart.toISOString())
      .eq('send_status', 'sent'),
    
    supabase
      .from('email_digest_sends')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('send_status', 'sent')
  ]);

  const totalSent = digestSends?.length || 0;
  const opened = digestSends?.filter(d => d.opened_at).length || 0;
  const clicked = digestSends?.filter(d => d.clicked_at).length || 0;
  const unsubscribed = digestSends?.filter(d => d.unsubscribed_at).length || 0;

  const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0;
  const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0;
  const unsubscribeRate = totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0;

  return {
    subscribersCount: subscribersCount || 0,
    openRate,
    clickRate,
    unsubscribeRate,
    digestsSentThisWeek: digestsSentThisWeek || 0
  };
}

async function getLeaderboardMetrics(periodStart: Date, now: Date) {
  const [
    { count: activeLeaderboards },
    { data: participantData },
    { data: topPerformers }
  ] = await Promise.all([
    supabase
      .from('leaderboards')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    
    supabase
      .from('leaderboard_entries')
      .select('user_id')
      .gte('updated_at', periodStart.toISOString()),
    
    supabase
      .from('leaderboard_entries')
      .select(`
        user_id, rank, score,
        users(name),
        leaderboards(name)
      `)
      .eq('rank', 1)
      .gte('updated_at', periodStart.toISOString())
  ]);

  const totalParticipants = new Set(participantData?.map(p => p.user_id)).size || 0;

  const topPerformersList = topPerformers?.map(entry => ({
    userId: entry.user_id,
    userName: entry.users?.name || 'Unknown',
    leaderboardName: entry.leaderboards?.name || 'Unknown',
    rank: entry.rank,
    score: entry.score
  })) || [];

  return {
    totalParticipants,
    activeLeaderboards: activeLeaderboards || 0,
    topPerformers: topPerformersList
  };
}

async function getCampaignMetrics(periodStart: Date, now: Date) {
  const [
    { count: activeCampaigns },
    { count: totalParticipants },
    { data: campaignData }
  ] = await Promise.all([
    supabase
      .from('engagement_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('start_date', now.toISOString())
      .gte('end_date', now.toISOString()),
    
    supabase
      .from('campaign_participants')
      .select('id', { count: 'exact', head: true })
      .gte('joined_at', periodStart.toISOString()),
    
    supabase
      .from('campaign_participants')
      .select(`
        campaign_id, goal_reached,
        engagement_campaigns(name)
      `)
      .gte('joined_at', periodStart.toISOString())
  ]);

  // Process campaign statistics
  const campaignStats = campaignData?.reduce((acc, participant) => {
    const campaignId = participant.campaign_id;
    if (!acc[campaignId]) {
      acc[campaignId] = {
        campaignId,
        name: participant.engagement_campaigns?.name || 'Unknown',
        participants: 0,
        completions: 0
      };
    }
    acc[campaignId].participants++;
    if (participant.goal_reached) {
      acc[campaignId].completions++;
    }
    return acc;
  }, {} as Record<string, any>) || {};

  const topCampaigns = Object.values(campaignStats)
    .map((campaign: any) => ({
      ...campaign,
      completionRate: campaign.participants > 0 ? (campaign.completions / campaign.participants) * 100 : 0
    }))
    .sort((a: any, b: any) => b.participants - a.participants)
    .slice(0, 10);

  const totalCompletions = Object.values(campaignStats).reduce((sum: number, campaign: any) => sum + campaign.completions, 0);
  const completionRate = totalParticipants > 0 ? (totalCompletions / totalParticipants) * 100 : 0;

  return {
    activeCampaigns: activeCampaigns || 0,
    totalParticipants: totalParticipants || 0,
    completionRate,
    topCampaigns
  };
}