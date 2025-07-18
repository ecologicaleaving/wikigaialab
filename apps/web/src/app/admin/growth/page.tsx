/**
 * Community Growth Dashboard
 * Story 4.5: Community Growth Tools
 * Admin dashboard for tracking and managing community growth metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface GrowthMetrics {
  userAcquisition: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    growthRate: number;
    conversionRate: number;
  };
  userRetention: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate7Day: number;
    retentionRate30Day: number;
  };
  referralMetrics: {
    totalReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    topReferrers: Array<{
      userId: string;
      userName: string;
      referralCount: number;
      successfulReferrals: number;
    }>;
  };
  socialSharing: {
    totalShares: number;
    sharesByPlatform: Record<string, number>;
    clickThroughRate: number;
    topSharedProblems: Array<{
      problemId: string;
      title: string;
      shareCount: number;
      clickCount: number;
    }>;
  };
  emailDigests: {
    subscribersCount: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
    digestsSentThisWeek: number;
  };
  leaderboards: {
    totalParticipants: number;
    activeLeaderboards: number;
    topPerformers: Array<{
      userId: string;
      userName: string;
      leaderboardName: string;
      rank: number;
      score: number;
    }>;
  };
  campaigns: {
    activeCampaigns: number;
    totalParticipants: number;
    completionRate: number;
    topCampaigns: Array<{
      campaignId: string;
      name: string;
      participants: number;
      completionRate: number;
    }>;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  action: () => void;
  type: 'primary' | 'secondary' | 'danger';
}

export default function GrowthDashboard() {
  const [metrics, setMetrics] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGrowthMetrics();
  }, [selectedPeriod]);

  const fetchGrowthMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/growth-metrics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        console.error('Failed to fetch growth metrics');
      }
    } catch (error) {
      console.error('Error fetching growth metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    setRefreshing(true);
    await fetchGrowthMetrics();
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-campaign',
      title: 'Create Campaign',
      description: 'Launch a new engagement campaign',
      action: () => window.location.href = '/admin/campaigns/new',
      type: 'primary'
    },
    {
      id: 'send-digest',
      title: 'Send Digest',
      description: 'Send email digest to inactive users',
      action: () => handleSendDigest(),
      type: 'secondary'
    },
    {
      id: 'update-leaderboards',
      title: 'Update Leaderboards',
      description: 'Recalculate all leaderboard rankings',
      action: () => handleUpdateLeaderboards(),
      type: 'secondary'
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download growth metrics report',
      action: () => handleExportData(),
      type: 'secondary'
    }
  ];

  const handleSendDigest = async () => {
    try {
      const response = await fetch('/api/email/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'send_batch',
          digestType: 'weekly',
          userFilter: { inactive_days: 7 },
          dryRun: false
        })
      });

      if (response.ok) {
        alert('Digest sent successfully!');
      } else {
        alert('Failed to send digest');
      }
    } catch (error) {
      console.error('Error sending digest:', error);
      alert('Error sending digest');
    }
  };

  const handleUpdateLeaderboards = async () => {
    try {
      const response = await fetch('/api/leaderboards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'recalculate_all'
        })
      });

      if (response.ok) {
        alert('Leaderboards updated successfully!');
        refreshMetrics();
      } else {
        alert('Failed to update leaderboards');
      }
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      alert('Error updating leaderboards');
    }
  };

  const handleExportData = () => {
    const csvData = generateCSVReport(metrics);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `growth-metrics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVReport = (metrics: GrowthMetrics | null): string => {
    if (!metrics) return '';

    const lines = [
      'Metric,Value,Period',
      `Total Users,${metrics.userAcquisition.totalUsers},${selectedPeriod}`,
      `New Users Today,${metrics.userAcquisition.newUsersToday},${selectedPeriod}`,
      `Daily Active Users,${metrics.userRetention.dailyActiveUsers},${selectedPeriod}`,
      `Weekly Active Users,${metrics.userRetention.weeklyActiveUsers},${selectedPeriod}`,
      `Total Referrals,${metrics.referralMetrics.totalReferrals},${selectedPeriod}`,
      `Referral Conversion Rate,${metrics.referralMetrics.conversionRate}%,${selectedPeriod}`,
      `Total Shares,${metrics.socialSharing.totalShares},${selectedPeriod}`,
      `Email Open Rate,${metrics.emailDigests.openRate}%,${selectedPeriod}`,
      `Active Campaigns,${metrics.campaigns.activeCampaigns},${selectedPeriod}`
    ];

    return lines.join('\n');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Growth Dashboard</h1>
            <p className="text-gray-600">Monitor and optimize community growth metrics</p>
          </div>
          <div className="flex space-x-3">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-32"
            >
              <option value="1d">Today</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
            </Select>
            <Button 
              onClick={refreshMetrics} 
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Users"
              value={metrics.userAcquisition.totalUsers.toLocaleString()}
              change={`+${metrics.userAcquisition.newUsersToday}`}
              changeLabel="today"
              trend="up"
            />
            <MetricCard
              title="Daily Active Users"
              value={metrics.userRetention.dailyActiveUsers.toLocaleString()}
              change={`${metrics.userRetention.retentionRate7Day.toFixed(1)}%`}
              changeLabel="7-day retention"
              trend="up"
            />
            <MetricCard
              title="Referral Conversion"
              value={`${metrics.referralMetrics.conversionRate.toFixed(1)}%`}
              change={`${metrics.referralMetrics.successfulReferrals}`}
              changeLabel="successful referrals"
              trend="up"
            />
            <MetricCard
              title="Email Open Rate"
              value={`${metrics.emailDigests.openRate.toFixed(1)}%`}
              change={`${metrics.emailDigests.digestsSentThisWeek}`}
              changeLabel="digests sent this week"
              trend="up"
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={action.action}
              >
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Acquisition */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">User Acquisition</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">New users this week:</span>
                  <span className="font-medium">{metrics.userAcquisition.newUsersThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New users this month:</span>
                  <span className="font-medium">{metrics.userAcquisition.newUsersThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth rate:</span>
                  <span className="font-medium text-green-600">+{metrics.userAcquisition.growthRate.toFixed(1)}%</span>
                </div>
              </div>
            </Card>

            {/* Social Sharing */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Social Sharing</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total shares:</span>
                  <span className="font-medium">{metrics.socialSharing.totalShares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Click-through rate:</span>
                  <span className="font-medium">{metrics.socialSharing.clickThroughRate.toFixed(1)}%</span>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-600 text-sm">By platform:</span>
                  {Object.entries(metrics.socialSharing.sharesByPlatform).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between text-sm">
                      <span className="capitalize">{platform}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Top Referrers */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Top Referrers</h2>
              <div className="space-y-3">
                {metrics.referralMetrics.topReferrers.slice(0, 5).map((referrer, index) => (
                  <div key={referrer.userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium">{referrer.userName}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {referrer.successfulReferrals}/{referrer.referralCount} successful
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Campaign Performance */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Campaign Performance</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active campaigns:</span>
                  <span className="font-medium">{metrics.campaigns.activeCampaigns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total participants:</span>
                  <span className="font-medium">{metrics.campaigns.totalParticipants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion rate:</span>
                  <span className="font-medium">{metrics.campaigns.completionRate.toFixed(1)}%</span>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-600 text-sm">Top campaigns:</span>
                  {metrics.campaigns.topCampaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.campaignId} className="flex justify-between text-sm">
                      <span className="truncate mr-2">{campaign.name}</span>
                      <span>{campaign.participants} participants</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, changeLabel, trend }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-sm ${trendColor}`}>
          <div className="text-right">
            <p className="font-medium">{change}</p>
            <p className="text-xs">{changeLabel}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}