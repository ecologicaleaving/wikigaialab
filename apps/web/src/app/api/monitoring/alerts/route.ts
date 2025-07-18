import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get recent alerts (this would typically be from a monitoring service)
    const alerts: Alert[] = await getRecentAlerts(severity, limit);

    return NextResponse.json({
      alerts,
      total: alerts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json({
      error: 'Failed to fetch alerts',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, source, metadata } = body;

    const alert: Alert = {
      id: crypto.randomUUID(),
      type,
      message,
      source,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Log alert
    console.log('Alert generated:', alert);

    // In production, send to monitoring service
    await sendToMonitoringService(alert);

    // Check if alert needs immediate attention
    if (type === 'error') {
      await checkCriticalAlerts(alert);
    }

    return NextResponse.json({
      success: true,
      alertId: alert.id,
      timestamp: alert.timestamp
    });

  } catch (error) {
    console.error('Failed to create alert:', error);
    return NextResponse.json({
      error: 'Failed to create alert',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function getRecentAlerts(severity: string | null, limit: number): Promise<Alert[]> {
  // In production, this would query your monitoring service
  // For now, return mock data
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'info',
      message: 'Application started successfully',
      source: 'system',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      metadata: { version: '1.0.0' }
    },
    {
      id: '2',
      type: 'warning',
      message: 'High memory usage detected',
      source: 'performance',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      metadata: { memoryUsage: '85%' }
    }
  ];

  return severity 
    ? mockAlerts.filter(alert => alert.type === severity)
    : mockAlerts;
}

async function sendToMonitoringService(alert: Alert): Promise<void> {
  // In production, integrate with your monitoring service
  // Examples: DataDog, New Relic, PagerDuty, etc.
  
  console.log('Sending alert to monitoring service:', alert);
  
  // Example integration patterns:
  // await datadog.sendEvent(alert);
  // await newrelic.recordCustomEvent('Alert', alert);
  // await pagerduty.createIncident(alert);
}

async function checkCriticalAlerts(alert: Alert): Promise<void> {
  const criticalKeywords = ['database', 'auth', 'payment', 'security'];
  
  const isCritical = criticalKeywords.some(keyword => 
    alert.message.toLowerCase().includes(keyword)
  );

  if (isCritical) {
    console.log('CRITICAL ALERT DETECTED:', alert);
    
    // In production, send immediate notifications
    // await sendSlackNotification(alert);
    // await sendEmailAlert(alert);
    // await createPagerDutyIncident(alert);
  }
}

// Health check alerts
export async function checkSystemHealth(): Promise<void> {
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (dbError) {
      await sendAlert({
        type: 'error',
        message: 'Database connectivity lost',
        source: 'health-check',
        metadata: { error: dbError.message }
      });
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (memoryPercentage > 80) {
      await sendAlert({
        type: 'warning',
        message: `High memory usage: ${memoryPercentage.toFixed(1)}%`,
        source: 'performance',
        metadata: { memoryUsage }
      });
    }

  } catch (error) {
    console.error('Health check failed:', error);
  }
}

async function sendAlert(alertData: Omit<Alert, 'id' | 'timestamp'>): Promise<void> {
  const alert: Alert = {
    ...alertData,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };

  await sendToMonitoringService(alert);
}