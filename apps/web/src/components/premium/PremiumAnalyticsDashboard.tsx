'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { PremiumFeature } from './PremiumFeature';
import { UpgradePrompt } from './UpgradePrompts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  CalendarIcon,
  EyeIcon,
  FireIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MapIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalViews: number;
    engagementRate: number;
    averageVotes: number;
    trendingScore: number;
  };
  votingPatterns: {
    categoryBreakdown: Array<{
      category: string;
      votes: number;
      percentage: number;
    }>;
    timePatterns: Array<{
      hour: number;
      votes: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      votes: number;
      change: number;
    }>;
  };
  problemInsights: {
    popularProblems: Array<{
      id: string;
      title: string;
      votes: number;
      category: string;
      trend: 'up' | 'down' | 'stable';
    }>;
    myProblemsPerformance: Array<{
      id: string;
      title: string;
      views: number;
      votes: number;
      engagement: number;
      status: string;
    }>;
  };
  recommendations: Array<{
    type: 'vote' | 'propose' | 'engage';
    title: string;
    description: string;
    action: string;
    href: string;
  }>;
}

export function PremiumAnalyticsDashboard() {
  const { user } = useAuth();
  const { accessData } = usePremiumAccess();
  const { stats: votingStats } = useVotingHistory();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (accessData?.canAccessPremium) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
  }, [accessData, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/premium?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6" />
                  Analisi Premium
                </h1>
                <p className="text-gray-600">
                  Insights avanzati sulla tua attività e sulle tendenze della community
                </p>
              </div>

              {accessData && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {accessData.currentLevel.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {accessData.totalVotes} voti espressi
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PremiumFeature
          requiredVotes={5}
          feature="Analytics Premium"
          fallback={
            <div className="space-y-8">
              {/* Free tier analytics preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BasicStatsCard
                  title="I Tuoi Voti"
                  value={votingStats?.totalVotes || 0}
                  icon={ChartBarIcon}
                  description="Voti totali espressi"
                />
                <BasicStatsCard
                  title="Serie Attuale"
                  value={votingStats?.votingStreak || 0}
                  icon={FireIcon}
                  description="Giorni consecutivi"
                />
                <BasicStatsCard
                  title="Categorie"
                  value={votingStats?.categoriesVoted || 0}
                  icon={TagIcon}
                  description="Categorie votate"
                />
              </div>

              {/* Upgrade prompt */}
              <UpgradePrompt 
                variant="card"
                requiredVotes={5}
                feature="Analytics Avanzati"
              />

              {/* Preview of premium features */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-8">
                <div className="text-center">
                  <ChartBarIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Sblocca Analytics Premium
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Accedi a insights dettagliati, tendenze di voto e raccomandazioni personalizzate
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-start gap-3">
                      <TrendingUpIcon className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Analisi delle Tendenze</h4>
                        <p className="text-sm text-gray-600">Visualizza le tendenze di voto nel tempo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <UserGroupIcon className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Insights Community</h4>
                        <p className="text-sm text-gray-600">Scopri i problemi più popolari e emergenti</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Pattern Temporali</h4>
                        <p className="text-sm text-gray-600">Analizza quando sei più attivo</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <StarIcon className="w-5 h-5 text-purple-500 mt-1" />
                      <div>
                        <h4 className="font-medium text-gray-900">Raccomandazioni</h4>
                        <p className="text-sm text-gray-600">Suggerimenti personalizzati per aumentare l'impatto</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          {/* Premium Analytics Content */}
          <div className="space-y-8">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Dashboard Analytics</h2>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {range === '7d' ? '7 giorni' : range === '30d' ? '30 giorni' : '90 giorni'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <AnalyticsLoadingSkeleton />
            ) : analyticsData ? (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <PremiumStatsCard
                    title="Visualizzazioni Totali"
                    value={analyticsData.overview.totalViews}
                    icon={EyeIcon}
                    trend="up"
                    change={12.5}
                  />
                  <PremiumStatsCard
                    title="Tasso Engagement"
                    value={`${analyticsData.overview.engagementRate}%`}
                    icon={TrendingUpIcon}
                    trend="up"
                    change={5.2}
                  />
                  <PremiumStatsCard
                    title="Media Voti"
                    value={analyticsData.overview.averageVotes}
                    icon={ChartBarIcon}
                    trend="stable"
                    change={0}
                  />
                  <PremiumStatsCard
                    title="Punteggio Trending"
                    value={analyticsData.overview.trendingScore}
                    icon={FireIcon}
                    trend="up"
                    change={8.1}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Distribuzione per Categoria
                    </h3>
                    <CategoryBreakdownChart categories={analyticsData.votingPatterns.categoryBreakdown} />
                  </div>

                  {/* Weekly Trends */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tendenze Settimanali
                    </h3>
                    <WeeklyTrendsChart trends={analyticsData.votingPatterns.weeklyTrends} />
                  </div>
                </div>

                {/* Popular Problems */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Problemi in Tendenza
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.problemInsights.popularProblems.map((problem, index) => (
                      <TrendingProblemCard key={problem.id} problem={problem} rank={index + 1} />
                    ))}
                  </div>
                </div>

                {/* Personal Recommendations */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-blue-600" />
                    Raccomandazioni Personalizzate
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analyticsData.recommendations.map((rec, index) => (
                      <RecommendationCard key={index} recommendation={rec} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Dati analytics non disponibili</p>
              </div>
            )}
          </div>
        </PremiumFeature>
      </div>
    </div>
  );
}

// Supporting Components
interface BasicStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function BasicStatsCard({ title, value, icon: Icon, description }: BasicStatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface PremiumStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

function PremiumStatsCard({ title, value, icon: Icon, trend, change }: PremiumStatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mr-4">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend !== 'stable' && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm font-medium">{change}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryBreakdownChart({ categories }: { categories: Array<{category: string; votes: number; percentage: number}> }) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="flex items-center justify-between">
          <div className="flex items-center flex-1 mr-4">
            <span className="text-sm font-medium text-gray-700 min-w-0">{cat.category}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${cat.percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-12 text-right">{cat.votes}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyTrendsChart({ trends }: { trends: Array<{week: string; votes: number; change: number}> }) {
  return (
    <div className="space-y-3">
      {trends.map((trend) => (
        <div key={trend.week} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{trend.week}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{trend.votes} voti</span>
            <div className={`flex items-center ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.change >= 0 ? (
                <ArrowUpIcon className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 mr-1" />
              )}
              <span className="text-xs">{Math.abs(trend.change)}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendingProblemCard({ problem, rank }: { problem: any; rank: number }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
          {rank}
        </span>
        <div className={`flex items-center ${
          problem.trend === 'up' ? 'text-green-600' : 
          problem.trend === 'down' ? 'text-red-600' : 'text-gray-600'
        }`}>
          {problem.trend === 'up' && <ArrowUpIcon className="w-3 h-3" />}
          {problem.trend === 'down' && <ArrowDownIcon className="w-3 h-3" />}
        </div>
      </div>
      <Link href={`/problems/${problem.id}`} className="block">
        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 hover:text-blue-600">
          {problem.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{problem.category}</span>
          <span>{problem.votes} voti</span>
        </div>
      </Link>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: any }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-900 mb-2">{recommendation.title}</h4>
      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
      <Link
        href={recommendation.href}
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        {recommendation.action} →
      </Link>
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}