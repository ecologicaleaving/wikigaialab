'use client';

import React, { useEffect, useState } from 'react';
import { VoteButton } from './vote-button';
import { useVoting } from '../../hooks/useVoting';
import { useRealtimeProblemVotes } from '../../hooks/useRealtimeVotes';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface RealtimeVoteButtonProps {
  problemId: string;
  initialVoteCount?: number;
  initialHasVoted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'detail';
  showCount?: boolean;
  showConnectionStatus?: boolean;
  className?: string;
}

export const RealtimeVoteButton: React.FC<RealtimeVoteButtonProps> = ({
  problemId,
  initialVoteCount = 0,
  initialHasVoted = false,
  size = 'md',
  variant = 'default',
  showCount = true,
  showConnectionStatus = false,
  className = ''
}) => {
  // Original voting hook for user actions
  const {
    hasVoted: userHasVoted,
    voteCount: fallbackVoteCount,
    isLoading: isVotingLoading,
    isVoting,
    toggleVote
  } = useVoting(problemId);

  // Real-time updates hook
  const {
    voteCount: realtimeVoteCount,
    isConnected,
    error: realtimeError,
    updateVoteCount,
    reconnect
  } = useRealtimeProblemVotes(problemId, true);

  // Local state for optimistic updates
  const [optimisticVoteCount, setOptimisticVoteCount] = useState<number | null>(null);
  const [optimisticHasVoted, setOptimisticHasVoted] = useState<boolean | null>(null);

  // Determine current vote count (priority: optimistic > real-time > fallback > initial)
  const currentVoteCount = optimisticVoteCount ?? realtimeVoteCount ?? fallbackVoteCount ?? initialVoteCount;
  
  // Determine current hasVoted state (priority: optimistic > user state > initial)
  const currentHasVoted = optimisticHasVoted ?? userHasVoted ?? initialHasVoted;

  // Handle vote button click with optimistic updates
  const handleVoteClick = async () => {
    if (isVoting) return;

    // Calculate optimistic values
    const newHasVoted = !currentHasVoted;
    const newVoteCount = newHasVoted 
      ? currentVoteCount + 1 
      : Math.max(0, currentVoteCount - 1);

    // Apply optimistic updates
    setOptimisticHasVoted(newHasVoted);
    setOptimisticVoteCount(newVoteCount);

    // Update real-time state optimistically
    updateVoteCount(newVoteCount);

    try {
      // Perform actual vote
      await toggleVote();

      // Broadcast to real-time system
      await fetch('/api/realtime/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          newVoteCount,
          hasVoted: newHasVoted
        })
      });

      // Clear optimistic state after successful vote
      setTimeout(() => {
        setOptimisticVoteCount(null);
        setOptimisticHasVoted(null);
      }, 1000);

    } catch (error) {
      // Revert optimistic updates on error
      setOptimisticHasVoted(null);
      setOptimisticVoteCount(null);
      
      console.error('Vote failed:', error);
      toast.error('Errore nel voto, riprova');
    }
  };

  // Show connection status toast when connection changes
  useEffect(() => {
    if (realtimeError) {
      toast.error('Connessione real-time persa', {
        action: {
          label: 'Riconnetti',
          onClick: reconnect
        }
      });
    }
  }, [realtimeError, reconnect]);

  // Connection status indicator
  const ConnectionStatus = () => {
    if (!showConnectionStatus) return null;

    return (
      <div className="flex items-center gap-1 text-xs">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-green-500" />
            <span className="text-green-600">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500">Offline</span>
          </>
        )}
      </div>
    );
  };

  // Vote count animation when it changes
  const [isCountAnimating, setIsCountAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(currentVoteCount);

  useEffect(() => {
    if (currentVoteCount !== previousCount) {
      setIsCountAnimating(true);
      setPreviousCount(currentVoteCount);
      
      const timer = setTimeout(() => {
        setIsCountAnimating(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [currentVoteCount, previousCount]);

  return (
    <div className="relative">
      <div className={`transition-transform duration-300 ${isCountAnimating ? 'scale-105' : 'scale-100'}`}>
        <VoteButton
          hasVoted={currentHasVoted}
          voteCount={currentVoteCount}
          isLoading={isVotingLoading}
          isVoting={isVoting}
          onClick={handleVoteClick}
          size={size}
          variant={variant}
          showCount={showCount}
          className={`${className} ${isCountAnimating ? 'animate-pulse' : ''}`}
        />
      </div>
      
      {/* Connection status overlay */}
      {showConnectionStatus && (
        <div className="absolute -top-1 -right-1">
          <ConnectionStatus />
        </div>
      )}
      
      {/* Vote count change indicator */}
      {isCountAnimating && (
        <div className="absolute -top-2 -right-2 pointer-events-none">
          <div className="bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
            +
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced version for problem detail pages
export const RealtimeVoteButtonDetailed: React.FC<RealtimeVoteButtonProps> = (props) => {
  return (
    <RealtimeVoteButton
      {...props}
      variant="detail"
      size="lg"
      showConnectionStatus={true}
      className="shadow-lg"
    />
  );
};

// Compact version for problem lists
export const RealtimeVoteButtonCompact: React.FC<RealtimeVoteButtonProps> = (props) => {
  return (
    <RealtimeVoteButton
      {...props}
      variant="card"
      size="sm"
      showConnectionStatus={false}
    />
  );
};