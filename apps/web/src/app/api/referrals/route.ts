/**
 * Referral System API Endpoint
 * Story 4.5: Community Growth Tools
 * 
 * GET /api/referrals - Get user's referral data and statistics
 * POST /api/referrals - Generate or get referral code for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalRewards: number;
  recentReferrals: any[];
  shareUrls: {
    direct: string;
    email: string;
    social: string;
  };
}

/**
 * GET /api/referrals
 * Get user's referral data and statistics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's referral code and create one if it doesn't exist
    let { data: userReferral, error: referralError } = await supabase
      .from('referrals')
      .select('referral_code, created_at')
      .eq('referrer_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no referral code exists, create one
    if (!userReferral) {
      const { data: newCode } = await supabase
        .rpc('create_user_referral_code', { user_id: userId });
      
      if (newCode) {
        const { data: newReferral } = await supabase
          .from('referrals')
          .select('referral_code, created_at')
          .eq('referral_code', newCode)
          .single();
        
        userReferral = newReferral;
      }
    }

    if (!userReferral) {
      return NextResponse.json(
        { error: 'Could not generate referral code' },
        { status: 500 }
      );
    }

    // Get referral statistics
    const [
      { data: totalReferrals },
      { data: successfulReferrals },
      { data: pendingReferrals },
      { data: totalRewards },
      { data: recentReferrals }
    ] = await Promise.all([
      // Total referrals created
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', userId),
      
      // Successful referrals
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('status', 'completed'),
      
      // Pending referrals
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('status', 'pending'),
      
      // Total rewards earned
      supabase
        .from('referral_rewards')
        .select('reward_value')
        .eq('referrer_id', userId)
        .eq('status', 'granted'),
      
      // Recent referrals with user info
      supabase
        .from('referrals')
        .select(`
          id, status, clicked_at, converted_at, source, created_at,
          referee:referee_id(id, name, avatar_url, created_at)
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const totalRewardAmount = totalRewards?.reduce((sum, reward) => sum + (reward.reward_value || 0), 0) || 0;

    // Generate share URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.com';
    const referralCode = userReferral.referral_code;
    
    const shareUrls = {
      direct: `${baseUrl}?ref=${referralCode}`,
      email: `${baseUrl}?ref=${referralCode}&utm_source=email&utm_medium=referral`,
      social: `${baseUrl}?ref=${referralCode}&utm_source=social&utm_medium=referral`
    };

    const response: ReferralData = {
      referralCode: referralCode,
      totalReferrals: totalReferrals?.length || 0,
      successfulReferrals: successfulReferrals?.length || 0,
      pendingReferrals: pendingReferrals?.length || 0,
      totalRewards: totalRewardAmount,
      recentReferrals: recentReferrals || [],
      shareUrls
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals
 * Generate referral code or track referral click
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, userId, referralCode, source, metadata } = body;

    if (action === 'generate') {
      // Generate referral code for user
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }

      const { data: newCode, error } = await supabase
        .rpc('create_user_referral_code', { user_id: userId });

      if (error || !newCode) {
        return NextResponse.json(
          { error: 'Failed to generate referral code' },
          { status: 500 }
        );
      }

      // Update user's referral_code field
      await supabase
        .from('users')
        .update({ referral_code: newCode })
        .eq('id', userId);

      return NextResponse.json({ 
        referralCode: newCode,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${newCode}`
      });
    
    } else if (action === 'track_click') {
      // Track referral link click
      if (!referralCode) {
        return NextResponse.json(
          { error: 'Referral code is required' },
          { status: 400 }
        );
      }

      // Get client info
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const sessionId = metadata?.sessionId || `session_${Date.now()}_${Math.random()}`;

      // Find referral and update click timestamp
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('id, referrer_id, clicked_at')
        .eq('referral_code', referralCode)
        .eq('status', 'pending')
        .single();

      if (referralError || !referral) {
        return NextResponse.json(
          { error: 'Invalid or expired referral code' },
          { status: 404 }
        );
      }

      // Update clicked_at if first click
      if (!referral.clicked_at) {
        await supabase
          .from('referrals')
          .update({ clicked_at: new Date().toISOString() })
          .eq('id', referral.id);
      }

      // Track analytics
      await supabase
        .from('referral_analytics')
        .insert({
          referral_code: referralCode,
          referrer_id: referral.referrer_id,
          event_type: 'link_clicked',
          user_id: userId || null,
          session_id: sessionId,
          ip_address: ip,
          user_agent: userAgent,
          source: source || 'direct',
          metadata: metadata || {}
        });

      return NextResponse.json({ 
        success: true,
        message: 'Referral click tracked'
      });
    
    } else if (action === 'convert') {
      // Convert referral when user signs up
      if (!referralCode || !userId) {
        return NextResponse.json(
          { error: 'Referral code and user ID are required' },
          { status: 400 }
        );
      }

      const { data: success, error } = await supabase
        .rpc('process_referral_conversion', { 
          referral_code: referralCode, 
          referee_id: userId 
        });

      if (error || !success) {
        return NextResponse.json(
          { error: 'Failed to process referral conversion' },
          { status: 500 }
        );
      }

      // Update user's referred_by field
      await supabase
        .from('users')
        .update({ referred_by: userId })
        .eq('id', userId);

      // Track analytics
      await supabase
        .from('referral_analytics')
        .insert({
          referral_code: referralCode,
          event_type: 'signup_completed',
          user_id: userId,
          metadata: metadata || {}
        });

      return NextResponse.json({ 
        success: true,
        message: 'Referral converted successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}