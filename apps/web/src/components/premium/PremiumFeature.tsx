'use client';

import React from 'react';
import { useFeatureAccess } from '@/hooks/usePremiumAccess';
import { Lock, Vote, Star, Zap } from 'lucide-react';
import Link from 'next/link';

interface PremiumFeatureProps {
  children: React.ReactNode;
  requiredVotes?: number;
  feature?: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  className?: string;
}

export function PremiumFeature({
  children,
  requiredVotes = 5,
  feature,
  fallback,
  showUpgradePrompt = true,
  className = ''
}: PremiumFeatureProps) {
  const { canAccess, votesNeeded, loading, currentVotes, hasSubscription } = useFeatureAccess(requiredVotes);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (canAccess) {
    return <div className={className}>{children}</div>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Default upgrade prompt
  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature ? `${feature} - Funzionalità Premium` : 'Funzionalità Premium'}
          </h3>
          
          {hasSubscription ? (
            <p className="text-gray-600 mb-4">
              Questa funzionalità è disponibile per gli abbonati.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              Vota {votesNeeded} {votesNeeded === 1 ? 'problema' : 'problemi'} per sbloccare questa funzionalità.
              {currentVotes > 0 && (
                <span className="block text-sm mt-1">
                  Hai votato {currentVotes} problemi finora.
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Vote className="w-4 h-4" />
            Vota Problemi
          </Link>
          
          {!hasSubscription && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Star className="w-4 h-4" />
              Scopri Premium
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized component for inline premium features
export function InlinePremiumFeature({
  children,
  requiredVotes = 5,
  feature,
  className = ''
}: Pick<PremiumFeatureProps, 'children' | 'requiredVotes' | 'feature' | 'className'>) {
  const { canAccess, votesNeeded, loading } = useFeatureAccess(requiredVotes);

  if (loading) {
    return <div className={`animate-pulse bg-gray-200 rounded h-4 w-20 ${className}`}></div>;
  }

  if (canAccess) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-gray-400 ${className}`}>
      <Lock className="w-3 h-3" />
      <span className="text-xs">Premium</span>
    </span>
  );
}

// Premium badge component
export function PremiumBadge({ 
  className = '',
  size = 'sm'
}: { 
  className?: string; 
  size?: 'xs' | 'sm' | 'md' 
}) {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <span className={`inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium ${sizeClasses[size]} ${className}`}>
      <Zap className={iconSizes[size]} />
      Premium
    </span>
  );
}

// Access control wrapper for entire components/pages
export function PremiumAccess({
  children,
  requiredVotes = 5,
  redirectTo = '/problems',
  showFallback = true
}: {
  children: React.ReactNode;
  requiredVotes?: number;
  redirectTo?: string;
  showFallback?: boolean;
}) {
  const { canAccess, votesNeeded, loading } = useFeatureAccess(requiredVotes);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (canAccess) {
    return <>{children}</>;
  }

  if (!showFallback) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Accesso Premium Richiesto
        </h2>
        
        <p className="text-gray-600 mb-6">
          Vota {votesNeeded} {votesNeeded === 1 ? 'problema' : 'problemi'} per accedere a questa funzionalità.
        </p>
        
        <Link
          href={redirectTo}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Vote className="w-5 h-5" />
          Inizia a Votare
        </Link>
      </div>
    </div>
  );
}