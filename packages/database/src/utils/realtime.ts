/**
 * Real-time database operations and subscriptions
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { supabase } from '../supabase';
import { RealtimeEvent, DatabaseOperationResult } from '../types';

/**
 * Subscribe to problem changes
 */
export const subscribeToProblems = (
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel('problems_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'problems',
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'problems',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to vote changes
 */
export const subscribeToVotes = (
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel('votes_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'votes',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to votes for a specific problem
 */
export const subscribeToVotesForProblem = (
  problemId: string,
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel(`votes_for_problem_${problemId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `problem_id=eq.${problemId}`,
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'votes',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to user changes
 */
export const subscribeToUsers = (
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'users',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to category changes
 */
export const subscribeToCategories = (
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel('categories_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'categories',
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'categories',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Subscribe to app changes
 */
export const subscribeToApps = (
  callback: (event: RealtimeEvent) => void
) => {
  const channel = supabase
    .channel('apps_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'apps',
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table: 'apps',
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Generic real-time subscription utility
 */
export const subscribeToTable = (
  table: string,
  callback: (event: RealtimeEvent) => void,
  filter?: string
) => {
  const channelName = filter ? `${table}_${filter}` : `${table}_changes`;
  
  let subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter }),
      },
      (payload) => {
        const event: RealtimeEvent = {
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          table,
          old: payload.old,
          new: payload.new,
          timestamp: new Date().toISOString(),
        };
        callback(event);
      }
    );

  const channel = subscription.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get real-time connection status
 */
export const getRealtimeStatus = async (): Promise<DatabaseOperationResult<{
  connected: boolean;
  status: string;
}>> => {
  try {
    const channels = supabase.getChannels();
    const isConnected = channels.some(channel => channel.state === 'joined');
    
    return {
      success: true,
      data: {
        connected: isConnected,
        status: isConnected ? 'connected' : 'disconnected',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get real-time status',
    };
  }
};

/**
 * Test real-time connection
 */
export const testRealtimeConnection = async (): Promise<DatabaseOperationResult<boolean>> => {
  try {
    return new Promise((resolve) => {
      const testChannel = supabase
        .channel('test_connection')
        .on('presence', { event: 'sync' }, () => {
          resolve({
            success: true,
            data: true,
          });
          supabase.removeChannel(testChannel);
        })
        .subscribe();

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Real-time connection test timed out',
        });
        supabase.removeChannel(testChannel);
      }, 5000);
    });
  } catch (error) {
    return {
      success: false,
      error: 'Failed to test real-time connection',
    };
  }
};

/**
 * Disconnect all real-time subscriptions
 */
export const disconnectAllSubscriptions = (): void => {
  supabase.removeAllChannels();
};

/**
 * Get active subscription count
 */
export const getActiveSubscriptionCount = (): number => {
  return supabase.getChannels().length;
};