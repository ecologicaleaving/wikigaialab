'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface VotingHistoryItem {
  id: string;
  problem_id: string;
  voted_at: string;
  problem: {
    id: string;
    title: string;
    description: string;
    status: string;
    vote_count: number;
    category_id: string;
    categories?: {
      name: string;
      color_hex: string;
    };
  };
}

export interface VotingStats {
  totalVotes: number;
  votesThisWeek: number;
  votesThisMonth: number;
  categoriesVoted: number;
  favoriteCategory: string | null;
  votingStreak: number;
  lastVoteDate: string | null;
}

export function useVotingHistory() {
  const { user, isAuthenticated } = useAuth();
  const [votingHistory, setVotingHistory] = useState<VotingHistoryItem[]>([]);
  const [stats, setStats] = useState<VotingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setVotingHistory([]);
      setStats(null);
      setLoading(false);
      return;
    }

    fetchVotingHistory();
  }, [user, isAuthenticated]);

  const fetchVotingHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch voting history via API route instead of direct database access
      const response = await fetch('/api/user/voting-history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch voting history');
      }
      
      const data = await response.json();
      const historyItems: VotingHistoryItem[] = data.votingHistory || [];

      setVotingHistory(historyItems);

      // Calculate voting statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const votesThisWeek = historyItems.filter(item => 
        new Date(item.voted_at) >= oneWeekAgo
      ).length;

      const votesThisMonth = historyItems.filter(item => 
        new Date(item.voted_at) >= oneMonthAgo
      ).length;

      // Count unique categories voted on
      const categoriesVoted = new Set(
        historyItems.map(item => item.problem.category_id).filter(Boolean)
      ).size;

      // Find favorite category
      const categoryCount = historyItems.reduce((acc, item) => {
        if (item.problem.categories?.name) {
          acc[item.problem.categories.name] = (acc[item.problem.categories.name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b, 
        null as string | null
      );

      // Calculate voting streak (consecutive days with votes)
      let votingStreak = 0;
      const sortedDates = historyItems
        .map(item => new Date(item.voted_at).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      if (sortedDates.length > 0) {
        const today = new Date().toDateString();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
        
        // Check if user voted today or yesterday to start streak
        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          votingStreak = 1;
          
          // Count consecutive days
          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i-1]);
            const nextDate = new Date(sortedDates[i]);
            const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000));
            
            if (dayDiff === 1) {
              votingStreak++;
            } else {
              break;
            }
          }
        }
      }

      const lastVoteDate = historyItems.length > 0 ? historyItems[0].voted_at : null;

      setStats({
        totalVotes: historyItems.length,
        votesThisWeek,
        votesThisMonth,
        categoriesVoted,
        favoriteCategory,
        votingStreak,
        lastVoteDate
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load voting history');
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => {
    if (isAuthenticated && user) {
      fetchVotingHistory();
    }
  };

  return {
    votingHistory,
    stats,
    loading,
    error,
    refreshHistory
  };
}

// Helper hook for recent voting activity
export function useRecentVotes(limit: number = 5) {
  const { votingHistory, loading, error } = useVotingHistory();

  const recentVotes = votingHistory.slice(0, limit);

  return {
    recentVotes,
    loading,
    error,
    hasVotes: votingHistory.length > 0
  };
}