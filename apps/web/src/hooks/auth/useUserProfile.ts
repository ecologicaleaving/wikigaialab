'use client';

import { useCallback, useState } from 'react';
import { useAuth as useAuthContext } from '../../contexts/AuthContextNextAuth';
import { updateUserProfile } from '../../lib/auth-utils';

/**
 * Hook for user profile management
 * Split from main useAuth hook for better performance
 */
export const useUserProfile = () => {
  const { user, refreshSession } = useAuthContext();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateProfile = useCallback(async (updates: { name?: string; avatar_url?: string }) => {
    if (!user) {
      setUpdateError('Utente non autenticato');
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      await updateUserProfile(user.id, updates);
      await refreshSession(); // Refresh to get updated user data
      
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Errore durante l\'aggiornamento del profilo');
    } finally {
      setIsUpdating(false);
    }
  }, [user, refreshSession]);

  const clearUpdateError = useCallback(() => {
    setUpdateError(null);
  }, []);

  return {
    user,
    isUpdating,
    updateError,
    updateProfile,
    clearUpdateError,
  };
};

/**
 * Hook for user statistics
 * Focused on user metrics and stats
 */
export const useUserStats = () => {
  const { user } = useAuthContext();
  
  return {
    totalVotes: user?.total_votes_cast || 0,
    totalProblems: user?.total_problems_proposed || 0,
    subscriptionStatus: user?.subscription_status,
    memberSince: user?.created_at,
    lastLogin: user?.last_login_at,
  };
};