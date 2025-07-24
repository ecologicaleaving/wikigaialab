'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Users, Clock, ArrowRight } from 'lucide-react';
import { Card } from '../ui/card';
import { VoteButton } from '../ui/vote-button';

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

interface ArtisanalProblemCardProps {
  problem: Problem;
  hasVoted?: boolean;
  onVote?: (problemId: string) => void;
  isVoting?: boolean;
  showRealtimeIndicator?: boolean;
  className?: string;
}

export const ArtisanalProblemCard: React.FC<ArtisanalProblemCardProps> = ({
  problem,
  hasVoted = false,
  onVote,
  isVoting = false,
  showRealtimeIndicator = false,
  className = ''
}) => {
  const handleVote = () => {
    if (onVote) {
      onVote(problem.id);
    }
  };

  // Workshop-style progress calculation
  const getWorkshopProgress = (voteCount: number): number => {
    return Math.min((voteCount / 100) * 100, 100);
  };

  // Artisanal workshop status messaging
  const getWorkshopStatus = (voteCount: number, status: string): string => {
    if (status === 'in_development') return '🔨 Il maestro è al lavoro';
    if (status === 'completed') return '✨ Attrezzo completato';
    if (voteCount >= 100) return '🎉 Pronti per iniziare!';
    if (voteCount >= 75) return `🔥 Quasi pronti! Mancano ${100 - voteCount}`;
    if (voteCount >= 50) return '💪 La comunità si sta formando';
    if (voteCount >= 25) return '🌱 Sta crescendo interesse';
    return '👋 Cerca il primo sostegno';
  };

  // Time formatting for Italian workshop feel
  const formatWorkshopTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Raccontato poco fa';
    if (diffInHours < 24) return `Raccontato ${diffInHours}h fa`;
    if (diffInHours < 48) return 'Raccontato ieri';
    const days = Math.floor(diffInHours / 24);
    return `Raccontato ${days} giorni fa`;
  };

  const progress = getWorkshopProgress(problem.vote_count);
  const workshopStatus = getWorkshopStatus(problem.vote_count, problem.status);

  return (
    <Card className={`group overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border-orange-100 hover:border-orange-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      {/* Realtime indicator */}
      {showRealtimeIndicator && (
        <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm" />
      )}

      <div className="p-6">
        {/* Workshop category badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <span>{problem.category.icon || '🏷️'}</span>
            <span>{problem.category.name}</span>
          </div>
          
          {/* Workshop status */}
          <div className="text-sm text-orange-600 font-medium">
            {workshopStatus}
          </div>
        </div>

        {/* Story title - artisanal approach */}
        <Link 
          href={`/problems/${problem.id}`}
          className="block group-hover:text-orange-700 transition-colors"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 leading-snug">
            {problem.title}
          </h3>
        </Link>

        {/* Story preview */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {problem.description}
        </p>

        {/* Community progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Sostegno della comunità</span>
            <span className="text-orange-600 font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500 relative"
              style={{ width: `${progress}%` }}
            >
              {progress > 10 && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Workshop footer */}
        <div className="flex items-center justify-between pt-4 border-t border-orange-100">
          <div className="flex items-center gap-4">
            {/* Storyteller info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-300 to-amber-300 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-xs">
                  {problem.proposer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium">{problem.proposer.name}</div>
                <div className="text-xs">{formatWorkshopTime(problem.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Community support action */}
          <div className="flex items-center gap-3">
            {problem.vote_count < 100 && (
              <VoteButton
                hasVoted={hasVoted}
                voteCount={problem.vote_count}
                isVoting={isVoting}
                onClick={handleVote}
                variant="card"
                size="md"
                showEncouragement={true}
                className="shadow-sm hover:shadow-md"
              />
            )}
            
            <Link 
              href={`/problems/${problem.id}`}
              className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors group"
            >
              <span>Ascolta la storia</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Workshop milestone celebration overlay */}
      {problem.vote_count >= 100 && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none">
          <div className="absolute top-3 left-3 text-2xl animate-bounce">🎉</div>
        </div>
      )}
    </Card>
  );
};

export default ArtisanalProblemCard;