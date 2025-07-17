'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  FlagIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  TagIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
  proposer: {
    id: string;
    name: string;
    email: string;
    total_votes_cast: number;
    total_problems_proposed: number;
  };
  category: {
    id: string;
    name: string;
  };
}

interface ModerationAction {
  action: 'approve' | 'reject' | 'flag' | 'feature';
  reason?: string;
  notes?: string;
}

export function AdminProblemModeration() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [moderationAction, setModerationAction] = useState<ModerationAction | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'vote_count' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchProblems();
  }, [statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (highlightId && problems.length > 0) {
      const highlighted = problems.find(p => p.id === highlightId);
      if (highlighted) {
        setSelectedProblem(highlighted);
      }
    }
  }, [highlightId, problems]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        category: categoryFilter,
        sortBy,
        sortOrder,
        limit: '50'
      });

      const response = await fetch(`/api/admin/content/moderation?${params}`);
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

  const handleModerationAction = async (problemId: string, action: ModerationAction) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/content/problems/${problemId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });

      if (!response.ok) {
        throw new Error('Failed to process moderation action');
      }

      // Refresh problems list
      await fetchProblems();
      
      // Close modals
      setSelectedProblem(null);
      setModerationAction(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing action');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProblems = problems.filter(problem => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        problem.title.toLowerCase().includes(query) ||
        problem.description.toLowerCase().includes(query) ||
        problem.proposer.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      'Proposed': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'draft': 'bg-gray-100 text-gray-800',
      'implemented': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'flagged': 'bg-orange-100 text-orange-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'Proposed': 'In Attesa',
      'active': 'Attivo',
      'draft': 'Bozza',
      'implemented': 'Implementato',
      'rejected': 'Rifiutato',
      'flagged': 'Segnalato'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-300 rounded w-64 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderazione Problemi</h1>
          <p className="text-gray-600">Gestisci e modera i problemi proposti dalla community</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <FlagIcon className="w-4 h-4 mr-1" />
            {filteredProblems.filter(p => p.status === 'Proposed').length} in attesa
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca problemi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="Proposed">In Attesa</option>
            <option value="active">Attivi</option>
            <option value="draft">Bozze</option>
            <option value="implemented">Implementati</option>
            <option value="rejected">Rifiutati</option>
            <option value="flagged">Segnalati</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutte le categorie</option>
            {/* Categories will be populated dynamically */}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at-desc">Più recenti</option>
            <option value="created_at-asc">Più vecchi</option>
            <option value="vote_count-desc">Più voti</option>
            <option value="updated_at-desc">Aggiornati di recente</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Problems List */}
      <div className="space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun problema trovato
            </h3>
            <p className="text-gray-600">
              Non ci sono problemi che corrispondono ai filtri selezionati.
            </p>
          </div>
        ) : (
          filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                highlightId === problem.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
                      {problem.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(problem.status)}`}>
                      {getStatusLabel(problem.status)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {problem.category.name}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {problem.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span>{problem.proposer.name}</span>
                      <span className="text-xs">({problem.proposer.total_problems_proposed} problemi proposti)</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>{problem.vote_count} voti</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <time dateTime={problem.created_at}>
                        {formatDistanceToNow(new Date(problem.created_at), { 
                          addSuffix: true,
                          locale: it 
                        })}
                      </time>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setSelectedProblem(problem)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Dettagli
                  </button>

                  {problem.status === 'Proposed' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedProblem(problem);
                          setModerationAction({ action: 'approve' });
                        }}
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                      >
                        <CheckIcon className="w-4 h-4 mr-1" />
                        Approva
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProblem(problem);
                          setModerationAction({ action: 'reject' });
                        }}
                        className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                      >
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Rifiuta
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <ProblemDetailModal
          problem={selectedProblem}
          onClose={() => setSelectedProblem(null)}
          onModerationAction={(action) => {
            setModerationAction(action);
          }}
        />
      )}

      {/* Moderation Action Modal */}
      {moderationAction && selectedProblem && (
        <ModerationActionModal
          problem={selectedProblem}
          action={moderationAction}
          onConfirm={(action) => handleModerationAction(selectedProblem.id, action)}
          onCancel={() => setModerationAction(null)}
          processing={processing}
        />
      )}
    </div>
  );
}

// Problem Detail Modal Component
interface ProblemDetailModalProps {
  problem: Problem;
  onClose: () => void;
  onModerationAction: (action: ModerationAction) => void;
}

function ProblemDetailModal({ problem, onClose, onModerationAction }: ProblemDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Dettagli Problema</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Problem Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{problem.title}</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{problem.description}</p>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informazioni Problema</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stato:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(problem.status)}`}>
                      {getStatusLabel(problem.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categoria:</span>
                    <span>{problem.category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Voti:</span>
                    <span>{problem.vote_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creato:</span>
                    <span>{new Date(problem.created_at).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Proponente</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nome:</span>
                    <span>{problem.proposer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span>{problem.proposer.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Problemi proposti:</span>
                    <span>{problem.proposer.total_problems_proposed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Voti espressi:</span>
                    <span>{problem.proposer.total_votes_cast}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {problem.status === 'Proposed' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onModerationAction({ action: 'approve' })}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Approva Problema
                </button>
                <button
                  onClick={() => onModerationAction({ action: 'reject' })}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Rifiuta Problema
                </button>
                <button
                  onClick={() => onModerationAction({ action: 'flag' })}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
                >
                  <FlagIcon className="w-4 h-4 mr-2" />
                  Segnala
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function getStatusBadge(status: string) {
    const styles = {
      'Proposed': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'draft': 'bg-gray-100 text-gray-800',
      'implemented': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'flagged': 'bg-orange-100 text-orange-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  function getStatusLabel(status: string) {
    const labels = {
      'Proposed': 'In Attesa',
      'active': 'Attivo',
      'draft': 'Bozza',
      'implemented': 'Implementato',
      'rejected': 'Rifiutato',
      'flagged': 'Segnalato'
    };
    return labels[status] || status;
  }
}

// Moderation Action Modal Component
interface ModerationActionModalProps {
  problem: Problem;
  action: ModerationAction;
  onConfirm: (action: ModerationAction) => void;
  onCancel: () => void;
  processing: boolean;
}

function ModerationActionModal({ problem, action, onConfirm, onCancel, processing }: ModerationActionModalProps) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const actionLabels = {
    approve: 'Approva',
    reject: 'Rifiuta',
    flag: 'Segnala',
    feature: 'Metti in evidenza'
  };

  const actionColors = {
    approve: 'bg-green-600 hover:bg-green-700',
    reject: 'bg-red-600 hover:bg-red-700',
    flag: 'bg-orange-600 hover:bg-orange-700',
    feature: 'bg-blue-600 hover:bg-blue-700'
  };

  const handleConfirm = () => {
    onConfirm({
      ...action,
      reason: reason || undefined,
      notes: notes || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Conferma Azione: {actionLabels[action.action]}
          </h3>

          <p className="text-gray-600 mb-4">
            Stai per {actionLabels[action.action].toLowerCase()} il problema "{problem.title}".
          </p>

          {(action.action === 'reject' || action.action === 'flag') && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo {action.action === 'reject' ? 'rifiuto' : 'segnalazione'}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Inserisci il motivo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note aggiuntive (opzionale)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Note per il proponente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing || (action.action !== 'approve' && action.action !== 'feature' && !reason)}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${actionColors[action.action]}`}
            >
              {processing ? 'Elaborazione...' : actionLabels[action.action]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}