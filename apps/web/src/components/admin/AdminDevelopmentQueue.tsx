'use client';

import { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

type QueuePriority = 'low' | 'medium' | 'high' | 'urgent';
type QueueStatus = 'queued' | 'in_progress' | 'completed' | 'blocked';

interface QueueItem {
  id: string;
  problem_id: string;
  priority: QueuePriority;
  queue_position: number;
  status: QueueStatus;
  estimated_hours?: number;
  estimated_completion?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  problem: {
    id: string;
    title: string;
    vote_count: number;
    proposer: {
      id: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
    };
  };
}

interface AdminDevelopmentQueueProps {
  onQueueUpdate?: () => void;
}

export function AdminDevelopmentQueue({ onQueueUpdate }: AdminDevelopmentQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    priority?: QueuePriority;
    status?: QueueStatus;
  }>({});

  useEffect(() => {
    fetchQueue();
  }, [filter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        adminView: 'true',
        limit: '50'
      });
      
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.status) params.append('status', filter.status);
      
      const response = await fetch(`/api/workflow/development-queue?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch development queue');
      }
      
      const data = await response.json();
      setQueue(data.queue || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const updateQueueItem = async (problemId: string, updates: Partial<QueueItem>) => {
    try {
      const response = await fetch('/api/workflow/development-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          ...updates
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update queue item');
      }
      
      await fetchQueue();
      onQueueUpdate?.();
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update queue item');
    }
  };

  const removeFromQueue = async (problemId: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo elemento dalla coda?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/workflow/development-queue?problemId=${problemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from queue');
      }
      
      await fetchQueue();
      onQueueUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from queue');
    }
  };

  const getPriorityColor = (priority: QueuePriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: QueueStatus) => {
    switch (status) {
      case 'queued': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
            Coda di Sviluppo ({queue.length})
          </h3>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filter.priority || ''}
              onChange={(e) => setFilter(prev => ({
                ...prev,
                priority: e.target.value as QueuePriority || undefined
              }))}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutte le priorità</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Bassa</option>
            </select>
            
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter(prev => ({
                ...prev,
                status: e.target.value as QueueStatus || undefined
              }))}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti gli stati</option>
              <option value="queued">In Coda</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="blocked">Bloccato</option>
            </select>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {queue.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun elemento in coda</h3>
            <p className="mt-1 text-sm text-gray-500">
              Non ci sono problemi attualmente nella coda di sviluppo.
            </p>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 text-sm text-gray-500">
                      #{item.queue_position}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.problem.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.problem.vote_count} voti
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.problem.category.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {item.estimated_hours && (
                    <p className="mt-2 text-xs text-gray-500">
                      Stima: {item.estimated_hours}h
                      {item.estimated_completion && (
                        <> • Completamento previsto: {new Date(item.estimated_completion).toLocaleDateString('it-IT')}</>
                      )}
                    </p>
                  )}
                  
                  {item.notes && (
                    <p className="mt-2 text-xs text-gray-600">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(`/problems/${item.problem_id}`, '_blank')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Visualizza problema"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Modifica"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => removeFromQueue(item.problem_id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Rimuovi dalla coda"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Edit Form */}
              {editingItem === item.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priorità</label>
                      <select
                        defaultValue={item.priority}
                        onChange={(e) => updateQueueItem(item.problem_id, { priority: e.target.value as QueuePriority })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="urgent">Urgente</option>
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Bassa</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stato</label>
                      <select
                        defaultValue={item.status}
                        onChange={(e) => updateQueueItem(item.problem_id, { status: e.target.value as QueueStatus })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="queued">In Coda</option>
                        <option value="in_progress">In Corso</option>
                        <option value="completed">Completato</option>
                        <option value="blocked">Bloccato</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ore Stimate</label>
                      <input
                        type="number"
                        defaultValue={item.estimated_hours || ''}
                        onChange={(e) => updateQueueItem(item.problem_id, { 
                          estimatedHours: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="1000"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Note</label>
                    <textarea
                      defaultValue={item.notes || ''}
                      onChange={(e) => updateQueueItem(item.problem_id, { notes: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      maxLength={500}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}