'use client';

import React, { useState, useEffect } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { PremiumFeature } from './PremiumFeature';
import {
  ChartBarIcon,
  ClockIcon,
  TrendingUpIcon,
  UserGroupIcon,
  StarIcon,
  CalendarIcon,
  MapIcon,
  BoltIcon,
  TargetIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface VotingInsight {
  id: string;
  type: 'pattern' | 'impact' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  value?: string | number;
  change?: number;
  actionable?: boolean;
  href?: string;
}

export function AdvancedVotingInsights() {
  const { accessData } = usePremiumAccess();
  const { history, stats } = useVotingHistory();
  const [insights, setInsights] = useState<VotingInsight[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    if (accessData?.canAccessPremium && history.length > 0) {
      generateInsights();
    }
  }, [accessData, history, selectedTimeframe, stats]);

  const generateInsights = () => {
    const newInsights: VotingInsight[] = [];

    // Voting Pattern Analysis
    if (stats?.votingStreak && stats.votingStreak > 3) {
      newInsights.push({
        id: 'streak',
        type: 'pattern',
        title: 'Serie di Voti Impressionante',
        description: `Hai votato per ${stats.votingStreak} giorni consecutivi! La consistenza è la chiave per un impatto duraturo.`,
        value: `${stats.votingStreak} giorni`,
        change: 12,
        actionable: true,
        href: '/problems'
      });
    }

    // Peak Activity Analysis
    const peakHour = calculatePeakVotingHour();
    if (peakHour !== null) {
      newInsights.push({
        id: 'peak-time',
        type: 'pattern',
        title: 'Orario di Picco Identificato',
        description: `Sei più attivo nelle votazioni intorno alle ${peakHour}:00. Sfrutta questo momento per massimizzare il tuo impatto.`,
        value: `${peakHour}:00`,
        actionable: true
      });
    }

    // Category Expertise
    if (stats?.favoriteCategory) {
      const categoryVotes = history.filter(h => h.problem.category === stats.favoriteCategory).length;
      const categoryPercentage = Math.round((categoryVotes / history.length) * 100);
      
      newInsights.push({
        id: 'category-expert',
        type: 'impact',
        title: 'Esperto di Categoria',
        description: `${categoryPercentage}% dei tuoi voti sono in "${stats.favoriteCategory}". Stai diventando un esperto riconosciuto in questa area.`,
        value: `${categoryPercentage}%`,
        change: 8
      });
    }

    // Impact Score
    const impactScore = calculateImpactScore();
    newInsights.push({
      id: 'impact-score',
      type: 'impact',
      title: 'Punteggio di Impatto',
      description: 'Basato sulla qualità e tempestività dei tuoi voti, oltre alla crescita dei problemi che supporti.',
      value: impactScore,
      change: 15,
      actionable: true,
      href: '/analytics'
    });

    // Diversification Opportunity
    const uniqueCategories = new Set(history.map(h => h.problem.category)).size;
    if (uniqueCategories < 3 && history.length > 10) {
      newInsights.push({
        id: 'diversify',
        type: 'recommendation',
        title: 'Opportunità di Diversificazione',
        description: `Hai votato solo in ${uniqueCategories} categorie. Espandere i tuoi interessi può aumentare il tuo impatto nella community.`,
        value: `${uniqueCategories} categorie`,
        actionable: true,
        href: '/problems?expand_categories=true'
      });
    }

    // Early Adopter Badge
    const earlyVotes = calculateEarlyVotes();
    if (earlyVotes > 0) {
      newInsights.push({
        id: 'early-adopter',
        type: 'achievement',
        title: 'Early Adopter',
        description: `Hai votato ${earlyVotes} problemi nei primi giorni dalla loro pubblicazione. La tua tempestività aiuta a dare visibilità alle nuove idee.`,
        value: `${earlyVotes} voti precoci`,
        change: 5
      });
    }

    // Weekly Goal Progress
    const weeklyGoal = 7; // Target votes per week
    const thisWeekVotes = stats?.votesThisWeek || 0;
    const progress = Math.round((thisWeekVotes / weeklyGoal) * 100);
    
    newInsights.push({
      id: 'weekly-goal',
      type: 'pattern',
      title: 'Progresso Obiettivo Settimanale',
      description: `Hai raggiunto il ${progress}% del tuo obiettivo settimanale di ${weeklyGoal} voti.`,
      value: `${thisWeekVotes}/${weeklyGoal}`,
      change: progress - 100,
      actionable: progress < 100,
      href: progress < 100 ? '/problems' : undefined
    });

    // Quality Indicator
    if (history.length > 5) {
      const avgProblemQuality = calculateAverageProblemQuality();
      newInsights.push({
        id: 'quality-choice',
        type: 'impact',
        title: 'Selettore di Qualità',
        description: `I problemi che voti hanno una media di ${avgProblemQuality} voti. Mostri un buon occhio per identificare contenuti di valore.`,
        value: `${avgProblemQuality} voti medi`,
        change: 10
      });
    }

    setInsights(newInsights);
  };

  const calculatePeakVotingHour = (): number | null => {
    if (history.length === 0) return null;
    
    const hourCounts: Record<number, number> = {};
    history.forEach(vote => {
      const hour = new Date(vote.voted_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const sortedHours = Object.entries(hourCounts).sort(([,a], [,b]) => b - a);
    return sortedHours.length > 0 ? parseInt(sortedHours[0][0]) : null;
  };

  const calculateImpactScore = (): number => {
    if (history.length === 0) return 0;
    
    // Base score from total votes
    let score = Math.min(50, history.length * 2);
    
    // Bonus for consistency (streak)
    if (stats?.votingStreak) {
      score += Math.min(20, stats.votingStreak);
    }
    
    // Bonus for category diversity
    const uniqueCategories = new Set(history.map(h => h.problem.category)).size;
    score += Math.min(15, uniqueCategories * 3);
    
    // Bonus for recent activity
    const recentVotes = history.filter(h => {
      const voteDate = new Date(h.voted_at);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return voteDate >= weekAgo;
    }).length;
    score += Math.min(15, recentVotes * 2);
    
    return Math.round(score);
  };

  const calculateEarlyVotes = (): number => {
    return history.filter(vote => {
      const voteDate = new Date(vote.voted_at);
      const problemDate = new Date(vote.problem.created_at);
      const daysDiff = (voteDate.getTime() - problemDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 1; // Voted within 24 hours of problem creation
    }).length;
  };

  const calculateAverageProblemQuality = (): number => {
    if (history.length === 0) return 0;
    
    const totalVotes = history.reduce((sum, vote) => sum + (vote.problem.vote_count || 0), 0);
    return Math.round(totalVotes / history.length);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return ClockIcon;
      case 'impact': return TrendingUpIcon;
      case 'recommendation': return LightBulbIcon;
      case 'achievement': return StarIcon;
      default: return ChartBarIcon;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'impact': return 'bg-green-50 text-green-600 border-green-200';
      case 'recommendation': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'achievement': return 'bg-purple-50 text-purple-600 border-purple-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <PremiumFeature
      requiredVotes={5}
      feature="Insights Avanzati sui Voti"
      fallback={
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8 text-center">
          <TargetIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Insights Avanzati sui Voti
          </h3>
          <p className="text-gray-600 mb-4">
            Scopri pattern nascosti nella tua attività di voto e ricevi consigli personalizzati per massimizzare il tuo impatto
          </p>
          <div className="text-sm text-gray-500">
            Richiede almeno 5 voti per essere sbloccato
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BoltIcon className="w-6 h-6" />
              Insights Avanzati
            </h2>
            <p className="text-gray-600">
              Analisi dettagliata dei tuoi pattern di voto e del tuo impatto nella community
            </p>
          </div>
          
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['week', 'month', 'quarter'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 text-sm font-medium ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {timeframe === 'week' ? 'Settimana' : 
                 timeframe === 'month' ? 'Mese' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Grid */}
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              const colorClass = getInsightColor(insight.type);
              
              return (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-6 ${colorClass} ${
                    insight.actionable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
                  }`}
                  onClick={insight.actionable && insight.href ? () => window.location.href = insight.href! : undefined}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        {insight.value && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{insight.value}</span>
                            {insight.change !== undefined && insight.change !== 0 && (
                              <span className={`text-xs font-medium ${
                                insight.change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {insight.change > 0 ? '+' : ''}{insight.change}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed mb-3">
                        {insight.description}
                      </p>
                      {insight.actionable && (
                        <div className="flex items-center text-sm font-medium">
                          <span>Azione consigliata</span>
                          <span className="ml-1">→</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Insights in Elaborazione
            </h3>
            <p className="text-gray-600">
              Continua a votare per generare insights personalizzati sui tuoi pattern di attività
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistiche Rapide
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.totalVotes || 0}</p>
              <p className="text-sm text-gray-600">Voti Totali</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.votingStreak || 0}</p>
              <p className="text-sm text-gray-600">Giorni Consecutivi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.categoriesVoted || 0}</p>
              <p className="text-sm text-gray-600">Categorie</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.votesThisWeek || 0}</p>
              <p className="text-sm text-gray-600">Questa Settimana</p>
            </div>
          </div>
        </div>

        {/* Action Recommendations */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-green-600" />
            Raccomandazioni Personalizzate
          </h3>
          <div className="space-y-3">
            {insights.filter(i => i.actionable).slice(0, 3).map((insight) => (
              <div key={insight.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <span className="text-sm font-medium text-gray-900">{insight.title}</span>
                {insight.href && (
                  <a
                    href={insight.href}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Azione →
                  </a>
                )}
              </div>
            ))}
            {insights.filter(i => i.actionable).length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">
                Ottimo lavoro! Non ci sono azioni urgenti da intraprendere al momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </PremiumFeature>
  );
}