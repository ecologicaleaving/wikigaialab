'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';
import { useVotingHistory } from '../../hooks/useVotingHistory';
import { useRecommendations } from '../../hooks/useRecommendations';
import { VotingHistoryCard } from '../analytics/VotingHistoryCard';
import { AccessStatusCard } from '../premium/AccessStatusCard';
import { QuickVotePrompt } from '../premium/UpgradePrompts';
import RecommendationWidget from '../recommendations/RecommendationWidget';
import RelatedProblemsWidget from '../recommendations/RelatedProblemsWidget';
import { ReferralWidget } from '../growth/ReferralWidget';
import { CampaignWidget } from '../growth/CampaignWidget';
import { LeaderboardWidget } from '../growth/LeaderboardWidget';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Award, 
  Star,
  Vote,
  BarChart3,
  AppWindow,
  Settings,
  History,
  Check,
  Lock,
  Heart,
  Lightbulb,
  BookOpen,
  UserPlus,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: DashboardTab[] = [
  { id: 'overview', name: 'Panoramica', icon: BarChart3 },
  { id: 'recommendations', name: 'Raccomandazioni', icon: Heart },
  { id: 'voting', name: 'Cronologia Voti', icon: Vote },
  { id: 'growth', name: 'Crescita Community', icon: UserPlus },
  { id: 'problems', name: 'I Miei Problemi', icon: Users },
  { id: 'apps', name: 'Le Mie App', icon: AppWindow },
  { id: 'settings', name: 'Impostazioni', icon: Settings }
];

export function EnhancedUserDashboard() {
  const { user } = useAuth();
  const { accessData, loading: accessLoading } = usePremiumAccess();
  const { stats, loading: statsLoading } = useVotingHistory();
  const {
    personalRecommendations,
    trendingProblems,
    isLoading: recommendationsLoading,
    refreshRecommendations
  } = useRecommendations({ limit: 8 });
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const displayName = user.name || user.email || 'Utente';

  // Handle navigation to problems
  const handleProblemClick = (problemId: string) => {
    window.location.href = `/problems/${problemId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Il Mio Angolo di Laboratorio
                </h1>
                <p className="text-teal-700">
                  Ciao {displayName}, bentornato nel nostro laboratorio!
                </p>
              </div>
              
              {/* Access Level Badge */}
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
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'border-teal-500 text-teal-600 transform scale-105'
                        : 'border-transparent text-gray-500 hover:text-teal-700 hover:border-teal-300 hover:transform hover:scale-102'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab 
            user={user}
            accessData={accessData}
            stats={stats}
            loading={accessLoading || statsLoading}
            setActiveTab={setActiveTab}
            personalRecommendations={personalRecommendations}
            onProblemClick={handleProblemClick}
          />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab 
            onProblemClick={handleProblemClick}
          />
        )}
        
        {activeTab === 'voting' && <VotingHistoryTab />}
        {activeTab === 'growth' && <GrowthTab user={user} />}
        {activeTab === 'problems' && <ProblemsTab />}
        {activeTab === 'apps' && <AppsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  user, 
  accessData, 
  stats, 
  loading,
  setActiveTab,
  personalRecommendations,
  onProblemClick
}: { 
  user: any;
  accessData: any;
  stats: any;
  loading: boolean;
  setActiveTab: (tab: string) => void;
  personalRecommendations: any[];
  onProblemClick: (problemId: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Voti Totali"
            value={stats?.totalVotes || 0}
            icon={Vote}
            color="blue"
            subtitle="Tutti i tempi"
          />
          <StatsCard
            title="Voti Questa Settimana"
            value={stats?.votesThisWeek || 0}
            icon={TrendingUp}
            color="green"
            subtitle="Ultimi 7 giorni"
          />
          <StatsCard
            title="Serie di Voti"
            value={stats?.votingStreak || 0}
            icon={Award}
            color="purple"
            subtitle="Giorni consecutivi"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Attività Recente
          </h3>
          <RecentActivityList />
        </div>

        {/* Personal Recommendations Preview */}
        {personalRecommendations && personalRecommendations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-teal-600 animate-pulse" />
                Raccomandazioni per Te
              </h3>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors duration-200"
              >
                Vedi tutte
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalRecommendations.slice(0, 4).map((problem) => (
                <div
                  key={problem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => onProblemClick(problem.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                      {problem.category?.name || 'Categoria'}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Heart className="h-3 w-3 mr-1" />
                      {problem.vote_count}
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                    {problem.title}
                  </h4>
                  {problem.reasoning && (
                    <p className="text-xs text-teal-600">
                      Consigliato per i tuoi interessi
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Vota Problemi"
              description="Supporta le migliori proposte"
              href="/problems"
              icon={Vote}
              color="blue"
            />
            <ActionCard
              title="Raccomandazioni"
              description="Problemi per te"
              href="#"
              icon={Heart}
              color="purple"
              onClick={() => setActiveTab('recommendations')}
            />
            <ActionCard
              title="Proponi Soluzione"
              description="Condividi la tua idea"
              href="/problems/new"
              icon={Users}
              color="green"
            />
            <ActionCard
              title="Visualizza Cronologia"
              description="I tuoi voti e proposte"
              href="#"
              icon={History}
              color="orange"
              onClick={() => setActiveTab('voting')}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Access Status */}
        <AccessStatusCard />
        
        {/* Quick Vote Prompt */}
        <QuickVotePrompt compact />
        
        {/* Referral Widget */}
        <ReferralWidget userId={user.id} compact={true} />
        
        {/* Leaderboard Preview */}
        <LeaderboardWidget userId={user.id} compact={true} showControls={false} />
        
        {/* Profile Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Le Tue Statistiche
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Membro da</span>
              <span className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Categorie votate</span>
              <span className="font-medium">{stats?.categoriesVoted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Categoria preferita</span>
              <span className="font-medium">{stats?.favoriteCategory || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ultimo voto</span>
              <span className="font-medium">
                {stats?.lastVoteDate 
                  ? new Date(stats.lastVoteDate).toLocaleDateString('it-IT')
                  : 'Mai'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsTab({ onProblemClick }: { onProblemClick: (problemId: string) => void }) {
  return (
    <div className="space-y-8">
      {/* Personal Recommendations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-6 w-6 text-teal-600 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900">
            Raccomandazioni Personalizzate
          </h2>
        </div>
        <RecommendationWidget
          type="personal"
          title=""
          limit={12}
          showExplanations={true}
          onProblemClick={onProblemClick}
        />
      </div>

      {/* Trending Problems */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Problemi di Tendenza
          </h2>
        </div>
        <RecommendationWidget
          type="trending"
          title=""
          limit={8}
          showExplanations={false}
          onProblemClick={onProblemClick}
        />
      </div>

      {/* Recommendation Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personalizza le Raccomandazioni
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diversità delle raccomandazioni
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Simili ai miei interessi</option>
              <option>Mix di contenuti</option>
              <option>Molto vario</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso dei problemi trending
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Basso</option>
              <option>Medio</option>
              <option>Alto</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
            Salva Preferenze
          </button>
        </div>
      </div>
    </div>
  );
}

function VotingHistoryTab() {
  return (
    <div className="space-y-6">
      {/* Voting History with Analytics */}
      <VotingHistoryCard 
        showHeader={true}
        maxItems={20}
        className="bg-white"
      />
    </div>
  );
}

function GrowthTab({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="h-6 w-6 text-teal-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Crescita Community
          </h2>
        </div>
        <p className="text-gray-600">
          Invita amici, partecipa alle sfide e scala le classifiche della community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Referral System */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Sistema Inviti
            </h3>
            <ReferralWidget userId={user?.id} />
          </div>

          {/* Campaigns */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Campagne Attive
            </h3>
            <CampaignWidget userId={user?.id} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Leaderboards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Classifiche Community
            </h3>
            <LeaderboardWidget userId={user?.id} />
          </div>
        </div>
      </div>

      {/* Growth Tips */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-6 border border-teal-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-teal-600" />
          Consigli per la Crescita
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Porta Nuovi Utenti</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Condividi il tuo link di invito sui social</li>
              <li>• Invita amici interessati ai problemi della community</li>
              <li>• Spiega il valore di WikiGaiaLab</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Aumenta il Tuo Rank</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Vota regolarmente sui problemi</li>
              <li>• Proponi problemi di qualità</li>
              <li>• Partecipa alle campagne attive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder functions for other tabs
function ProblemsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">I Miei Problemi</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

function AppsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Le Mie App</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-teal-50 text-teal-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-teal-50 text-teal-600',
    orange: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function ActionCard({ title, description, href = '#', onClick, icon: Icon, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'bg-teal-500',
    green: 'bg-emerald-500',
    purple: 'bg-teal-500',
    orange: 'bg-amber-500',
  };

  const content = (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

function RecentActivityList() {
  // Placeholder for recent activity
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          Nessuna attività recente. Inizia votando o proponendo problemi!
        </p>
        <Link
          href="/problems"
          className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition-colors duration-200"
        >
          <Vote className="w-4 h-4" />
          Inizia a Votare
        </Link>
      </div>
    </div>
  );
}
