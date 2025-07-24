/**
 * Reputation Display Component
 * Story 4.3: User Profiles & Social Features
 * Beautiful display of user reputation with breakdown and trends
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  ReputationBreakdown,
  formatReputationScore,
  getReputationColor,
  getReputationBadge
} from '../../../../../packages/shared/src/lib/reputationSystem';

interface ReputationDisplayProps {
  userId?: string;
  layout?: 'full' | 'compact' | 'badge-only';
  showBreakdown?: boolean;
  showTrend?: boolean;
  refreshInterval?: number; // Auto-refresh interval in seconds
}

interface ReputationState {
  reputation: ReputationBreakdown | null;
  loading: boolean;
  error: string | null;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({
  userId,
  layout = 'full',
  showBreakdown = true,
  showTrend = true,
  refreshInterval
}) => {
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.id;
  
  const [state, setState] = useState<ReputationState>({
    reputation: null,
    loading: true,
    error: null
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      loadReputation();
    }
  }, [targetUserId]);

  // Auto-refresh if interval is set (with minimum 30s interval for performance)
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const safeInterval = Math.max(refreshInterval, 30); // Minimum 30 seconds
      const interval = setInterval(loadReputation, safeInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, targetUserId]);

  const loadReputation = async () => {
    if (!targetUserId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const headers: HeadersInit = {};
      if (currentUser) {
        const token = await currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${targetUserId}/reputation`, { headers });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Non autorizzato a visualizzare questa reputazione');
        }
        throw new Error('Errore nel caricamento della reputazione');
      }

      const reputation: ReputationBreakdown = await response.json();

      setState(prev => ({
        ...prev,
        reputation,
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

  if (state.loading && !state.reputation) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size={layout === 'compact' ? 'sm' : 'md'} />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{state.error}</p>
      </div>
    );
  }

  if (!state.reputation) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">Reputazione non disponibile</p>
      </div>
    );
  }

  const { reputation } = state;

  // Badge-only layout
  if (layout === 'badge-only') {
    return (
      <ReputationBadge 
        score={reputation.currentScore}
        rank={reputation.rank}
        showTooltip={true}
      />
    );
  }

  // Compact layout
  if (layout === 'compact') {
    return (
      <div className="flex items-center space-x-3">
        <ReputationBadge score={reputation.currentScore} rank={reputation.rank} />
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold ${getReputationColor(reputation.currentScore)}`}>
              {formatReputationScore(reputation.currentScore)}
            </span>
            {showTrend && <TrendIndicator trend={reputation.trend} percentage={reputation.trendPercentage} />}
          </div>
          <div className="text-sm text-gray-500">{reputation.rank}</div>
        </div>
      </div>
    );
  }

  // Full layout
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Reputazione
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </button>
        </div>

        {/* Main Reputation Display */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <ReputationBadge size="lg" score={reputation.currentScore} rank={reputation.rank} />
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getReputationColor(reputation.currentScore)}`}>
                  {formatReputationScore(reputation.currentScore)}
                </span>
                {showTrend && (
                  <TrendIndicator 
                    trend={reputation.trend} 
                    percentage={reputation.trendPercentage}
                    size="lg"
                  />
                )}
              </div>
              <div className="text-lg text-gray-600">{reputation.rank}</div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {reputation.nextRankRequirement > 0 && (
            <div className="max-w-sm mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Prossimo livello</span>
                <span>{reputation.nextRankRequirement} punti rimanenti</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.max(10, 100 - (reputation.nextRankRequirement / (reputation.currentScore + reputation.nextRankRequirement)) * 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Reputation Breakdown */}
        {showBreakdown && showDetails && reputation.breakdown.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Dettaglio Reputazione
            </h4>
            <div className="space-y-3">
              {reputation.breakdown.map((item, index) => (
                <ReputationBreakdownItem key={index} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Trend Information */}
        {showTrend && reputation.trend !== 'stable' && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center space-x-2">
              <TrendIndicator trend={reputation.trend} percentage={reputation.trendPercentage} />
              <span className="text-sm text-gray-600">
                La tua reputazione è {reputation.trend === 'increasing' ? 'in crescita' : 'in calo'} 
                del {reputation.trendPercentage}% nell'ultima settimana
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Reputation Badge Component
 */
interface ReputationBadgeProps {
  score: number;
  rank: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  rank,
  size = 'md',
  showTooltip = false
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-16 w-16 text-2xl'
  }[size];

  const badge = getReputationBadge(score);
  const color = getReputationColor(score);

  return (
    <div 
      className="relative"
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => showTooltip && setShowTooltipState(false)}
    >
      <div className={`
        ${sizeClasses}
        rounded-full border-2 flex items-center justify-center
        ${color.replace('text-', 'border-')} bg-gradient-to-br from-white to-gray-50
      `}>
        <span className={size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-lg'}>
          {badge}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {rank}: {formatReputationScore(score)} punti
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Trend Indicator Component
 */
interface TrendIndicatorProps {
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  percentage,
  size = 'md'
}) => {
  if (trend === 'stable') return null;

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  const isIncreasing = trend === 'increasing';
  const color = isIncreasing ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center space-x-1 ${color}`}>
      <svg 
        className={iconSize} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d={isIncreasing 
            ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
            : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          } 
        />
      </svg>
      <span className={`${textSize} font-medium`}>
        {percentage}%
      </span>
    </div>
  );
};

/**
 * Reputation Breakdown Item Component
 */
interface ReputationBreakdownItemProps {
  item: {
    category: string;
    points: number;
    description: string;
  };
}

const ReputationBreakdownItem: React.FC<ReputationBreakdownItemProps> = ({ item }) => {
  const isPositive = item.points > 0;
  const isNegative = item.points < 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h5 className="text-sm font-medium text-gray-900">{item.category}</h5>
          {isPositive && (
            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isNegative && (
            <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
      </div>
      <div className={`text-sm font-medium ml-4 ${
        isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
      }`}>
        {isPositive ? '+' : ''}{item.points}
      </div>
    </div>
  );
};

/**
 * Simple Reputation Score Component (for inline use)
 */
interface ReputationScoreProps {
  score: number;
  showBadge?: boolean;
  showRank?: boolean;
}

export const ReputationScore: React.FC<ReputationScoreProps> = ({
  score,
  showBadge = true,
  showRank = false
}) => {
  const color = getReputationColor(score);
  const badge = getReputationBadge(score);

  return (
    <div className="inline-flex items-center space-x-1">
      {showBadge && <span className="text-sm">{badge}</span>}
      <span className={`font-medium ${color}`}>
        {formatReputationScore(score)}
      </span>
    </div>
  );
};

export default ReputationDisplay;