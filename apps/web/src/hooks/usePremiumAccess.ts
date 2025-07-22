'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface AccessLevel {
  id: string;
  name: string;
  minVotes: number;
  maxVotes?: number;
  features: string[];
  description: string;
}

export interface PremiumAccessData {
  currentLevel: AccessLevel;
  nextLevel: AccessLevel | null;
  canAccessPremium: boolean;
  totalVotes: number;
  votesNeeded: number;
  progressPercentage: number;
  subscriptionStatus: string;
  hasActiveSubscription: boolean;
}

// Configurable access levels - could be moved to environment/database
const ACCESS_LEVELS: AccessLevel[] = [
  {
    id: 'free',
    name: 'Utente Base',
    minVotes: 0,
    maxVotes: 4,
    features: ['Visualizza problemi', 'Proponi problemi', 'App base'],
    description: 'Accesso base alla piattaforma'
  },
  {
    id: 'contributor',
    name: 'Contributore',
    minVotes: 5,
    maxVotes: 14,
    features: ['Funzionalità premium app', 'Supporto prioritario', 'Badge contributore'],
    description: 'Accesso alle funzionalità premium dopo 5 voti'
  },
  {
    id: 'advocate',
    name: 'Sostenitore',
    minVotes: 15,
    maxVotes: 24,
    features: ['App esclusive', 'Accesso beta', 'Statistiche avanzate'],
    description: 'Accesso a funzionalità avanzate dopo 15 voti'
  },
  {
    id: 'champion',
    name: 'Campione',
    minVotes: 25,
    features: ['Tutte le funzionalità', 'Supporto diretto', 'Influenza roadmap'],
    description: 'Accesso completo dopo 25 voti'
  }
];

export function usePremiumAccess() {
  const { user, isAuthenticated } = useAuth();
  const [accessData, setAccessData] = useState<PremiumAccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Not authenticated - set to free tier
      setAccessData({
        currentLevel: ACCESS_LEVELS[0],
        nextLevel: ACCESS_LEVELS[1],
        canAccessPremium: false,
        totalVotes: 0,
        votesNeeded: ACCESS_LEVELS[1].minVotes,
        progressPercentage: 0,
        subscriptionStatus: 'free',
        hasActiveSubscription: false
      });
      setLoading(false);
      return;
    }

    fetchUserAccessData();
  }, [user, isAuthenticated]);

  const fetchUserAccessData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data via API route instead of direct database access
      const response = await fetch('/api/auth/user');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const { user: userData } = await response.json();

      const totalVotes = userData.total_votes_cast || 0;
      const subscriptionStatus = userData.subscription_status || 'free';
      const hasActiveSubscription = ['active', 'trialing'].includes(subscriptionStatus);

      // Determine current access level
      const currentLevel = ACCESS_LEVELS.find(level => {
        if (level.maxVotes === undefined) {
          return totalVotes >= level.minVotes;
        }
        return totalVotes >= level.minVotes && totalVotes <= level.maxVotes;
      }) || ACCESS_LEVELS[0];

      // Find next level
      const nextLevel = ACCESS_LEVELS.find(level => 
        level.minVotes > totalVotes
      ) || null;

      // Calculate votes needed for next level
      const votesNeeded = nextLevel ? nextLevel.minVotes - totalVotes : 0;

      // Calculate progress percentage
      let progressPercentage = 0;
      if (nextLevel) {
        const currentLevelMin = currentLevel.minVotes;
        const nextLevelMin = nextLevel.minVotes;
        const votesInCurrentRange = totalVotes - currentLevelMin;
        const totalVotesInRange = nextLevelMin - currentLevelMin;
        progressPercentage = Math.round((votesInCurrentRange / totalVotesInRange) * 100);
      } else {
        progressPercentage = 100; // Max level reached
      }

      // Determine if user can access premium features
      const canAccessPremium = totalVotes >= 5 || hasActiveSubscription;

      setAccessData({
        currentLevel,
        nextLevel,
        canAccessPremium,
        totalVotes,
        votesNeeded,
        progressPercentage,
        subscriptionStatus,
        hasActiveSubscription
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessData = () => {
    if (isAuthenticated && user) {
      fetchUserAccessData();
    }
  };

  return {
    accessData,
    loading,
    error,
    refreshAccessData,
    accessLevels: ACCESS_LEVELS
  };
}

// Helper hook for checking specific premium features
export function useFeatureAccess(requiredVotes: number = 5) {
  const { accessData, loading } = usePremiumAccess();

  const canAccess = !loading && accessData && (
    accessData.totalVotes >= requiredVotes || 
    accessData.hasActiveSubscription
  );

  const votesNeeded = accessData 
    ? Math.max(0, requiredVotes - accessData.totalVotes)
    : requiredVotes;

  return {
    canAccess: !!canAccess,
    votesNeeded,
    loading,
    currentVotes: accessData?.totalVotes || 0,
    hasSubscription: accessData?.hasActiveSubscription || false
  };
}

// Helper function to get access level badge styling
export function getAccessLevelStyling(level: AccessLevel) {
  const styles = {
    free: 'bg-gray-100 text-gray-800',
    contributor: 'bg-blue-100 text-blue-800',
    advocate: 'bg-purple-100 text-purple-800',
    champion: 'bg-gold-100 text-gold-800 bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
  };

  return styles[level.id as keyof typeof styles] || styles.free;
}