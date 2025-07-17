'use client';

import React from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { Vote, Star, Zap, ArrowRight, Clock, Users } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  variant?: 'card' | 'banner' | 'modal' | 'sidebar';
  requiredVotes?: number;
  feature?: string;
  className?: string;
  showDismiss?: boolean;
  onDismiss?: () => void;
}

export function UpgradePrompt({
  variant = 'card',
  requiredVotes = 5,
  feature,
  className = '',
  showDismiss = false,
  onDismiss
}: UpgradePromptProps) {
  const { accessData } = usePremiumAccess();

  if (!accessData || accessData.canAccessPremium) {
    return null;
  }

  const { totalVotes, nextLevel } = accessData;
  const votesNeeded = Math.max(0, requiredVotes - totalVotes);

  const baseClasses = {
    card: 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6',
    banner: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4',
    modal: 'bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-md w-full',
    sidebar: 'bg-blue-50 border border-blue-200 rounded-lg p-4'
  };

  if (variant === 'banner') {
    return (
      <div className={`${baseClasses[variant]} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">
                {feature ? `Sblocca ${feature}` : 'Accedi al Premium'}
              </h3>
              <p className="text-sm opacity-90">
                Vota {votesNeeded} {votesNeeded === 1 ? 'problema' : 'problemi'} per accedere
              </p>
            </div>
          </div>
          
          <Link
            href="/problems"
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Vota Ora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`${baseClasses[variant]} ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          
          <h4 className="font-semibold text-gray-900 mb-2">
            Premium in Vista!
          </h4>
          
          <p className="text-sm text-gray-600 mb-4">
            Ti mancano solo {votesNeeded} voti per sbloccare le funzionalità premium.
          </p>
          
          <Link
            href="/problems"
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Vote className="w-4 h-4" />
            Continua a Votare
          </Link>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className={`${baseClasses[variant]} ${className} relative`}>
      {showDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Star className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {feature ? `Sblocca ${feature}` : `Avanza a ${nextLevel?.name || 'Premium'}`}
          </h3>
          
          <p className="text-gray-600 mb-4">
            Vota {votesNeeded} {votesNeeded === 1 ? 'problema' : 'problemi'} della community 
            per accedere alle funzionalità premium e aiutare a costruire un futuro migliore.
          </p>

          {nextLevel && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Cosa sbloccherai:
              </h4>
              <ul className="space-y-1">
                {nextLevel.features.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/problems"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Vote className="w-4 h-4" />
              Vota Problemi ({totalVotes}/{requiredVotes})
            </Link>
            
            <Link
              href="/apps"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Star className="w-4 h-4" />
              Scopri le App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick action prompts for specific contexts
export function QuickVotePrompt({ 
  className = '',
  compact = false 
}: { 
  className?: string;
  compact?: boolean;
}) {
  const { accessData } = usePremiumAccess();

  if (!accessData || accessData.canAccessPremium) {
    return null;
  }

  const { totalVotes, votesNeeded } = accessData;

  if (compact) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-3">
          <Vote className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {votesNeeded} voti per il premium
            </p>
            <p className="text-xs text-blue-700">
              Hai votato {totalVotes} problemi
            </p>
          </div>
          <Link
            href="/problems"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Vota
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-yellow-800 mb-1">
            Quasi ci sei!
          </h4>
          <p className="text-sm text-yellow-700 mb-3">
            Hai votato {totalVotes} problemi. Votane altri {votesNeeded} per sbloccare tutte le funzionalità premium.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-sm font-medium text-yellow-800 hover:text-yellow-900"
          >
            Continua a votare
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Social proof prompt to encourage voting
export function SocialVotePrompt({ className = '' }: { className?: string }) {
  const { accessData } = usePremiumAccess();

  if (!accessData || accessData.canAccessPremium) {
    return null;
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-green-800 mb-1">
            Unisciti alla Community
          </h4>
          <p className="text-sm text-green-700 mb-3">
            Migliaia di utenti hanno già sbloccato le funzionalità premium votando i problemi che contano davvero.
          </p>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-sm font-medium text-green-800 hover:text-green-900"
          >
            <Vote className="w-4 h-4" />
            Inizia a votare
          </Link>
        </div>
      </div>
    </div>
  );
}