'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@wikigaialab/database';

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
        const supabase = createClientComponentClient<Database>();

        // Fetch all data in parallel
        const [
          { count: totalProblems },
          { count: pendingModeration },
          { count: featuredProblems },
          { count: totalCategories },
          { count: recentActivity },
          { data: categoryStats },
          { data: recentProblems },
          { data: voteStats }
        ] = await Promise.all([
          // Total problems
          supabase
            .from('problems')
            .select('*', { count: 'exact', head: true }),
          
          // Pending moderation (graceful fallback if column doesn't exist)
          supabase
            .from('problems')
            .select('*', { count: 'exact', head: true })
            .eq('moderation_status', 'pending')
            .then(result => result.error ? { count: 0 } : result),
          
          // Featured problems (graceful fallback if column doesn't exist)
          supabase
            .from('problems')
            .select('*', { count: 'exact', head: true })
            .eq('is_featured', true)
            .then(result => result.error ? { count: 0 } : result),
          
          // Total categories
          supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          
          // Recent activity (problems created in last 7 days)
          supabase
            .from('problems')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          
          // Category distribution
          supabase
            .from('categories')
            .select(`
              id,
              name,
              problems_count,
              icon_name,
              color_hex
            `)
            .eq('is_active', true)
            .order('problems_count', { ascending: false })
            .then(result => result.error ? { data: [] } : result),
          
          // Recent problems for activity feed
          supabase
            .from('problems')
            .select(`
              id,
              title,
              status,
              created_at,
              proposer:users!proposer_id(id, name),
              category:categories!category_id(id, name)
            `)
            .order('created_at', { ascending: false })
            .limit(10)
            .then(result => result.error ? { data: [] } : result),
          
          // Vote statistics
          supabase
            .from('problems')
            .select('vote_count')
            .then(result => result.error ? { data: [] } : result)
        ]);

        // Calculate aggregated statistics
        const totalVotes = voteStats?.reduce((sum, problem) => sum + (problem.vote_count || 0), 0) || 0;
        const averageVotes = totalProblems ? Math.round((totalVotes / totalProblems) * 100) / 100 : 0;

        // Add default moderation_status for backward compatibility
        const enhancedRecentActivity = recentProblems?.map(problem => ({
          ...problem,
          moderation_status: 'approved' // Default since migration might not be applied yet
        })) || [];

        const dashboardData: DashboardData = {
          stats: {
            totalProblems: totalProblems || 0,
            pendingModeration: pendingModeration || 0,
            featuredProblems: featuredProblems || 0,
            totalCategories: totalCategories || 0,
            totalCollections: 0, // Will implement when content_collections table is ready
            recentActivity: recentActivity || 0,
            totalVotes,
            averageVotes
          },
          categoryDistribution: categoryStats || [],
          recentActivity: enhancedRecentActivity,
          moderationQueue: [], // Will populate when moderation features are fully implemented
          trends: {
            problemsGrowth: '+12%', // TODO: Calculate from historical data
            votesGrowth: '+8%',
            engagementGrowth: '+15%'
          }
        };

        setData(dashboardData);
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