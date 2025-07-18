/**
 * Activity Feed Component
 * Story 4.3: User Profiles & Social Features
 * Displays user activities with rich interactions and real-time updates
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { UserActivity, UserActivityFeedResponse } from '../../../../../packages/shared/src/types/social';
import { formatActivityType, getActivityIcon } from '../../../../../packages/shared/src/lib/socialService';

interface ActivityFeedProps {
  userId?: string; // If provided, shows specific user's activity; otherwise shows personalized feed
  feedType?: 'user' | 'personal' | 'global';
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

interface ActivityFeedState {
  activities: UserActivity[];
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userId,
  feedType = 'personal',
  limit = 20,
  showFilters = true,
  compact = false
}) => {
  const { user: currentUser } = useAuth();
  
  const [state, setState] = useState<ActivityFeedState>({
    activities: [],
    loading: true,
    error: null,
    page: 1,
    hasMore: false,
    total: 0
  });

  const [filters, setFilters] = useState({
    activityType: '',
    timeframe: 'all'
  });

  const [loadingMore, setLoadingMore] = useState(false);

  const loadActivities = useCallback(async (page: number = 1, reset: boolean = true) => {
    try {
      if (page === 1) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      let endpoint = '';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.activityType && { activity_type: filters.activityType }),
        ...(filters.timeframe !== 'all' && { timeframe: filters.timeframe })
      });

      if (feedType === 'user' && userId) {
        // User-specific activity
        if (currentUser) {
          params.append('requesting_user_id', currentUser.id);
        }
        endpoint = `/api/users/${userId}/activity?${params}`;
      } else if (feedType === 'personal' && currentUser) {
        // Personalized feed (user + followed users)
        endpoint = `/api/feed/activity?${params}`;
      } else {
        // Global feed or public activities
        endpoint = `/api/feed/activity?${params}`;
      }

      const headers: HeadersInit = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Non hai il permesso di visualizzare queste attività');
        } else if (response.status === 404) {
          throw new Error('Utente non trovato');
        }
        throw new Error('Errore nel caricamento delle attività');
      }

      const data: UserActivityFeedResponse = await response.json();

      setState(prev => ({
        ...prev,
        activities: reset ? data.activities : [...prev.activities, ...data.activities],
        loading: false,
        page,
        hasMore: data.hasMore,
        total: data.total
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  }, [userId, feedType, currentUser, limit, filters]);

  const loadMore = async () => {
    if (loadingMore || !state.hasMore) return;
    
    setLoadingMore(true);
    try {
      await loadActivities(state.page + 1, false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load activities on component mount and when filters change
  useEffect(() => {
    loadActivities(1, true);
  }, [loadActivities]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (state.loading && state.activities.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Errore</h3>
          <p className="mt-1 text-sm text-gray-500">{state.error}</p>
          <div className="mt-6">
            <button
              onClick={() => loadActivities(1, true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header and Filters */}
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {feedType === 'user' ? 'Attività Utente' : 'Feed Attività'}
          </h3>
          
          {showFilters && (
            <div className="flex space-x-3">
              <select
                value={filters.activityType}
                onChange={(e) => handleFilterChange({ activityType: e.target.value })}
                className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i tipi</option>
                <option value="problem_created">Problemi creati</option>
                <option value="problem_voted">Voti espressi</option>
                <option value="achievement_earned">Achievement</option>
                <option value="user_followed">Utenti seguiti</option>
                <option value="problem_favorited">Problemi preferiti</option>
              </select>
              
              <select
                value={filters.timeframe}
                onChange={(e) => handleFilterChange({ timeframe: e.target.value })}
                className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tutto il tempo</option>
                <option value="day">Oggi</option>
                <option value="week">Questa settimana</option>
                <option value="month">Questo mese</option>
              </select>
            </div>
          )}
        </div>

        {state.total > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {state.total} attività totali
          </p>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200">
        {state.activities.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna attività</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono attività da mostrare con i filtri selezionati.
            </p>
          </div>
        ) : (
          state.activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              currentUserId={currentUser?.id}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {state.hasMore && (
        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <LoadingSpinner size="xs" className="mr-2" />
                Caricamento...
              </>
            ) : (
              'Carica altre attività'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Activity Item Component
 */
interface ActivityItemProps {
  activity: UserActivity;
  currentUserId?: string;
  compact?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, currentUserId, compact = false }) => {
  const getActivityContent = () => {
    const { user, metadata } = activity;
    const userName = user?.name || user?.email?.split('@')[0] || 'Utente';
    const isCurrentUser = currentUserId === activity.user_id;
    const userDisplayName = isCurrentUser ? 'Tu' : userName;

    switch (activity.activity_type) {
      case 'problem_created':
        const problem = metadata?.problem;
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha creato un nuovo problema:{' '}
            {problem ? (
              <Link 
                href={`/problems/${problem.id}`}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {problem.title}
              </Link>
            ) : (
              <span className="text-gray-500">Problema</span>
            )}
          </div>
        );

      case 'problem_voted':
        const votedProblem = metadata?.problem;
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha votato per:{' '}
            {votedProblem ? (
              <Link 
                href={`/problems/${votedProblem.id}`}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {votedProblem.title}
              </Link>
            ) : (
              <span className="text-gray-500">Un problema</span>
            )}
          </div>
        );

      case 'achievement_earned':
        const achievement = metadata?.achievement;
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha ottenuto l'achievement:{' '}
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {achievement?.icon && <span className="mr-1">{achievement.icon}</span>}
              {achievement?.name || 'Achievement'}
            </span>
            {achievement?.points && (
              <span className="ml-1 text-sm text-gray-500">
                (+{achievement.points} punti)
              </span>
            )}
          </div>
        );

      case 'user_followed':
        const followedUser = metadata?.followedUser;
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha iniziato a seguire{' '}
            {followedUser ? (
              <Link 
                href={`/users/${followedUser.id}`}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {followedUser.name || followedUser.email?.split('@')[0] || 'un utente'}
              </Link>
            ) : (
              <span className="text-gray-500">un utente</span>
            )}
          </div>
        );

      case 'problem_favorited':
        const favoritedProblem = metadata?.problem;
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha aggiunto ai preferiti:{' '}
            {favoritedProblem ? (
              <Link 
                href={`/problems/${favoritedProblem.id}`}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                {favoritedProblem.title}
              </Link>
            ) : (
              <span className="text-gray-500">Un problema</span>
            )}
          </div>
        );

      case 'profile_updated':
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> ha aggiornato {isCurrentUser ? 'il tuo' : 'il suo'} profilo
          </div>
        );

      default:
        return (
          <div>
            <span className="font-medium">{userDisplayName}</span> {formatActivityType(activity.activity_type)}
          </div>
        );
    }
  };

  const getActivityIcon = () => {
    const iconClass = "h-8 w-8 text-gray-400";
    
    switch (activity.activity_type) {
      case 'problem_created':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'problem_voted':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        );
      case 'achievement_earned':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'user_followed':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'problem_favorited':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`px-4 py-4 sm:px-6 ${compact ? 'py-3' : 'py-4'}`}>
      <div className="flex space-x-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {activity.user?.avatar_url ? (
            <img
              className="h-8 w-8 rounded-full"
              src={activity.user.avatar_url}
              alt=""
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {(activity.user?.name || activity.user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Activity Content */}
          <div className="text-sm text-gray-900">
            {getActivityContent()}
          </div>

          {/* Timestamp */}
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <time dateTime={activity.created_at}>
              {new Date(activity.created_at).toLocaleString('it-IT', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
          </div>

          {/* Additional metadata */}
          {!compact && activity.metadata?.problem && (
            <div className="mt-2 text-xs text-gray-500 line-clamp-2">
              {activity.metadata.problem.description}
            </div>
          )}
        </div>

        {/* Activity Icon */}
        <div className="flex-shrink-0">
          {getActivityIcon()}
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;