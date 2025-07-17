'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { RealtimeVoteButtonCompact } from '../ui/RealtimeVoteButton';
import { useRealtimeProblemsVotes } from '../../hooks/useRealtimeVotes';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Mock problem type - replace with your actual type
interface Problem {
  id: string;
  title: string;
  description: string;
  vote_count: number;
  status: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  proposer: {
    id: string;
    name: string;
  };
}

interface RealtimeProblemListProps {
  problems: Problem[];
  showConnectionStatus?: boolean;
  enableRealtime?: boolean;
  className?: string;
}

export const RealtimeProblemList: React.FC<RealtimeProblemListProps> = ({
  problems,
  showConnectionStatus = true,
  enableRealtime = true,
  className = ''
}) => {
  const problemIds = problems.map(p => p.id);
  
  // Real-time votes hook for all problems
  const {
    voteStates,
    isConnected,
    error,
    reconnect,
    getVoteCount
  } = useRealtimeProblemsVotes(problemIds, enableRealtime);

  // Track connection status changes for user feedback
  const [connectionToast, setConnectionToast] = useState<string | null>(null);

  useEffect(() => {
    if (error && enableRealtime) {
      setConnectionToast('Connessione real-time persa');
    } else if (isConnected && enableRealtime) {
      setConnectionToast(null);
    }
  }, [error, isConnected, enableRealtime]);

  // Connection status component
  const ConnectionStatus = () => {
    if (!showConnectionStatus || !enableRealtime) return null;

    return (
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">
                Aggiornamenti in tempo reale attivi
              </span>
            </>
          ) : error ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                Errore connessione real-time
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Connessione real-time in corso...
              </span>
            </>
          )}
        </div>
        
        {error && (
          <button
            onClick={reconnect}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          >
            Riconnetti
          </button>
        )}
      </div>
    );
  };

  // Get current vote count (real-time or fallback)
  const getCurrentVoteCount = (problem: Problem): number => {
    const realtimeCount = getVoteCount(problem.id);
    return realtimeCount !== undefined ? realtimeCount : problem.vote_count;
  };

  // Problem card component
  const ProblemCard = ({ problem }: { problem: Problem }) => {
    const currentVoteCount = getCurrentVoteCount(problem);
    const hasRealtimeUpdate = getVoteCount(problem.id) !== undefined;

    return (
      <Card className={`p-6 hover:shadow-lg transition-all duration-200 ${
        hasRealtimeUpdate ? 'ring-2 ring-blue-100' : ''
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/problems/${problem.id}`}
              className="block hover:text-blue-600 transition-colors"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {problem.title}
              </h3>
            </Link>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {problem.description}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {problem.category.name}
              </span>
              <span>•</span>
              <span>da {problem.proposer.name}</span>
              <span>•</span>
              <span>{new Date(problem.created_at).toLocaleDateString('it-IT')}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded text-xs ${
                problem.status === 'Proposed' ? 'bg-yellow-100 text-yellow-700' :
                problem.status === 'In Development' ? 'bg-blue-100 text-blue-700' :
                problem.status === 'Completed' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {problem.status}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <RealtimeVoteButtonCompact
              problemId={problem.id}
              initialVoteCount={problem.vote_count}
              className={hasRealtimeUpdate ? 'ring-2 ring-blue-200' : ''}
            />
          </div>
        </div>
        
        {/* Real-time indicator */}
        {hasRealtimeUpdate && (
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Aggiornato in tempo reale</span>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className={className}>
      <ConnectionStatus />
      
      <div className="space-y-4">
        {problems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun problema trovato
            </h3>
            <p className="text-gray-600">
              Inizia proponendo il primo problema della comunità!
            </p>
          </div>
        ) : (
          problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        )}
      </div>
      
      {/* Real-time statistics */}
      {enableRealtime && problems.length > 0 && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              Real-time: {Object.keys(voteStates).length} di {problems.length} problemi connessi
            </span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
              <span className="text-blue-600 text-xs">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};