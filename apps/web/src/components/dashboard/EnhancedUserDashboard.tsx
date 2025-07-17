'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVotingHistory } from '@/hooks/useVotingHistory';
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
  const { history, stats, loading, error } = useVotingHistory();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Errore nel caricamento della cronologia: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter(item => 
    !selectedCategory || item.problem.category === selectedCategory
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.voted_at).getTime() - new Date(a.voted_at).getTime();
    } else {
      return a.problem.category.localeCompare(b.problem.category);
    }
  });

  const categories = Array.from(new Set(history.map(item => item.problem.category)));

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Voti Totali</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalVotes || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Questa Settimana</p>
          <p className="text-2xl font-bold text-green-600">{stats?.votesThisWeek || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Serie Attuale</p>
          <p className="text-2xl font-bold text-purple-600">{stats?.votingStreak || 0} giorni</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Categorie</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.categoriesVoted || 0}</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Cronologia Voti ({filteredHistory.length})
          </h3>
          
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutte le categorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'category')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Ordina per data</option>
              <option value="category">Ordina per categoria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voting History Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {sortedHistory.length === 0 ? (
          <div className="text-center py-12">
            <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCategory ? 'Nessun voto in questa categoria' : 'Nessun voto ancora'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCategory 
                ? 'Prova a selezionare una categoria diversa o rimuovi il filtro.'
                : 'Inizia a votare i problemi per vedere la tua cronologia qui!'
              }
            </p>
            {!selectedCategory && (
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Vote className="w-4 h-4" />
                Inizia a Votare
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/problems/${item.problem.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                          >
                            {item.problem.title}
                          </Link>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {item.problem.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.problem.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.vote_type === 'up' ? (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Supporto</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                            <span className="text-sm font-medium">Contrario</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p>{new Date(item.voted_at).toLocaleDateString('it-IT')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.voted_at).toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.problem.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : item.problem.status === 'implemented'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.problem.status === 'active' && 'Attivo'}
                        {item.problem.status === 'implemented' && 'Implementato'}
                        {item.problem.status === 'closed' && 'Chiuso'}
                        {item.problem.status === 'draft' && 'Bozza'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {sortedHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Azioni Rapide</h4>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Vote className="w-4 h-4" />
              Vota Altri Problemi
            </Link>
            <Link
              href="/problems/new"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Proponi Problema
            </Link>
            {stats?.favoriteCategory && (
              <Link
                href={`/problems?category=${encodeURIComponent(stats.favoriteCategory)}`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Star className="w-4 h-4" />
                Categoria Preferita: {stats.favoriteCategory}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemsTab() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserProblems();
    }
  }, [user]);

  const fetchUserProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/problems');
      if (!response.ok) {
        throw new Error('Failed to fetch problems');
      }
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading problems');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Errore nel caricamento: {error}</p>
          <button 
            onClick={fetchUserProblems} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const filteredProblems = problems.filter(problem => 
    !selectedStatus || problem.status === selectedStatus
  );

  const statusCounts = problems.reduce((acc, problem) => {
    acc[problem.status] = (acc[problem.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'implemented': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'draft': return 'Bozza';
      case 'implemented': return 'Implementato';
      case 'closed': return 'Chiuso';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Totale Problemi</p>
          <p className="text-2xl font-bold text-gray-900">{problems.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Attivi</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Implementati</p>
          <p className="text-2xl font-bold text-blue-600">{statusCounts.implemented || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Bozze</p>
          <p className="text-2xl font-bold text-gray-600">{statusCounts.draft || 0}</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            I Miei Problemi ({filteredProblems.length})
          </h3>
          
          <div className="flex gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti gli stati</option>
              <option value="active">Attivi</option>
              <option value="draft">Bozze</option>
              <option value="implemented">Implementati</option>
              <option value="closed">Chiusi</option>
            </select>
            
            <Link
              href="/problems/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Nuovo Problema
            </Link>
          </div>
        </div>
      </div>

      {/* Problems List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus ? 'Nessun problema con questo stato' : 'Nessun problema proposto'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedStatus 
                ? 'Prova a selezionare uno stato diverso o rimuovi il filtro.'
                : 'Inizia proponendo un problema per la comunità!'
              }
            </p>
            {!selectedStatus && (
              <Link
                href="/problems/new"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Users className="w-4 h-4" />
                Proponi Problema
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Link 
                        href={`/problems/${problem.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {problem.title}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                        {getStatusLabel(problem.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {problem.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Vote className="w-4 h-4" />
                        {problem.vote_count || 0} voti
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(problem.created_at).toLocaleDateString('it-IT')}
                      </span>
                      {problem.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {problem.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={`/problems/${problem.id}/edit`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {filteredProblems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Azioni Rapide</h4>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/problems/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Proponi Nuovo Problema
            </Link>
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Vote className="w-4 h-4" />
              Vota Altri Problemi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function AppsTab() {
  const { user } = useAuth();
  const { accessData } = usePremiumAccess();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccessModel, setSelectedAccessModel] = useState<string>('');

  useEffect(() => {
    fetchUserApps();
  }, []);

  const fetchUserApps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apps?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const data = await response.json();
      setApps(data.apps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading apps');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Errore nel caricamento: {error}</p>
          <button 
            onClick={fetchUserApps} 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const filteredApps = apps.filter(app => 
    !selectedAccessModel || app.access_model === selectedAccessModel
  );

  const userCanAccessPremium = accessData?.canAccessPremium || false;
  const accessibleApps = filteredApps.filter(app => 
    app.access_model === 'freemium' || userCanAccessPremium
  );
  const lockedApps = filteredApps.filter(app => 
    app.access_model !== 'freemium' && !userCanAccessPremium
  );

  const getAccessModelColor = (model: string) => {
    switch (model) {
      case 'freemium': return 'bg-green-100 text-green-800';
      case 'subscription': return 'bg-blue-100 text-blue-800';
      case 'one-time': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessModelLabel = (model: string) => {
    switch (model) {
      case 'freemium': return 'Freemium';
      case 'subscription': return 'Abbonamento';
      case 'one-time': return 'Acquisto unico';
      default: return model;
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">App Totali</p>
          <p className="text-2xl font-bold text-gray-900">{apps.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Accessibili</p>
          <p className="text-2xl font-bold text-green-600">{accessibleApps.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Premium Bloccate</p>
          <p className="text-2xl font-bold text-orange-600">{lockedApps.length}</p>
        </div>
      </div>

      {/* Access Status */}
      {accessData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Il Tuo Accesso: {accessData.currentLevel.name}
              </h3>
              <p className="text-gray-600">
                {userCanAccessPremium 
                  ? 'Hai accesso completo a tutte le app premium!'
                  : `Vota ${accessData.votesNeeded} problemi per sbloccare le app premium`
                }
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{accessData.totalVotes}</p>
              <p className="text-sm text-gray-500">voti espressi</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestione App ({filteredApps.length})
          </h3>
          
          <div className="flex gap-3">
            <select
              value={selectedAccessModel}
              onChange={(e) => setSelectedAccessModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti i modelli</option>
              <option value="freemium">Freemium</option>
              <option value="subscription">Abbonamento</option>
              <option value="one-time">Acquisto unico</option>
            </select>
            
            <Link
              href="/apps"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Esplora App
            </Link>
          </div>
        </div>
      </div>

      {/* Apps List */}
      <div className="space-y-4">
        {/* Accessible Apps */}
        {accessibleApps.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-3 border-b border-green-200">
              <h4 className="font-medium text-green-800">
                App Accessibili ({accessibleApps.length})
              </h4>
            </div>
            <div className="divide-y divide-gray-200">
              {accessibleApps.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link 
                            href={`/apps/${app.slug}`}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600"
                          >
                            {app.name}
                          </Link>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessModelColor(app.access_model)}`}>
                            {getAccessModelLabel(app.access_model)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Accessibile
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {app.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Versione {app.version}</span>
                          <span>{app.base_features?.length || 0} funzionalità base</span>
                          {app.premium_features?.length > 0 && (
                            <span>{app.premium_features.length} funzionalità premium</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Apri App
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Apps */}
        {lockedApps.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-3 border-b border-orange-200">
              <h4 className="font-medium text-orange-800">
                App Premium Bloccate ({lockedApps.length})
              </h4>
            </div>
            <div className="divide-y divide-gray-200">
              {lockedApps.map((app) => (
                <div key={app.id} className="p-6 hover:bg-gray-50 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gray-400 flex items-center justify-center flex-shrink-0 relative">
                        <span className="text-white font-bold text-lg">
                          {app.name.charAt(0)}
                        </span>
                        <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-gray-600 bg-white rounded-full p-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-600">
                            {app.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessModelColor(app.access_model)}`}>
                            {getAccessModelLabel(app.access_model)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Premium
                          </span>
                        </div>
                        
                        <p className="text-gray-500 mb-3 line-clamp-2">
                          {app.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Versione {app.version}</span>
                          <span>{app.premium_features?.length || 0} funzionalità premium</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                      >
                        Dettagli
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredApps.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AppWindow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna app trovata
            </h3>
            <p className="text-gray-600 mb-4">
              Non ci sono app disponibili con i filtri selezionati.
            </p>
            <Link
              href="/apps"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <AppWindow className="w-4 h-4" />
              Esplora Tutte le App
            </Link>
          </div>
        )}
      </div>

      {/* Unlock Premium CTA */}
      {!userCanAccessPremium && lockedApps.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Sblocca {lockedApps.length} App Premium
              </h3>
              <p className="text-blue-100">
                Vota {accessData?.votesNeeded || 5} problemi per accedere a tutte le funzionalità premium
              </p>
            </div>
            <Link
              href="/problems"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              Inizia a Votare
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    publicProfile: true,
    weeklyDigest: false,
    voteReminders: true,
    languagePreference: 'it',
    themePreference: 'light'
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSettingChange = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    await saveSettings({ ...settings, [key]: value });
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      setSaveStatus('saving');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.')) {
      return;
    }
    
    const confirmation = prompt('Scrivi "ELIMINA" per confermare la cancellazione del tuo account:');
    if (confirmation !== 'ELIMINA') {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/delete', {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      
      // Redirect to home or show success message
      window.location.href = '/';
    } catch (error) {
      alert('Errore durante la cancellazione dell\'account. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Informazioni Profilo
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <button className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                Modifica
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              L'email è utilizzata per l'accesso e le notifiche
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Display
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={user?.name || ''}
                placeholder="Inserisci il tuo nome"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Salva
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Notifiche
        </h3>
        
        <div className="space-y-4">
          <SettingToggle
            title="Notifiche Email"
            description="Ricevi notifiche sui nuovi problemi e aggiornamenti"
            checked={settings.emailNotifications}
            onChange={(checked) => handleSettingChange('emailNotifications', checked)}
          />
          
          <SettingToggle
            title="Promemoria Voti"
            description="Ricevi promemoria per votare nuovi problemi"
            checked={settings.voteReminders}
            onChange={(checked) => handleSettingChange('voteReminders', checked)}
          />
          
          <SettingToggle
            title="Digest Settimanale"
            description="Ricevi un riassunto settimanale dell'attività"
            checked={settings.weeklyDigest}
            onChange={(checked) => handleSettingChange('weeklyDigest', checked)}
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Privacy
        </h3>
        
        <div className="space-y-4">
          <SettingToggle
            title="Profilo Pubblico"
            description="Rendi visibile il tuo profilo agli altri utenti"
            checked={settings.publicProfile}
            onChange={(checked) => handleSettingChange('publicProfile', checked)}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Preferenze
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lingua
            </label>
            <select
              value={settings.languagePreference}
              onChange={(e) => handleSettingChange('languagePreference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema
            </label>
            <select
              value={settings.themePreference}
              onChange={(e) => handleSettingChange('themePreference', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
              <option value="auto">Automatico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`px-4 py-3 rounded-lg ${
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          saveStatus === 'saved' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {saveStatus === 'saving' && 'Salvataggio in corso...'}
          {saveStatus === 'saved' && 'Impostazioni salvate con successo!'}
          {saveStatus === 'error' && 'Errore nel salvataggio. Riprova più tardi.'}
        </div>
      )}

      {/* Account Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Azioni Account
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Esporta Dati
              </h4>
              <p className="text-sm text-gray-500">
                Scarica una copia di tutti i tuoi dati
              </p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Esporta
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Cambia Password
              </h4>
              <p className="text-sm text-gray-500">
                Aggiorna la password del tuo account
              </p>
            </div>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Cambia
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-6">
          Zona Pericolosa
        </h3>
        
        <div className="border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-red-800">
                Elimina Account
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Questa azione eliminerà permanentemente il tuo account, tutti i problemi proposti, 
                i voti espressi e tutti i dati associati. Questa azione non può essere annullata.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Eliminazione...' : 'Elimina Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingToggle({ title, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-medium text-gray-900">
          {title}
        </h4>
        <p className="text-sm text-gray-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
        />
      </button>
    </div>
  );
}

// Supporting Components
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'indigo';
  subtitle?: string;
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600', 
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
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

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'indigo';
  onClick?: () => void;
}

function QuickActionCard({ title, description, href, icon: Icon, color, onClick }: QuickActionCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600'
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