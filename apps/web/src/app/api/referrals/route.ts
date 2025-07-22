import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Mock referrals request during authentication migration');
    
    // Return empty referral data during migration
    return NextResponse.json({
      success: true,
      data: {
        referralCode: null,
        referralStats: {
          totalReferrals: 0,
          activeReferrals: 0,
          totalEarnings: 0
        },
        referredUsers: [],
        isEligible: false
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