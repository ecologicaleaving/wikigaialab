import { useState, useEffect, useCallback } from 'react';

// Types for analytics data
export interface VotingHistoryItem {
  created_at: string;
  problem: {
    id: string;
    title: string;
    description: string;
    vote_count: number;
    status: string;
    created_at: string;
    category: {
      id: string;
      name: string;
      icon?: string;
    };
    proposer: {
      id: string;
      name: string;
    };
  };
}

export interface UserVotingStats {
  totalVotes: number;
  votesThisMonth: number;
  categoriesVoted: number;
  memberSince: string;
  avgVotesPerMonth: number;
}

export interface VotingHistoryResponse {
  votes: VotingHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: UserVotingStats;
}

export interface ProblemAnalytics {
  problemId: string;
  title: string;
  currentVotes: number;
  status: string;
  createdAt: string;
  votingVelocity: number;
  problemAge: number;
  milestonesAchieved: Array<{
    milestone: number;
    achieved_at: string;
    notification_sent: boolean;
  }>;
  nextMilestone?: number;
  progressToNextMilestone: number;
  votingTimeline: Array<{
    date: string;
    votes: number;
  }>;
  recentVoters: Array<{
    voterName: string;
    votedAt: string;
  }>;
  totalVotesLast7Days: number;
  totalVotesLast30Days: number;
  peakVotingDay: {
    date: string;
    votes: number;
  };
}

export interface VotingTrends {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVotes: number;
    avgVotesPerDay: number;
    peakDay: {
      date: string;
      votes: number;
    };
    growthRate: number;
  };
  dailyVoting: Array<{
    date: string;
    votes: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    votes: number;
  }>;
  recentMilestones: Array<{
    milestone: number;
    achieved_at: string;
    problem: {
      id: string;
      title: string;
      category: {
        name: string;
      };
    };
  }>;
  topProblems: Array<{
    id: string;
    title: string;
    categoryName: string;
    totalVotes: number;
    votesInPeriod: number;
  }>;
}

// Hook for user's voting history
export function useVotingHistory(page: number = 1, limit: number = 20) {
  const [data, setData] = useState<VotingHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotingHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/user/voting-history?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch voting history');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchVotingHistory();
  }, [fetchVotingHistory]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchVotingHistory
  };
}

// Hook for problem-specific analytics
export function useProblemAnalytics(problemId: string) {
  const [data, setData] = useState<ProblemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblemAnalytics = useCallback(async () => {
    if (!problemId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/problems/${problemId}/analytics`);

      if (!response.ok) {
        throw new Error('Failed to fetch problem analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchProblemAnalytics();
  }, [fetchProblemAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProblemAnalytics
  };
}

// Hook for platform voting trends
export function useVotingTrends(days: number = 30) {
  const [data, setData] = useState<VotingTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotingTrends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/voting-trends?days=${days}`);

      if (!response.ok) {
        throw new Error('Failed to fetch voting trends');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchVotingTrends();
  }, [fetchVotingTrends]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchVotingTrends
  };
}

// Combined hook for dashboard analytics
export function useDashboardAnalytics() {
  const votingHistory = useVotingHistory(1, 5); // Recent 5 votes
  const votingTrends = useVotingTrends(7); // Last 7 days

  return {
    votingHistory: {
      recentVotes: votingHistory.data?.votes || [],
      statistics: votingHistory.data?.statistics,
      isLoading: votingHistory.isLoading,
      error: votingHistory.error
    },
    votingTrends: {
      trends: votingTrends.data,
      isLoading: votingTrends.isLoading,
      error: votingTrends.error
    },
    refetch: () => {
      votingHistory.refetch();
      votingTrends.refetch();
    }
  };
}