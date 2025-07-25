import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getApiUser(request);
    if (!user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    console.log('Referrals request for user:', user.email);
    
    // Return expected referral data format
    return NextResponse.json({
      referralCode: 'DEMO001',
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      totalRewards: 0,
      recentReferrals: [],
      shareUrls: {
        direct: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.vercel.app'}/signup?ref=DEMO001`,
        email: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.vercel.app'}/signup?ref=DEMO001`,
        social: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wikigaialab.vercel.app'}/signup?ref=DEMO001`
      }
    });

  } catch (error) {
    console.error('Error in referrals:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch referral data',
      data: { referralCode: null, referralStats: { totalReferrals: 0 } }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Mock referral creation during authentication migration');
    
    return NextResponse.json({
      success: false,
      error: 'Referral system not available during migration',
      message: 'Please try again later'
    }, { status: 503 });

  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create referral'
    }, { status: 500 });
  }
}