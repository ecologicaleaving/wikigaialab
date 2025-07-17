'use client';

import { useState, useEffect } from 'react';
import { 
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { AdminWorkflowStats } from '@/components/admin/AdminWorkflowStats';
import { AdminDevelopmentQueue } from '@/components/admin/AdminDevelopmentQueue';
import { AdminWorkflowHistory } from '@/components/admin/AdminWorkflowHistory';
import { AdminStatusOverride } from '@/components/admin/AdminStatusOverride';

interface WorkflowStats {
  totalProblems: number;
  byStatus: {
    'Proposed': number;
    'Under Review': number;
    'Priority Queue': number;
    'In Development': number;
    'Completed': number;
    'Rejected': number;
  };
  developmentQueue: {
    total: number;
    byPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  recentChanges: number;
}

export default function AdminWorkflowPage() {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'history' | 'override'>('overview');

  useEffect(() => {
    fetchWorkflowStats();
  }, []);

  const fetchWorkflowStats = async () => {
    try {
      setLoading(true);
      
      // Fetch workflow statistics
      const [statsResponse, queueResponse] = await Promise.all([
        fetch('/api/admin/workflow/stats'),
        fetch('/api/workflow/development-queue?adminView=true')
      ]);

      if (!statsResponse.ok || !queueResponse.ok) {
        throw new Error('Failed to fetch workflow data');
      }

      const [statsData, queueData] = await Promise.all([
        statsResponse.json(),
        queueResponse.json()
      ]);

      setStats({
        ...statsData,
        developmentQueue: queueData.statistics
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          <strong>Errore:</strong> {error}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Panoramica', icon: EyeIcon },
    { id: 'queue', name: 'Coda Sviluppo', icon: ClockIcon },
    { id: 'history', name: 'Cronologia', icon: CheckCircleIcon },
    { id: 'override', name: 'Gestione Stato', icon: PlayIcon }
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Workflow</h1>
        <p className="mt-2 text-sm text-gray-700">
          Gestisci il flusso di lavoro automatico dei problemi e la coda di sviluppo
        </p>
      </div>

      {/* Statistics Overview */}
      {stats && <AdminWorkflowStats stats={stats} />}

      {/* Navigation Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Distribution Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Distribuzione per Stato
              </h3>
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(stats.byStatus).map(([status, count]) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'Proposed': return 'bg-gray-100 text-gray-800';
                        case 'Under Review': return 'bg-yellow-100 text-yellow-800';
                        case 'Priority Queue': return 'bg-orange-100 text-orange-800';
                        case 'In Development': return 'bg-blue-100 text-blue-800';
                        case 'Completed': return 'bg-green-100 text-green-800';
                        case 'Rejected': return 'bg-red-100 text-red-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };

                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Azioni Rapide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('queue')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Gestisci Coda
                </button>
                <button
                  onClick={() => setActiveTab('override')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Cambia Stato
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Vedi Cronologia
                </button>
                <button
                  onClick={() => window.open('/admin', '_blank')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <EyeIcon className="h-5 w-5 mr-2" />
                  Dashboard Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <AdminDevelopmentQueue onQueueUpdate={fetchWorkflowStats} />
        )}

        {activeTab === 'history' && (
          <AdminWorkflowHistory />
        )}

        {activeTab === 'override' && (
          <AdminStatusOverride onStatusChange={fetchWorkflowStats} />
        )}
      </div>
    </div>
  );
}