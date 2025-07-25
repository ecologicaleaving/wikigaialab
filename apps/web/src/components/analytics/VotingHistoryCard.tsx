'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { History, TrendingUp, Calendar, Award } from 'lucide-react';
import { useVotingHistory } from '../../hooks/useVoteAnalytics';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import Link from 'next/link';

interface VotingHistoryCardProps {
  showHeader?: boolean;
  maxItems?: number;
  className?: string;
}

export const VotingHistoryCard: React.FC<VotingHistoryCardProps> = ({
  showHeader = true,
  maxItems = 5,
  className = ''
}) => {
  const { data, isLoading, error } = useVotingHistory(1, maxItems);

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Impossibile caricare la cronologia voti</p>
        </div>
      </Card>
    );
  }

  const { votes, statistics } = data || { votes: [], statistics: null };

  return (
    <Card className={`p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Cronologia Voti
            </h3>
          </div>
          <Link href="/profile/voting-history">
            <Button variant="outline" size="sm">
              Vedi tutto
            </Button>
          </Link>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.totalVotes || 0}
          </div>
          <div className="text-xs text-gray-500">Voti Totali</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-lg mx-auto mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.votesThisMonth || 0}
          </div>
          <div className="text-xs text-gray-500">Questo Mese</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg mx-auto mb-2">
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {statistics?.categoriesVoted || 0}
          </div>
          <div className="text-xs text-gray-500">Categorie</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round((statistics?.avgVotesPerMonth || 0) * 10) / 10}
          </div>
          <div className="text-xs text-gray-500">Media/Mese</div>
        </div>
      </div>

      {/* Recent Votes */}
      <div className="space-y-3">
        {(votes || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nessun voto ancora registrato</p>
            <p className="text-sm">Inizia a votare sui problemi per vedere la tua cronologia</p>
          </div>
        ) : (
          (votes || []).map((vote) => (
            <div key={`${vote.problem.id}-${vote.created_at}`} 
                 className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/problems/${vote.problem.id}`} 
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1">
                  {vote.problem.title}
                </Link>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="bg-gray-200 px-2 py-1 rounded">
                    {vote.problem.category.name}
                  </span>
                  <span>•</span>
                  <span>{vote.problem.vote_count} voti</span>
                  <span>•</span>
                  <span>
                    {new Date(vote.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className={`px-2 py-1 text-xs rounded-full ${
                  vote.problem.status === 'Proposed' ? 'bg-yellow-100 text-yellow-700' :
                  vote.problem.status === 'In Development' ? 'bg-blue-100 text-blue-700' :
                  vote.problem.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {vote.problem.status}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {(votes || []).length > 0 && (statistics?.totalVotes || 0) > maxItems && (
        <div className="mt-4 text-center">
          <Link href="/profile/voting-history">
            <Button variant="outline" size="sm">
              Vedi tutti i {statistics?.totalVotes || 0} voti
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};