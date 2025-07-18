/**
 * Social Interaction Components
 * Story 4.3: User Profiles & Social Features
 * Follow buttons, favorite buttons, and other social interaction UI components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// ============ FOLLOW BUTTON COMPONENT ============

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  onFollowChange?: (isFollowing: boolean) => void;
  showMutualCount?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  initialIsFollowing,
  size = 'md',
  variant = 'primary',
  onFollowChange,
  showMutualCount = false
}) => {
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const [mutualCount, setMutualCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check follow status on mount if not provided
  useEffect(() => {
    if (currentUser && targetUserId && initialIsFollowing === undefined) {
      checkFollowStatus();
    }
  }, [currentUser, targetUserId]);

  const checkFollowStatus = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        if (showMutualCount) {
          setMutualCount(data.mutualFollowers || 0);
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella gestione del follow');
      }

      const data = await response.json();
      const newFollowingState = data.isFollowing;
      
      setIsFollowing(newFollowingState);
      
      if (onFollowChange) {
        onFollowChange(newFollowingState);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (!currentUser || currentUser.id === targetUserId) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-xs';
      case 'lg': return 'px-6 py-3 text-base';
      default: return 'px-4 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    if (isFollowing) {
      return 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50';
    }
    
    switch (variant) {
      case 'secondary':
        return 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50';
      case 'outline':
        return 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50';
      default:
        return 'border-transparent text-white bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center border font-medium rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getSizeClasses()} ${getVariantClasses()}
        `}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="xs" color="current" className="mr-2" />
            {isFollowing ? 'Rimozione...' : 'Aggiunta...'}
          </>
        ) : (
          <>
            {isFollowing ? (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Seguito
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Segui
              </>
            )}
          </>
        )}
      </button>

      {/* Mutual followers count */}
      {showMutualCount && mutualCount > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {mutualCount} follower{mutualCount === 1 ? '' : 's'} in comune
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
};

// ============ FAVORITE BUTTON COMPONENT ============

interface FavoriteButtonProps {
  problemId: string;
  initialIsFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  problemId,
  initialIsFavorited,
  size = 'md',
  showCount = false,
  onFavoriteChange
}) => {
  const { user: currentUser } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited || false);
  const [isLoading, setIsLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check favorite status on mount if not provided
  useEffect(() => {
    if (currentUser && problemId && initialIsFavorited === undefined) {
      checkFavoriteStatus();
    }
  }, [currentUser, problemId]);

  const checkFavoriteStatus = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/problems/${problemId}/favorite`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
        if (showCount) {
          setFavoriteCount(data.totalFavorites || 0);
        }
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!currentUser || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await currentUser.getIdToken();
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/problems/${problemId}/favorite`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella gestione dei preferiti');
      }

      const data = await response.json();
      const newFavoritedState = data.isFavorited;
      
      setIsFavorited(newFavoritedState);
      
      // Update count
      if (showCount) {
        setFavoriteCount(prev => newFavoritedState ? prev + 1 : prev - 1);
      }
      
      if (onFavoriteChange) {
        onFavoriteChange(newFavoritedState);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show favorite button if not logged in
  if (!currentUser) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-1';
      case 'lg': return 'p-3';
      default: return 'p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={handleFavoriteToggle}
        disabled={isLoading}
        className={`
          inline-flex items-center justify-center rounded-full
          transition-colors duration-200
          ${getSizeClasses()}
          ${isFavorited 
            ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100' 
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isFavorited ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      >
        {isLoading ? (
          <LoadingSpinner size="xs" color="current" />
        ) : (
          <svg 
            className={getIconSize()} 
            fill={isFavorited ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        )}
      </button>

      {/* Favorite count */}
      {showCount && favoriteCount > 0 && (
        <span className="text-sm text-gray-500">{favoriteCount}</span>
      )}

      {/* Error message */}
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
};

// ============ SOCIAL STATS COMPONENT ============

interface SocialStatsProps {
  stats: {
    reputation_score: number;
    total_followers: number;
    total_following: number;
    total_achievements?: number;
    total_problems_proposed: number;
    total_votes_cast: number;
  };
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLabels?: boolean;
}

export const SocialStats: React.FC<SocialStatsProps> = ({
  stats,
  layout = 'horizontal',
  showLabels = true
}) => {
  const statsItems = [
    { label: 'Reputazione', value: stats.reputation_score, icon: '⭐' },
    { label: 'Follower', value: stats.total_followers, icon: '👥' },
    { label: 'Seguiti', value: stats.total_following, icon: '➡️' },
    { label: 'Problemi', value: stats.total_problems_proposed, icon: '💡' },
    { label: 'Voti', value: stats.total_votes_cast, icon: '🗳️' }
  ];

  if (stats.total_achievements !== undefined) {
    statsItems.splice(1, 0, { 
      label: 'Achievement', 
      value: stats.total_achievements, 
      icon: '🏆' 
    });
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical':
        return 'space-y-4';
      case 'grid':
        return 'grid grid-cols-2 gap-4 sm:grid-cols-3';
      default:
        return 'flex space-x-6';
    }
  };

  return (
    <div className={getLayoutClasses()}>
      {statsItems.map((item, index) => (
        <div key={index} className={`text-center ${layout === 'horizontal' ? 'flex-1' : ''}`}>
          <div className="text-2xl font-bold text-gray-900">
            {item.value.toLocaleString()}
          </div>
          {showLabels && (
            <div className="text-sm text-gray-500 flex items-center justify-center">
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============ USER PREVIEW CARD COMPONENT ============

interface UserPreviewCardProps {
  user: {
    id: string;
    name?: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    reputation_score: number;
    total_followers: number;
  };
  showFollowButton?: boolean;
  compact?: boolean;
}

export const UserPreviewCard: React.FC<UserPreviewCardProps> = ({
  user,
  showFollowButton = true,
  compact = false
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-gray-300 flex items-center justify-center overflow-hidden`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={`${compact ? 'text-sm' : 'text-lg'} font-medium text-gray-600`}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
            {user.name || user.email.split('@')[0]}
          </h4>
          
          {!compact && user.bio && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}

          <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mt-1 flex items-center space-x-3`}>
            <span>⭐ {user.reputation_score}</span>
            <span>👥 {user.total_followers} follower</span>
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && (
          <div className="flex-shrink-0">
            <FollowButton 
              targetUserId={user.id} 
              size={compact ? 'sm' : 'md'}
              variant="outline"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  FollowButton,
  FavoriteButton,
  SocialStats,
  UserPreviewCard
};