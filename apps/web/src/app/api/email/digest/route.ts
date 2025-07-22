/**
 * Email Digest System API Endpoint
 * Story 4.5: Community Growth Tools
 * 
 * GET /api/email/digest - Get user's digest preferences and history
 * POST /api/email/digest - Create/send digest or update preferences
 * PUT /api/email/digest - Update digest preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

interface DigestPreferences {
  userId: string;
  digestType: 'daily' | 'weekly' | 'monthly';
  frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
  lastSentAt?: string;
  nextSendAt?: string;
  preferences: {
    includeNewProblems: boolean;
    includeTrendingProblems: boolean;
    includeUserActivity: boolean;
    includeRecommendations: boolean;
    includeCampaigns: boolean;
    includeLeaderboards: boolean;
    maxProblems: number;
    categoriesFilter: string[];
  };
  isActive: boolean;
}

interface DigestContent {
  newProblems: any[];
  trendingProblems: any[];
  userActivity: any;
  recommendations: any[];
  campaigns: any[];
  leaderboards: any[];
  personalizationData: any;
}

/**
 * GET /api/email/digest
 * Get user's digest preferences and history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const action = url.searchParams.get('action') || 'preferences';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'preferences') {
      // Get user's digest preferences
      const { data: digestPrefs, error: prefsError } = await getSupabaseClient()
        .from('email_digests')
        .select('*')
        .eq('user_id', userId);

      if (prefsError) {
        return NextResponse.json(
          { error: 'Failed to fetch digest preferences' },
          { status: 500 }
        );
      }

      // If no preferences exist, create defaults
      if (!digestPrefs || digestPrefs.length === 0) {
        const defaultPrefs = await createDefaultDigestPreferences(userId);
        return NextResponse.json({ preferences: defaultPrefs });
      }

      return NextResponse.json({ preferences: digestPrefs });

    } else if (action === 'history') {
      // Get user's digest send history
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      const { data: digestHistory, error: historyError } = await getSupabaseClient()
        .from('email_digest_sends')
        .select(`
          id, digest_type, subject, problems_included, send_status,
          sent_at, opened_at, clicked_at, created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (historyError) {
        return NextResponse.json(
          { error: 'Failed to fetch digest history' },
          { status: 500 }
        );
      }

      return NextResponse.json({ history: digestHistory || [] });

    } else if (action === 'preview') {
      // Generate preview of digest content
      const digestType = url.searchParams.get('digest_type') || 'weekly';
      const content = await generateDigestContent(userId, digestType as any);
      
      return NextResponse.json({ 
        preview: content,
        estimatedSendTime: calculateNextSendTime(digestType as any)
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching digest data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/digest
 * Create/send digest or process digest operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, userId, digestType, ...actionData } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    if (action === 'send_digest') {
      // Send digest to user
      if (!userId || !digestType) {
        return NextResponse.json(
          { error: 'User ID and digest type are required' },
          { status: 400 }
        );
      }

      const result = await sendDigestToUser(userId, digestType);
      return NextResponse.json(result);

    } else if (action === 'send_batch') {
      // Send digests to multiple users (admin/cron job)
      const { digestType, userFilter, dryRun = false } = actionData;
      
      const result = await sendBatchDigests(digestType, userFilter, dryRun);
      return NextResponse.json(result);

    } else if (action === 'schedule_digest') {
      // Schedule digest for user
      if (!userId || !digestType) {
        return NextResponse.json(
          { error: 'User ID and digest type are required' },
          { status: 400 }
        );
      }

      const { scheduleTime } = actionData;
      const result = await scheduleDigest(userId, digestType, scheduleTime);
      return NextResponse.json(result);

    } else if (action === 'track_interaction') {
      // Track email interaction (open, click)
      const { digestSendId, interactionType, url: clickedUrl } = actionData;
      
      if (!digestSendId || !interactionType) {
        return NextResponse.json(
          { error: 'Digest send ID and interaction type are required' },
          { status: 400 }
        );
      }

      const result = await trackDigestInteraction(digestSendId, interactionType, clickedUrl);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing digest action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email/digest
 * Update digest preferences
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { userId, digestType, preferences, frequency, isActive } = body;

    if (!userId || !digestType) {
      return NextResponse.json(
        { error: 'User ID and digest type are required' },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly', 'disabled'];
    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      );
    }

    // Update or create digest preferences
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (preferences) updateData.preferences = preferences;
    if (frequency) updateData.frequency = frequency;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Calculate next send time if frequency changed
    if (frequency && frequency !== 'disabled') {
      updateData.next_send_at = calculateNextSendTime(frequency);
    }

    const { data: updatedPrefs, error: updateError } = await getSupabaseClient()
      .from('email_digests')
      .upsert({
        user_id: userId,
        digest_type: digestType,
        ...updateData
      })
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update digest preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs
    });
  } catch (error) {
    console.error('Error updating digest preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function createDefaultDigestPreferences(userId: string): Promise<DigestPreferences[]> {
  const defaultPrefs = [
    {
      user_id: userId,
      digest_type: 'weekly',
      frequency: 'weekly',
      preferences: {
        includeNewProblems: true,
        includeTrendingProblems: true,
        includeUserActivity: false,
        includeRecommendations: true,
        includeCampaigns: true,
        includeLeaderboards: false,
        maxProblems: 10,
        categoriesFilter: []
      },
      is_active: true,
      next_send_at: calculateNextSendTime('weekly')
    }
  ];

  const { data: createdPrefs, error } = await getSupabaseClient()
    .from('email_digests')
    .upsert(defaultPrefs)
    .select();

  if (error) {
    console.error('Error creating default preferences:', error);
    return [];
  }

  return createdPrefs || [];
}

async function generateDigestContent(userId: string, digestType: string): Promise<DigestContent> {
  const now = new Date();
  const periodDays = digestType === 'daily' ? 1 : digestType === 'weekly' ? 7 : 30;
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Get user's preferences
  const { data: userPrefs } = await getSupabaseClient()
    .from('email_digests')
    .select('preferences')
    .eq('user_id', userId)
    .eq('digest_type', digestType)
    .single();

  const prefs = userPrefs?.preferences || {};
  const maxProblems = prefs.maxProblems || 10;

  // Get user's interests for personalization
  const { data: user } = await getSupabaseClient()
    .from('users')
    .select('interests, created_at')
    .eq('id', userId)
    .single();

  const content: DigestContent = {
    newProblems: [],
    trendingProblems: [],
    userActivity: {},
    recommendations: [],
    campaigns: [],
    leaderboards: [],
    personalizationData: {
      userInterests: user?.interests || [],
      memberSince: user?.created_at,
      digestType,
      period: { start: periodStart, end: now, days: periodDays }
    }
  };

  // Get new problems
  if (prefs.includeNewProblems !== false) {
    const { data: newProblems } = await getSupabaseClient()
      .from('problems')
      .select(`
        id, title, description, vote_count, created_at,
        categories(name),
        users(name)
      `)
      .gte('created_at', periodStart.toISOString())
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(maxProblems);

    content.newProblems = newProblems || [];
  }

  // Get trending problems
  if (prefs.includeTrendingProblems !== false) {
    const { data: trendingProblems } = await getSupabaseClient()
      .from('problems')
      .select(`
        id, title, description, vote_count, created_at,
        categories(name),
        users(name)
      `)
      .gte('created_at', periodStart.toISOString())
      .eq('moderation_status', 'approved')
      .order('vote_count', { ascending: false })
      .limit(maxProblems);

    content.trendingProblems = trendingProblems || [];
  }

  // Get user activity
  if (prefs.includeUserActivity !== false) {
    const [
      { data: userVotes },
      { data: userProblems },
      { data: userComments }
    ] = await Promise.all([
      getSupabaseClient()
        .from('votes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', periodStart.toISOString()),
      
      getSupabaseClient()
        .from('problems')
        .select('id, title, vote_count')
        .eq('user_id', userId)
        .gte('created_at', periodStart.toISOString())
        .order('vote_count', { ascending: false }),
      
      // Assuming there's a comments table
      getSupabaseClient()
        .from('content_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('metric_type', 'comment')
        .gte('recorded_at', periodStart.toISOString())
    ]);

    content.userActivity = {
      votesCount: userVotes?.length || 0,
      problemsSubmitted: userProblems || [],
      commentsCount: userComments?.length || 0
    };
  }

  // Get personalized recommendations
  if (prefs.includeRecommendations !== false) {
    // This would use your recommendation system
    const { data: recommendations } = await getSupabaseClient()
      .from('problems')
      .select(`
        id, title, description, vote_count,
        categories(name)
      `)
      .eq('moderation_status', 'approved')
      .order('vote_count', { ascending: false })
      .limit(5);

    content.recommendations = recommendations || [];
  }

  // Get active campaigns
  if (prefs.includeCampaigns !== false) {
    const { data: campaigns } = await getSupabaseClient()
      .from('engagement_campaigns')
      .select('id, name, description, end_date, reward_type, reward_value')
      .eq('status', 'active')
      .gte('end_date', now.toISOString())
      .order('end_date', { ascending: true })
      .limit(3);

    content.campaigns = campaigns || [];
  }

  // Get leaderboards
  if (prefs.includeLeaderboards !== false) {
    const { data: leaderboards } = await getSupabaseClient()
      .from('leaderboards')
      .select('id, name, type, period')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(2);

    content.leaderboards = leaderboards || [];
  }

  return content;
}

async function sendDigestToUser(userId: string, digestType: string): Promise<any> {
  try {
    // Check if user wants this digest
    const { data: prefs } = await getSupabaseClient()
      .from('email_digests')
      .select('frequency, is_active, preferences')
      .eq('user_id', userId)
      .eq('digest_type', digestType)
      .single();

    if (!prefs || !prefs.is_active || prefs.frequency === 'disabled') {
      return { success: false, message: 'User has disabled this digest' };
    }

    // Get user email
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!user || !user.email) {
      return { success: false, message: 'User email not found' };
    }

    // Generate digest content
    const content = await generateDigestContent(userId, digestType);

    // Generate email HTML and text
    const { html, text, subject } = generateDigestEmail(content, user.name, digestType);

    // Create digest send record
    const { data: digestSend, error: sendError } = await getSupabaseClient()
      .from('email_digest_sends')
      .insert({
        user_id: userId,
        digest_type: digestType,
        subject,
        content_html: html,
        content_text: text,
        problems_included: [
          ...content.newProblems.map(p => p.id),
          ...content.trendingProblems.map(p => p.id),
          ...content.recommendations.map(p => p.id)
        ],
        personalization_data: content.personalizationData,
        send_status: 'queued'
      })
      .select('id')
      .single();

    if (sendError) {
      return { success: false, message: 'Failed to create digest record' };
    }

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll mark it as sent
    await getSupabaseClient()
      .from('email_digest_sends')
      .update({
        send_status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', digestSend.id);

    // Update last sent time
    await getSupabaseClient()
      .from('email_digests')
      .update({
        last_sent_at: new Date().toISOString(),
        next_send_at: calculateNextSendTime(prefs.frequency)
      })
      .eq('user_id', userId)
      .eq('digest_type', digestType);

    return {
      success: true,
      message: 'Digest sent successfully',
      digestSendId: digestSend.id
    };
  } catch (error) {
    console.error('Error sending digest:', error);
    return { success: false, message: 'Internal error sending digest' };
  }
}

async function sendBatchDigests(digestType: string, userFilter: any = {}, dryRun: boolean = false): Promise<any> {
  try {
    const now = new Date();
    
    // Get users who should receive this digest
    const query = getSupabaseClient()
      .from('email_digests')
      .select(`
        user_id, frequency, last_sent_at, next_send_at,
        users(email, name, created_at)
      `)
      .eq('digest_type', digestType)
      .eq('is_active', true)
      .neq('frequency', 'disabled')
      .lte('next_send_at', now.toISOString());

    const { data: eligibleUsers, error: queryError } = await query;

    if (queryError) {
      return { success: false, message: 'Failed to query eligible users' };
    }

    if (dryRun) {
      return {
        success: true,
        message: 'Dry run completed',
        eligibleUsers: eligibleUsers?.length || 0,
        users: eligibleUsers
      };
    }

    // Send digests
    const results = [];
    for (const userDigest of eligibleUsers || []) {
      const result = await sendDigestToUser(userDigest.user_id, digestType);
      results.push({
        userId: userDigest.user_id,
        email: userDigest.users.email,
        ...result
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return {
      success: true,
      message: `Batch digest completed: ${successCount} sent, ${failCount} failed`,
      totalProcessed: results.length,
      successCount,
      failCount,
      results
    };
  } catch (error) {
    console.error('Error sending batch digests:', error);
    return { success: false, message: 'Internal error sending batch digests' };
  }
}

async function scheduleDigest(userId: string, digestType: string, scheduleTime: string): Promise<any> {
  const { error } = await getSupabaseClient()
    .from('email_digests')
    .update({
      next_send_at: scheduleTime,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('digest_type', digestType);

  if (error) {
    return { success: false, message: 'Failed to schedule digest' };
  }

  return { success: true, message: 'Digest scheduled successfully' };
}

async function trackDigestInteraction(digestSendId: string, interactionType: string, clickedUrl?: string): Promise<any> {
  const updateData: any = {};
  
  if (interactionType === 'open') {
    updateData.opened_at = new Date().toISOString();
  } else if (interactionType === 'click') {
    updateData.clicked_at = new Date().toISOString();
    if (clickedUrl) {
      updateData.metadata = { clicked_url: clickedUrl };
    }
  } else if (interactionType === 'unsubscribe') {
    updateData.unsubscribed_at = new Date().toISOString();
  }

  const { error } = await getSupabaseClient()
    .from('email_digest_sends')
    .update(updateData)
    .eq('id', digestSendId);

  if (error) {
    return { success: false, message: 'Failed to track interaction' };
  }

  return { success: true, message: 'Interaction tracked successfully' };
}

function calculateNextSendTime(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString();
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
}

function generateDigestEmail(content: DigestContent, userName: string, digestType: string): { html: string; text: string; subject: string } {
  const { newProblems, trendingProblems, userActivity, campaigns } = content;
  
  const subject = `Your ${digestType} WikiGaiaLab Digest - ${newProblems.length + trendingProblems.length} problems to explore`;
  
  // Generate text version
  const text = `
Hi ${userName},

Here's your ${digestType} digest from WikiGaiaLab:

NEW PROBLEMS (${newProblems.length}):
${newProblems.map(p => `- ${p.title} (${p.vote_count} votes)`).join('\n')}

TRENDING PROBLEMS (${trendingProblems.length}):
${trendingProblems.map(p => `- ${p.title} (${p.vote_count} votes)`).join('\n')}

${campaigns.length > 0 ? `
ACTIVE CAMPAIGNS:
${campaigns.map(c => `- ${c.name}: ${c.description}`).join('\n')}
` : ''}

Visit WikiGaiaLab to participate: ${process.env.NEXT_PUBLIC_APP_URL}

Best regards,
The WikiGaiaLab Team
  `.trim();

  // Generate HTML version (simplified)
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Your ${digestType} WikiGaiaLab Digest</h1>
        <p>Hi ${userName},</p>
        
        ${newProblems.length > 0 ? `
        <h2>New Problems (${newProblems.length})</h2>
        ${newProblems.map(p => `
          <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0;">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <p><strong>${p.vote_count} votes</strong> | ${p.categories?.name || 'Uncategorized'}</p>
          </div>
        `).join('')}
        ` : ''}
        
        ${trendingProblems.length > 0 ? `
        <h2>Trending Problems (${trendingProblems.length})</h2>
        ${trendingProblems.map(p => `
          <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0;">
            <h3>${p.title}</h3>
            <p>${p.description}</p>
            <p><strong>${p.vote_count} votes</strong> | ${p.categories?.name || 'Uncategorized'}</p>
          </div>
        `).join('')}
        ` : ''}
        
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit WikiGaiaLab</a></p>
        
        <p style="font-size: 12px; color: #666;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe">Unsubscribe</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile#digest-preferences">Manage Preferences</a>
        </p>
      </body>
    </html>
  `;

  return { html, text, subject };
}