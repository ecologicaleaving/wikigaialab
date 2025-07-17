import { useState, useEffect, useRef, useCallback } from 'react';

// Types for real-time vote updates
export interface VoteUpdate {
  type: 'vote_update' | 'initial_vote_count' | 'connected' | 'ping';
  problemId?: string;
  newVoteCount?: number;
  voteCount?: number;
  hasVoted?: boolean;
  userId?: string;
  timestamp: string;
  clientId?: string;
  subscribedProblems?: string[];
}

export interface RealtimeVoteState {
  [problemId: string]: {
    voteCount: number;
    lastUpdated: string;
    isConnected: boolean;
  };
}

export interface UseRealtimeVotesOptions {
  problemIds: string[];
  enabled?: boolean;
  onVoteUpdate?: (update: VoteUpdate) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealtimeVotes({
  problemIds,
  enabled = true,
  onVoteUpdate,
  onConnectionChange
}: UseRealtimeVotesOptions) {
  const [voteStates, setVoteStates] = useState<RealtimeVoteState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;
  const baseRetryDelay = 1000; // 1 second

  // Clean up function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (!enabled || problemIds.length === 0) {
      return;
    }

    cleanup();
    setError(null);

    try {
      const url = `/api/realtime/votes?problemIds=${problemIds.join(',')}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Real-time vote connection opened');
        setIsConnected(true);
        setRetryCount(0);
        setError(null);
        onConnectionChange?.(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const update: VoteUpdate = JSON.parse(event.data);
          
          // Handle different message types
          switch (update.type) {
            case 'connected':
              console.log('✅ Connected to real-time votes:', update.clientId);
              break;
              
            case 'initial_vote_count':
              if (update.problemId && update.voteCount !== undefined) {
                setVoteStates(prev => ({
                  ...prev,
                  [update.problemId!]: {
                    voteCount: update.voteCount!,
                    lastUpdated: update.timestamp,
                    isConnected: true
                  }
                }));
              }
              break;
              
            case 'vote_update':
              if (update.problemId && update.newVoteCount !== undefined) {
                setVoteStates(prev => ({
                  ...prev,
                  [update.problemId!]: {
                    voteCount: update.newVoteCount!,
                    lastUpdated: update.timestamp,
                    isConnected: true
                  }
                }));
                
                // Call callback if provided
                onVoteUpdate?.(update);
              }
              break;
              
            case 'ping':
              // Keep-alive ping, no action needed
              break;
              
            default:
              console.log('📨 Unknown real-time message type:', update.type);
          }
        } catch (error) {
          console.error('❌ Error parsing real-time vote update:', error);
        }
      };

      eventSource.onerror = (event) => {
        console.error('❌ Real-time vote connection error:', event);
        setIsConnected(false);
        onConnectionChange?.(false);

        // Attempt reconnection with exponential backoff
        if (retryCount < maxRetries) {
          const delay = baseRetryDelay * Math.pow(2, retryCount);
          console.log(`🔄 Retrying connection in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, delay);
        } else {
          setError('Failed to connect to real-time updates after multiple attempts');
          console.error('❌ Max reconnection attempts reached');
        }
      };

    } catch (error) {
      console.error('❌ Error creating real-time vote connection:', error);
      setError('Failed to establish real-time connection');
    }
  }, [enabled, problemIds, retryCount, onVoteUpdate, onConnectionChange, cleanup]);

  // Manually reconnect
  const reconnect = useCallback(() => {
    setRetryCount(0);
    connect();
  }, [connect]);

  // Get vote count for a specific problem
  const getVoteCount = useCallback((problemId: string): number | undefined => {
    return voteStates[problemId]?.voteCount;
  }, [voteStates]);

  // Check if a specific problem is connected
  const isProblemConnected = useCallback((problemId: string): boolean => {
    return voteStates[problemId]?.isConnected || false;
  }, [voteStates]);

  // Update local vote count (for optimistic updates)
  const updateVoteCount = useCallback((problemId: string, newCount: number) => {
    setVoteStates(prev => ({
      ...prev,
      [problemId]: {
        voteCount: newCount,
        lastUpdated: new Date().toISOString(),
        isConnected: prev[problemId]?.isConnected || false
      }
    }));
  }, []);

  // Connect when component mounts or dependencies change
  useEffect(() => {
    if (enabled && problemIds.length > 0) {
      connect();
    }

    return cleanup;
  }, [enabled, problemIds.join(','), connect, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    voteStates,
    isConnected,
    error,
    retryCount,
    reconnect,
    getVoteCount,
    isProblemConnected,
    updateVoteCount
  };
}

// Hook for single problem real-time updates
export function useRealtimeProblemVotes(problemId: string, enabled: boolean = true) {
  const {
    voteStates,
    isConnected,
    error,
    reconnect,
    getVoteCount,
    isProblemConnected,
    updateVoteCount
  } = useRealtimeVotes({
    problemIds: problemId ? [problemId] : [],
    enabled: enabled && !!problemId
  });

  return {
    voteCount: getVoteCount(problemId),
    isConnected: isProblemConnected(problemId),
    isOverallConnected: isConnected,
    error,
    reconnect,
    updateVoteCount: (newCount: number) => updateVoteCount(problemId, newCount)
  };
}

// Hook for multiple problems (problem list pages)
export function useRealtimeProblemsVotes(problemIds: string[], enabled: boolean = true) {
  return useRealtimeVotes({
    problemIds,
    enabled: enabled && problemIds.length > 0
  });
}