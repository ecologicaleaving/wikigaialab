'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  UserIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface WorkflowLogEntry {
  id: string;
  problem_id: string;
  previous_status: string;
  new_status: string;
  trigger_type: string;
  triggered_by?: string;
  vote_count_at_change: number;
  reason?: string;
  created_at: string;
  triggered_by_user?: {
    id: string;
    name: string;
  };
  problem?: {
    id: string;
    title: string;
    proposer: {
      id: string;
      name: string;
    };
  };
}

export function AdminWorkflowHistory() {
  const [logs, setLogs] = useState<WorkflowLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<{
    triggerType?: string;
    problemId?: string;
  }>({});

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (filter.triggerType) params.append('triggerType', filter.triggerType);
      if (filter.problemId) params.append('problemId', filter.problemId);
      
      const response = await fetch(`/api/admin/workflow/logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow logs');
      }
      
      const data = await response.json();
      
      if (page === 1) {
        setLogs(data.logs || []);
      } else {
        setLogs(prev => [...prev, ...(data.logs || [])]);
      }
      
      setHasMore(data.pagination?.hasNextPage || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow logs');
    } finally {
      setLoading(false);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'milestone_triggered': return 'Soglia Voti Raggiunta';
      case 'admin_override': return 'Intervento Amministratore';
      case 'queue_added': return 'Aggiunto alla Coda';
      case 'queue_updated': return 'Coda Aggiornata';
      case 'queue_removed': return 'Rimosso dalla Coda';
      default: return type;
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case 'milestone_triggered': return 'bg-blue-100 text-blue-800';
      case 'admin_override': return 'bg-purple-100 text-purple-800';
      case 'queue_added': return 'bg-green-100 text-green-800';
      case 'queue_updated': return 'bg-yellow-100 text-yellow-800';
      case 'queue_removed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proposed': return 'text-gray-600';
      case 'Under Review': return 'text-yellow-600';
      case 'Priority Queue': return 'text-orange-600';
      case 'In Development': return 'text-blue-600';
      case 'Completed': return 'text-green-600';
      case 'Rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Cronologia Workflow
          </h3>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filter.triggerType || ''}
              onChange={(e) => {
                setFilter(prev => ({
                  ...prev,
                  triggerType: e.target.value || undefined
                }));
                setPage(1);
              }}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti i trigger</option>
              <option value="milestone_triggered">Soglia Voti</option>
              <option value="admin_override">Intervento Admin</option>
              <option value="queue_added">Aggiunto Coda</option>
              <option value="queue_updated">Coda Aggiornata</option>
              <option value="queue_removed">Rimosso Coda</option>
            </select>
            
            <input
              type="text"
              placeholder="ID Problema..."
              value={filter.problemId || ''}
              onChange={(e) => {
                setFilter(prev => ({
                  ...prev,
                  problemId: e.target.value || undefined
                }));
                setPage(1);
              }}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {logs.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun log disponibile</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono ancora cambiamenti di stato registrati.
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTriggerTypeColor(log.trigger_type)}`}>
                      {getTriggerTypeLabel(log.trigger_type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('it-IT')}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    {log.problem && (
                      <p className="text-sm font-medium text-gray-900">
                        {log.problem.title}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-sm ${getStatusColor(log.previous_status)}`}>
                        {log.previous_status}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={`text-sm font-medium ${getStatusColor(log.new_status)}`}>
                        {log.new_status}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({log.vote_count_at_change} voti)
                      </span>
                    </div>
                    
                    {log.triggered_by_user && (
                      <div className="flex items-center space-x-1 mt-1">
                        <UserIcon className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          Modificato da: {log.triggered_by_user.name}
                        </span>
                      </div>
                    )}
                    
                    {log.reason && (
                      <p className="text-xs text-gray-600 mt-1">
                        Motivo: {log.reason}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`/problems/${log.problem_id}`, '_blank')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Visualizza problema"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <CogIcon className="animate-spin h-4 w-4 mr-2" />
                Caricamento...
              </>
            ) : (
              'Carica Altri'
            )}
          </button>
        </div>
      )}
    </div>
  );
}