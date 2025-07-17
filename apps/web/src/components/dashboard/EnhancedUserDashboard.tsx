'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { VotingHistoryCard } from '@/components/analytics/VotingHistoryCard';
import { AccessStatusCard } from '@/components/premium/AccessStatusCard';
import { QuickVotePrompt } from '@/components/premium/UpgradePrompts';
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
  Lock
} from 'lucide-react';
import Link from 'next/link';

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: DashboardTab[] = [
  { id: 'overview', name: 'Panoramica', icon: BarChart3 },
  { id: 'voting', name: 'Cronologia Voti', icon: Vote },
  { id: 'problems', name: 'I Miei Problemi', icon: Users },
  { id: 'apps', name: 'Le Mie App', icon: AppWindow },
  { id: 'settings', name: 'Impostazioni', icon: Settings }
];

export function EnhancedUserDashboard() {
  const { user } = useAuth();
  const { accessData, loading: accessLoading } = usePremiumAccess();
  const { stats, loading: statsLoading } = useVotingHistory();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const displayName = user.name || user.email || 'Utente';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Benvenuto, {displayName}!
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
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
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
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          />
        )}
        
        {activeTab === 'voting' && <VotingHistoryTab />}
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
  setActiveTab
}: { 
  user: any;
  accessData: any;
  stats: any;
  loading: boolean;
  setActiveTab: (tab: string) => void;
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              title="Vota Problemi"
              description="Supporta le migliori proposte"
              href="/problems"
              icon={Vote}
              color="blue"
            />
            <QuickActionCard
              title="Proponi Soluzione"
              description="Condividi la tua idea"
              href="/problems/new"
              icon={Users}
              color="green"
            />
            <QuickActionCard
              title="Esplora App"
              description="Scopri nuove app"
              href="/apps"
              icon={AppWindow}
              color="purple"
            />
            <QuickActionCard
              title="Visualizza Cronologia"
              description="I tuoi voti e proposte"
              href="#"
              icon={History}
              color="indigo"
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
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
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
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
          className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <Vote className="w-4 h-4" />
          Inizia a Votare
        </Link>
      </div>
    </div>
  );
}
