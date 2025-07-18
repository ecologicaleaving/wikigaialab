/**
 * Achievement Badges Component
 * Story 4.3: User Profiles & Social Features
 * Display achievement badges with progress tracking and beautiful UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Achievement, 
  UserAchievement, 
  UserAchievementsResponse 
} from '../../../../../packages/shared/src/types/social';

interface AchievementBadgesProps {
  userId?: string; // If not provided, shows current user's achievements
  showProgress?: boolean; // Show progress bars for unearned achievements
  layout?: 'grid' | 'list' | 'compact';
  limit?: number;
  category?: string; // Filter by achievement category
  showOnlyEarned?: boolean;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  progress?: number;
  isEarned: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  layout?: 'grid' | 'list';
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  userId,
  showProgress = true,
  layout = 'grid',
  limit,
  category,
  showOnlyEarned = false
}) => {
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.id;
  
  const [state, setState] = useState({
    achievements: [] as any[],
    loading: true,
    error: null as string | null,
    totalEarned: 0,
    totalPoints: 0,
    recentAchievements: [] as UserAchievement[]
  });

  const [selectedCategory, setSelectedCategory] = useState(category || '');

  useEffect(() => {
    if (targetUserId) {
      loadAchievements();
    }
  }, [targetUserId, selectedCategory, showOnlyEarned]);

  const loadAchievements = async () => {
    if (!targetUserId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams();
      if (showProgress && targetUserId === currentUser?.id) {
        params.append('include_progress', 'true');
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (currentUser && targetUserId !== currentUser.id) {
        params.append('requesting_user_id', currentUser.id);
      }

      const response = await fetch(`/api/users/${targetUserId}/achievements?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Non hai il permesso di visualizzare questi achievement');
        }
        throw new Error('Errore nel caricamento degli achievement');
      }

      const data: UserAchievementsResponse = await response.json();

      // Filter achievements if needed
      let filteredAchievements = data.achievements;
      if (showOnlyEarned) {
        filteredAchievements = data.achievements.filter((item: any) => 
          item.isEarned || item.earned_at
        );
      }
      if (limit) {
        filteredAchievements = filteredAchievements.slice(0, limit);
      }

      setState(prev => ({
        ...prev,
        achievements: filteredAchievements,
        totalEarned: data.totalEarned || data.achievements.filter((item: any) => item.isEarned).length,
        totalPoints: data.totalPoints,
        recentAchievements: data.recentAchievements || [],
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  if (state.loading) {
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
        </div>
      </div>
    );
  }

  const categories = [...new Set(state.achievements.map((item: any) => item.achievement?.category).filter(Boolean))];

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Achievement
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {state.totalEarned} ottenuti • {state.totalPoints} punti totali
            </p>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Achievement Grid/List */}
      <div className="p-6">
        {state.achievements.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun achievement</h3>
            <p className="mt-1 text-sm text-gray-500">
              {showOnlyEarned 
                ? 'Nessun achievement ottenuto ancora.'
                : 'Nessun achievement disponibile.'}
            </p>
          </div>
        ) : (
          <div className={
            layout === 'grid' 
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' 
              : 'space-y-4'
          }>
            {state.achievements.map((item: any) => (
              <AchievementBadge
                key={item.achievement.id}
                achievement={item.achievement}
                userAchievement={item.isEarned ? item : undefined}
                progress={item.progress}
                isEarned={item.isEarned}
                earnedAt={item.earned_at}
                layout={layout}
                showDetails={true}
                size={layout === 'compact' ? 'sm' : 'md'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      {state.recentAchievements.length > 0 && (
        <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Achievement Recenti
          </h4>
          <div className="space-y-2">
            {state.recentAchievements.map((userAchievement) => (
              <div
                key={userAchievement.id}
                className="flex items-center space-x-3 text-sm"
              >
                <div className="flex-shrink-0">
                  {userAchievement.achievement?.icon ? (
                    <span className="text-lg">{userAchievement.achievement.icon}</span>
                  ) : (
                    <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">
                    {userAchievement.achievement?.name}
                  </p>
                  <p className="text-gray-500">
                    {new Date(userAchievement.earned_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="text-yellow-600 font-medium">
                  +{userAchievement.achievement?.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Individual Achievement Badge Component
 */
const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  userAchievement,
  progress = 0,
  isEarned,
  earnedAt,
  size = 'md',
  showDetails = false,
  layout = 'grid'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const badgeSize = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }[size];

  const iconSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }[size];

  const getBadgeColor = () => {
    if (isEarned) {
      switch (achievement.category) {
        case 'voting': return 'bg-blue-100 text-blue-600 border-blue-200';
        case 'problems': return 'bg-green-100 text-green-600 border-green-200';
        case 'community': return 'bg-purple-100 text-purple-600 border-purple-200';
        case 'engagement': return 'bg-pink-100 text-pink-600 border-pink-200';
        case 'special': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    }
    return 'bg-gray-50 text-gray-400 border-gray-200';
  };

  if (layout === 'list') {
    return (
      <div className={`flex items-center space-x-4 p-4 rounded-lg border ${
        isEarned ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
      }`}>
        {/* Badge Icon */}
        <div className={`${badgeSize} rounded-full border-2 flex items-center justify-center ${getBadgeColor()}`}>
          {achievement.icon ? (
            <span className={iconSize}>{achievement.icon}</span>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          )}
        </div>

        {/* Achievement Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
            {achievement.name}
          </h4>
          <p className={`text-xs ${isEarned ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
            {achievement.description}
          </p>
          
          {/* Progress Bar */}
          {!isEarned && progress > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Earned Date */}
          {isEarned && earnedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Ottenuto il {new Date(earnedAt).toLocaleDateString('it-IT')}
            </p>
          )}
        </div>

        {/* Points */}
        <div className="text-right">
          <div className={`text-sm font-medium ${isEarned ? 'text-yellow-600' : 'text-gray-400'}`}>
            {achievement.points} pt
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {getCategoryDisplayName(achievement.category)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative p-4 rounded-lg border transition-all duration-200 ${
        isEarned 
          ? 'bg-white border-gray-200 hover:shadow-md' 
          : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Achievement Badge */}
      <div className="text-center">
        <div className={`mx-auto ${badgeSize} rounded-full border-2 flex items-center justify-center mb-3 ${getBadgeColor()}`}>
          {achievement.icon ? (
            <span className={iconSize}>{achievement.icon}</span>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          )}
        </div>

        <h4 className={`text-sm font-medium ${isEarned ? 'text-gray-900' : 'text-gray-500'} mb-1`}>
          {achievement.name}
        </h4>

        <p className={`text-xs ${isEarned ? 'text-gray-600' : 'text-gray-400'} mb-2`}>
          {achievement.description}
        </p>

        {/* Points and Category */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 capitalize">
            {getCategoryDisplayName(achievement.category)}
          </span>
          <span className={`font-medium ${isEarned ? 'text-yellow-600' : 'text-gray-400'}`}>
            {achievement.points} pt
          </span>
        </div>

        {/* Progress Bar for Unearned Achievements */}
        {!isEarned && progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Earned Date */}
        {isEarned && earnedAt && (
          <p className="text-xs text-gray-500 mt-2">
            {new Date(earnedAt).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>

      {/* Earned Indicator */}
      {isEarned && (
        <div className="absolute top-2 right-2">
          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {achievement.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to get display name for achievement categories
 */
const getCategoryDisplayName = (category: string): string => {
  const categoryMap = {
    voting: 'Votazioni',
    problems: 'Problemi',
    community: 'Comunità',
    engagement: 'Engagement',
    special: 'Speciali'
  };
  return categoryMap[category as keyof typeof categoryMap] || category;
};

export default AchievementBadges;