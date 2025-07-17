'use client';

import React from 'react';
import { usePremiumAccess, getAccessLevelStyling } from '@/hooks/usePremiumAccess';
import { Star, Trophy, Vote, ArrowUp, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function AccessStatusCard({ className = '' }: { className?: string }) {
  const { accessData, loading } = usePremiumAccess();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!accessData) {
    return null;
  }

  const { currentLevel, nextLevel, totalVotes, votesNeeded, progressPercentage, hasActiveSubscription } = accessData;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Stato Accesso
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccessLevelStyling(currentLevel)}`}>
                {currentLevel.name}
              </span>
              {hasActiveSubscription && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Abbonato
                </span>
              )}
            </div>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              {currentLevel.id === 'champion' ? (
                <Trophy className="w-6 h-6 text-yellow-600" />
              ) : (
                <Star className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {totalVotes}
            </div>
            <div className="text-xs text-gray-500">voti</div>
          </div>
        </div>
      </div>

      {/* Current Level Info */}
      <div className="p-6">
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">I Tuoi Benefici Attuali</h4>
          <ul className="space-y-2">
            {currentLevel.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Prossimo Livello: {nextLevel.name}
              </h4>
              <span className="text-sm text-gray-500">
                {votesNeeded} voti rimanenti
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white drop-shadow-sm">
                  {progressPercentage}%
                </span>
              </div>
            </div>

            {/* Next Level Benefits */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <ArrowUp className="w-4 h-4" />
                Benefici {nextLevel.name}
              </h5>
              <ul className="space-y-1">
                {nextLevel.features.slice(0, 2).map((feature, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
                {nextLevel.features.length > 2 && (
                  <li className="text-sm text-blue-600">
                    e altri {nextLevel.features.length - 2} benefici...
                  </li>
                )}
              </ul>
            </div>

            {/* Call to Action */}
            <Link
              href="/problems"
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-center font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Vote className="w-4 h-4" />
              Vota per Avanzare
            </Link>
          </div>
        )}

        {/* Max Level Reached */}
        {!nextLevel && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-yellow-800">
                  Livello Massimo Raggiunto!
                </h4>
                <p className="text-sm text-yellow-700">
                  Hai sbloccato tutte le funzionalità premium. Grazie per il tuo contributo alla community!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebars/headers
export function AccessStatusBadge({ 
  showProgress = false, 
  className = '' 
}: { 
  showProgress?: boolean; 
  className?: string 
}) {
  const { accessData, loading } = usePremiumAccess();

  if (loading || !accessData) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full h-6 w-20 ${className}`}></div>
    );
  }

  const { currentLevel, totalVotes, votesNeeded, progressPercentage } = accessData;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelStyling(currentLevel)}`}>
        {currentLevel.name}
      </span>
      
      <div className="text-xs text-gray-600">
        {totalVotes} voti
      </div>

      {showProgress && votesNeeded > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">
            -{votesNeeded}
          </span>
        </div>
      )}
    </div>
  );
}