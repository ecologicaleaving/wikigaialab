import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface VoteStatus {
  hasVoted: boolean;
  voteCount: number;
  isLoading: boolean;
}

interface VoteResponse {
  success: boolean;
  hasVoted: boolean;
  newVoteCount: number;
  message: string;
}

export function useVoting(problemId: string) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    hasVoted: false,
    voteCount: 0,
    isLoading: true,
  });
  const [isVoting, setIsVoting] = useState(false);

  // Fetch initial vote status
  const fetchVoteStatus = useCallback(async () => {
    if (!problemId) return;
    
    try {
      const response = await fetch(`/api/problems/${problemId}/vote`);
      if (response.ok) {
        const data = await response.json();
        setVoteStatus({
          hasVoted: data.hasVoted,
          voteCount: data.voteCount,
          isLoading: false,
        });
      }
    } catch (error) {
      setVoteStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [problemId]);

  useEffect(() => {
    fetchVoteStatus();
  }, [fetchVoteStatus]);

  // Toggle vote function with optimistic updates
  const toggleVote = useCallback(async () => {
    if (!user) {
      toast.error('Devi essere autenticato per votare');
      return;
    }

    if (isVoting) return; // Prevent double-clicks

    setIsVoting(true);

    // Optimistic update
    const optimisticHasVoted = !voteStatus.hasVoted;
    const optimisticVoteCount = optimisticHasVoted 
      ? voteStatus.voteCount + 1 
      : Math.max(0, voteStatus.voteCount - 1);

    setVoteStatus(prev => ({
      ...prev,
      hasVoted: optimisticHasVoted,
      voteCount: optimisticVoteCount,
    }));

    try {
      const response = await fetch(`/api/problems/${problemId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: VoteResponse = await response.json();
        
        // Update with real data from server
        setVoteStatus(prev => ({
          ...prev,
          hasVoted: data.hasVoted,
          voteCount: data.newVoteCount,
        }));

        // Show success message
        toast.success(data.message, {
          duration: 2000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel voto');
      }
    } catch (error) {
      // Revert optimistic update on error
      setVoteStatus(prev => ({
        ...prev,
        hasVoted: !optimisticHasVoted,
        voteCount: voteStatus.voteCount,
      }));

      toast.error(
        error instanceof Error ? error.message : 'Errore nel voto'
      );
    } finally {
      setIsVoting(false);
    }
  }, [user, problemId, voteStatus.hasVoted, voteStatus.voteCount, isVoting]);

  // Update vote count externally (for real-time updates)
  const updateVoteCount = useCallback((newCount: number) => {
    setVoteStatus(prev => ({
      ...prev,
      voteCount: newCount,
    }));
  }, []);

  return {
    hasVoted: voteStatus.hasVoted,
    voteCount: voteStatus.voteCount,
    isLoading: voteStatus.isLoading,
    isVoting,
    toggleVote,
    updateVoteCount,
    refetch: fetchVoteStatus,
  };
}

// Hook for managing multiple problem votes (for lists)
export function useMultipleVoting() {
  const { user } = useAuth();
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});

  const toggleVote = useCallback(async (
    problemId: string, 
    currentHasVoted: boolean, 
    currentVoteCount: number,
    onUpdate: (newVoteCount: number, newHasVoted: boolean) => void
  ) => {
    if (!user) {
      toast.error('Devi essere autenticato per votare');
      return;
    }

    if (votingStates[problemId]) return; // Prevent double-clicks

    setVotingStates(prev => ({ ...prev, [problemId]: true }));

    // Optimistic update
    const optimisticHasVoted = !currentHasVoted;
    const optimisticVoteCount = optimisticHasVoted 
      ? currentVoteCount + 1 
      : Math.max(0, currentVoteCount - 1);

    onUpdate(optimisticVoteCount, optimisticHasVoted);

    try {
      const response = await fetch(`/api/problems/${problemId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: VoteResponse = await response.json();
        onUpdate(data.newVoteCount, data.hasVoted);
        
        toast.success(data.message, {
          duration: 2000,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel voto');
      }
    } catch (error) {
      // Revert optimistic update on error
      onUpdate(currentVoteCount, currentHasVoted);
      
      toast.error(
        error instanceof Error ? error.message : 'Errore nel voto'
      );
    } finally {
      setVotingStates(prev => ({ ...prev, [problemId]: false }));
    }
  }, [user, votingStates]);

  return {
    toggleVote,
    isVoting: (problemId: string) => !!votingStates[problemId],
  };
}