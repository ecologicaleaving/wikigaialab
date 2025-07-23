'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface DashboardStats {
  totalProblems: number;
  pendingModeration: number;
  featuredProblems: number;
  totalCategories: number;
  totalCollections: number;
  recentActivity: number;
  totalVotes: number;
  averageVotes: number;
}

interface CategoryDistribution {
  id: string;
  name: string;
  problems_count: number;
  icon_name: string;
  color_hex: string;
}

interface RecentActivity {
  id: string;
  title: string;
  status: string;
  moderation_status: string;
  created_at: string;
  proposer: { id: string; name: string };
  category: { id: string; name: string };
}

interface DashboardData {
  stats: DashboardStats;
  categoryDistribution: CategoryDistribution[];
  recentActivity: RecentActivity[];
  moderationQueue: any[];
  trends: {
    problemsGrowth: string;
    votesGrowth: string;
    engagementGrowth: string;
  };
}

export function useAdminDashboard() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isAuthenticated || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        // Fetch dashboard data via API route instead of direct database access
        const response = await fetch('/api/admin/content/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const dashboardData = await response.json();

        setData(dashboardData.data);
        setError(null);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAuthenticated, isAdmin]);

  return {
    data,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-trigger the effect
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  };
}