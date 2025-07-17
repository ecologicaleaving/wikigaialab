'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

type ProblemStatus = 'Proposed' | 'Under Review' | 'Priority Queue' | 'In Development' | 'Completed' | 'Rejected';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  vote_count: number;
  created_at: string;
  proposer: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface AdminStatusOverrideProps {
  onStatusChange?: () => void;
}

export function AdminStatusOverride({ onStatusChange }: AdminStatusOverrideProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [newStatus, setNewStatus] = useState<ProblemStatus>('Proposed');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions: { value: ProblemStatus; label: string; color: string }[] = [
    { value: 'Proposed', label: 'Proposto', color: 'text-gray-600' },
    { value: 'Under Review', label: 'In Revisione', color: 'text-yellow-600' },
    { value: 'Priority Queue', label: 'Coda Priorità', color: 'text-orange-600' },
    { value: 'In Development', label: 'In Sviluppo', color: 'text-blue-600' },
    { value: 'Completed', label: 'Completato', color: 'text-green-600' },
    { value: 'Rejected', label: 'Rifiutato', color: 'text-red-600' }
  ];

  const validTransitions: Record<ProblemStatus, ProblemStatus[]> = {
    'Proposed': ['Under Review', 'Rejected'],
    'Under Review': ['Priority Queue', 'Rejected'],
    'Priority Queue': ['In Development', 'Rejected'],
    'In Development': ['Completed', 'Rejected'],
    'Completed': [],
    'Rejected': []
  };

  const searchProblems = async () => {
    if (!searchTerm.trim()) {
      setProblems([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/problems?search=${encodeURIComponent(searchTerm)}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to search problems');
      }
      
      const data = await response.json();
      setProblems(data.problems || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search problems');
    } finally {
      setLoading(false);
    }
  };

  const updateProblemStatus = async () => {
    if (!selectedProblem || !reason.trim()) {
      setError('Seleziona un problema e fornisci un motivo per il cambio di stato');
      return;
    }
    
    try {
      setUpdating(true);
      setError(null);
      
      const response = await fetch('/api/workflow/status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem.id,
          newVoteCount: selectedProblem.vote_count,
          adminOverride: true,
          targetStatus: newStatus,
          reason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update problem status');
      }
      
      const result = await response.json();
      
      // Update the problem in the list
      setProblems(prev => prev.map(p => 
        p.id === selectedProblem.id 
          ? { ...p, status: newStatus }
          : p
      ));
      
      // Reset form
      setSelectedProblem(null);
      setReason('');
      setNewStatus('Proposed');
      
      // Notify parent of change
      onStatusChange?.();
      
      alert('Stato del problema aggiornato con successo!');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update problem status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status: ProblemStatus) => {
    switch (status) {
      case 'Proposed': return <PauseIcon className="h-4 w-4" />;
      case 'Under Review': return <MagnifyingGlassIcon className="h-4 w-4" />;
      case 'Priority Queue': return <PlayIcon className="h-4 w-4" />;
      case 'In Development': return <PlayIcon className="h-4 w-4" />;
      case 'Completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'Rejected': return <XCircleIcon className="h-4 w-4" />;
      default: return <PauseIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProblemStatus) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || 'text-gray-600';
  };

  const getAvailableTransitions = (currentStatus: ProblemStatus) => {
    return statusOptions.filter(option => 
      validTransitions[currentStatus].includes(option.value)
    );
  };

  useEffect(() => {
    if (selectedProblem) {
      const availableTransitions = getAvailableTransitions(selectedProblem.status);
      if (availableTransitions.length > 0) {
        setNewStatus(availableTransitions[0].value);
      }
    }
  }, [selectedProblem]);

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Cerca Problema
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchProblems()}
              placeholder="Cerca per titolo o descrizione..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={searchProblems}
            disabled={loading || !searchTerm.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            {loading ? 'Ricerca...' : 'Cerca'}
          </button>
        </div>
        
        {/* Search Results */}
        {problems.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-md divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {problems.map((problem) => (
              <div
                key={problem.id}
                onClick={() => setSelectedProblem(problem)}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedProblem?.id === problem.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {problem.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`flex items-center space-x-1 ${getStatusColor(problem.status)}`}>
                        {getStatusIcon(problem.status)}
                        <span className="text-xs">{problem.status}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {problem.vote_count} voti
                      </span>
                      <span className="text-xs text-gray-500">
                        {problem.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status Change Section */}
      {selectedProblem && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cambia Stato Problema
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problema Selezionato
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {selectedProblem.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`flex items-center space-x-1 ${getStatusColor(selectedProblem.status)}`}>
                    {getStatusIcon(selectedProblem.status)}
                    <span className="text-xs">Stato Attuale: {selectedProblem.status}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedProblem.vote_count} voti
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuovo Stato
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ProblemStatus)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {getAvailableTransitions(selectedProblem.status).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {getAvailableTransitions(selectedProblem.status).length === 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Nessuna transizione di stato disponibile per lo stato attuale.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo del Cambiamento *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Spiega il motivo del cambiamento di stato..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                maxLength={500}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {reason.length}/500 caratteri
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-4">
              <button
                onClick={updateProblemStatus}
                disabled={updating || !reason.trim() || getAvailableTransitions(selectedProblem.status).length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating ? 'Aggiornamento...' : 'Aggiorna Stato'}
              </button>
              
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  setReason('');
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}