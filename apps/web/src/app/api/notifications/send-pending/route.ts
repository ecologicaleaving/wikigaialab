import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/NotificationService';

export async function POST(request: NextRequest) {
  try {
    // Simple authentication check - you might want to add proper admin auth here
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Processing pending notifications...');
    await notificationService.sendPendingNotifications();

    return NextResponse.json({
      success: true,
      message: 'Pending notifications processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing pending notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'notification-processor',
    timestamp: new Date().toISOString()
  });
}