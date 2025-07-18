/**
 * Engagement Campaigns API Endpoint
 * Story 4.5: Community Growth Tools
 * 
 * GET /api/campaigns - Get active campaigns and user participation
 * POST /api/campaigns - Create new campaign (admin only)
 * PUT /api/campaigns - Update campaign or join campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaignType: string;
  status: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  goalType: string;
  goalValue: number;
  rewardType: string;
  rewardValue: number;
  rewardData: any;
  rules: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignParticipation {
  id: string;
  campaignId: string;
  userId: string;
  joinedAt: string;
  currentProgress: number;
  goalReached: boolean;
  rewardClaimed: boolean;
  rewardClaimedAt?: string;
  metadata: any;
}

interface CampaignResponse {
  campaigns: Campaign[];
  userParticipation: CampaignParticipation[];
  eligibleCampaigns: string[];
  totalActiveCampaigns: number;
}

/**
 * GET /api/campaigns
 * Get active campaigns and user participation
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status') || 'active';
    const campaignType = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const now = new Date().toISOString();

    // Build base query for campaigns
    let campaignQuery = supabase
      .from('engagement_campaigns')
      .select(`
        id, name, description, campaign_type, status, target_audience,
        start_date, end_date, goal_type, goal_value, reward_type, reward_value,
        reward_data, rules, created_by, created_at, updated_at
      `);

    // Apply filters
    if (status === 'active') {
      campaignQuery = campaignQuery
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now);
    } else if (status !== 'all') {
      campaignQuery = campaignQuery.eq('status', status);
    }

    if (campaignType) {
      campaignQuery = campaignQuery.eq('campaign_type', campaignType);
    }

    campaignQuery = campaignQuery
      .order('start_date', { ascending: false })
      .limit(limit);

    const { data: campaigns, error: campaignError } = await campaignQuery;

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    let userParticipation: CampaignParticipation[] = [];
    let eligibleCampaigns: string[] = [];

    if (userId) {
      // Get user's participation in campaigns
      const { data: participation, error: participationError } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('user_id', userId);

      if (!participationError) {
        userParticipation = participation || [];
      }

      // Check eligibility for each campaign
      if (campaigns) {
        for (const campaign of campaigns) {
          const isEligible = await checkCampaignEligibility(userId, campaign);
          if (isEligible) {
            eligibleCampaigns.push(campaign.id);
          }
        }
      }
    }

    // Get total active campaigns count
    const { count: totalActiveCampaigns } = await supabase
      .from('engagement_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now);

    const response: CampaignResponse = {
      campaigns: campaigns || [],
      userParticipation,
      eligibleCampaigns,
      totalActiveCampaigns: totalActiveCampaigns || 0
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create new campaign (admin only)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

    const body = await request.json();
    const {
      name,
      description,
      campaignType,
      targetAudience,
      startDate,
      endDate,
      goalType,
      goalValue,
      rewardType,
      rewardValue,
      rewardData,
      rules
    } = body;

    // Validate required fields
    if (!name || !campaignType || !startDate || !endDate || !goalType || !goalValue || !rewardType || !rewardValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate enum values
    const validCampaignTypes = ['challenge', 'contest', 'milestone', 'streak', 'referral_bonus'];
    const validTargetAudiences = ['all', 'new_users', 'inactive_users', 'active_users', 'premium_users'];
    const validGoalTypes = ['votes', 'problems', 'referrals', 'engagement', 'retention'];
    const validRewardTypes = ['points', 'badges', 'premium_days', 'features', 'recognition'];

    if (!validCampaignTypes.includes(campaignType)) {
      return NextResponse.json(
        { error: 'Invalid campaign type' },
        { status: 400 }
      );
    }

    if (!validTargetAudiences.includes(targetAudience)) {
      return NextResponse.json(
        { error: 'Invalid target audience' },
        { status: 400 }
      );
    }

    if (!validGoalTypes.includes(goalType)) {
      return NextResponse.json(
        { error: 'Invalid goal type' },
        { status: 400 }
      );
    }

    if (!validRewardTypes.includes(rewardType)) {
      return NextResponse.json(
        { error: 'Invalid reward type' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: newCampaign, error: createError } = await supabase
      .from('engagement_campaigns')
      .insert({
        name,
        description,
        campaign_type: campaignType,
        status: 'draft',
        target_audience: targetAudience,
        start_date: startDate,
        end_date: endDate,
        goal_type: goalType,
        goal_value: goalValue,
        reward_type: rewardType,
        reward_value: rewardValue,
        reward_data: rewardData || {},
        rules: rules || {},
        created_by: authUser.id
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/campaigns
 * Update campaign or join campaign
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, campaignId, userId, ...updateData } = body;

    if (!action || !campaignId) {
      return NextResponse.json(
        { error: 'Action and campaign ID are required' },
        { status: 400 }
      );
    }

    if (action === 'join') {
      // Join campaign
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required to join campaign' },
          { status: 400 }
        );
      }

      // Check if campaign is active and user is eligible
      const { data: campaign, error: campaignError } = await supabase
        .from('engagement_campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('status', 'active')
        .single();

      if (campaignError || !campaign) {
        return NextResponse.json(
          { error: 'Campaign not found or not active' },
          { status: 404 }
        );
      }

      // Check if user is already participating
      const { data: existingParticipation } = await supabase
        .from('campaign_participants')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .single();

      if (existingParticipation) {
        return NextResponse.json(
          { error: 'User is already participating in this campaign' },
          { status: 400 }
        );
      }

      // Check eligibility
      const isEligible = await checkCampaignEligibility(userId, campaign);
      if (!isEligible) {
        return NextResponse.json(
          { error: 'User is not eligible for this campaign' },
          { status: 403 }
        );
      }

      // Add user to campaign
      const { data: participation, error: joinError } = await supabase
        .from('campaign_participants')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          current_progress: 0,
          metadata: updateData.metadata || {}
        })
        .select()
        .single();

      if (joinError) {
        return NextResponse.json(
          { error: 'Failed to join campaign' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        participation
      });

    } else if (action === 'update_progress') {
      // Update user's progress in campaign
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required to update progress' },
          { status: 400 }
        );
      }

      const { progress, incrementBy } = updateData;

      // Get current participation
      const { data: participation, error: participationError } = await supabase
        .from('campaign_participants')
        .select('*, engagement_campaigns(goal_value, reward_type, reward_value)')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .single();

      if (participationError || !participation) {
        return NextResponse.json(
          { error: 'User is not participating in this campaign' },
          { status: 404 }
        );
      }

      // Calculate new progress
      let newProgress = progress !== undefined ? progress : participation.current_progress;
      if (incrementBy !== undefined) {
        newProgress += incrementBy;
      }

      // Check if goal is reached
      const campaign = participation.engagement_campaigns;
      const goalReached = newProgress >= campaign.goal_value;

      // Update participation
      const { data: updatedParticipation, error: updateError } = await supabase
        .from('campaign_participants')
        .update({
          current_progress: newProgress,
          goal_reached: goalReached,
          metadata: {
            ...participation.metadata,
            ...(updateData.metadata || {}),
            last_progress_update: new Date().toISOString()
          }
        })
        .eq('id', participation.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      // If goal reached, process rewards
      if (goalReached && !participation.goal_reached) {
        await processReward(userId, campaign, participation.id);
      }

      return NextResponse.json({
        success: true,
        participation: updatedParticipation,
        goalReached
      });

    } else if (action === 'claim_reward') {
      // Claim campaign reward
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required to claim reward' },
          { status: 400 }
        );
      }

      const { data: participation, error: participationError } = await supabase
        .from('campaign_participants')
        .select('*, engagement_campaigns(reward_type, reward_value, reward_data)')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .eq('goal_reached', true)
        .eq('reward_claimed', false)
        .single();

      if (participationError || !participation) {
        return NextResponse.json(
          { error: 'No claimable reward found' },
          { status: 404 }
        );
      }

      // Mark reward as claimed
      const { error: claimError } = await supabase
        .from('campaign_participants')
        .update({
          reward_claimed: true,
          reward_claimed_at: new Date().toISOString()
        })
        .eq('id', participation.id);

      if (claimError) {
        return NextResponse.json(
          { error: 'Failed to claim reward' },
          { status: 500 }
        );
      }

      // Process the reward
      await processReward(userId, participation.engagement_campaigns, participation.id);

      return NextResponse.json({
        success: true,
        message: 'Reward claimed successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function checkCampaignEligibility(userId: string, campaign: any): Promise<boolean> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('created_at, last_login_at, subscription_status, total_votes_cast')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return false;
  }

  const now = new Date();
  const userCreatedAt = new Date(user.created_at);
  const daysSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  const lastLoginAt = user.last_login_at ? new Date(user.last_login_at) : null;
  const daysSinceLastLogin = lastLoginAt ? (now.getTime() - lastLoginAt.getTime()) / (1000 * 60 * 60 * 24) : 999;

  switch (campaign.target_audience) {
    case 'new_users':
      return daysSinceCreation <= 30;
    case 'inactive_users':
      return daysSinceLastLogin >= 7;
    case 'active_users':
      return daysSinceLastLogin <= 7 && user.total_votes_cast > 0;
    case 'premium_users':
      return user.subscription_status === 'premium';
    case 'all':
    default:
      return true;
  }
}

async function processReward(userId: string, campaign: any, participationId: string): Promise<void> {
  try {
    switch (campaign.reward_type) {
      case 'points':
        // Add reputation points
        await supabase
          .from('users')
          .update({
            reputation_score: supabase.raw('COALESCE(reputation_score, 0) + ?', [campaign.reward_value])
          })
          .eq('id', userId);
        break;

      case 'premium_days':
        // Add premium days (implementation depends on your premium system)
        await supabase
          .from('users')
          .update({
            // This would need to be implemented based on your premium system
            subscription_status: 'premium'
          })
          .eq('id', userId);
        break;

      case 'badges':
        // Award badges (implementation depends on your badge system)
        // This would create records in a badges table
        break;

      default:
        console.log('Unknown reward type:', campaign.reward_type);
    }
  } catch (error) {
    console.error('Error processing reward:', error);
  }
}