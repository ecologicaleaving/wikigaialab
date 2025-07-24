'use client';

import React from 'react';
import { Button } from './button';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface VoteButtonProps {
  hasVoted: boolean;
  voteCount: number;
  isLoading?: boolean;
  isVoting?: boolean;
  disabled?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'detail';
  showCount?: boolean;
  className?: string;
  // Artisanal workshop additions
  showEncouragement?: boolean;
  milestone?: 25 | 50 | 75 | 100;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  hasVoted,
  voteCount,
  isLoading = false,
  isVoting = false,
  disabled = false,
  onClick,
  size = 'md',
  variant = 'default',
  showCount = true,
  className = '',
  showEncouragement = true,
  milestone,
}) => {
  // Artisanal workshop approach to showing community support
  const formatCommunitySupport = (count: number): string => {
    if (count === 0) return "Sii il primo!";
    if (count === 1) return "1 persona";
    if (count < 1000) return `${count} persone`;
    if (count < 10000) return `${(count / 1000).toFixed(1)}k persone`;
    return `${Math.floor(count / 1000)}k persone`;
  };

  // Warm encouragement based on progress toward 100 votes
  const getEncouragementText = (count: number): string => {
    if (count >= 100) return "Iniziamo a lavorare!";
    if (count >= 75) return `Mancano solo ${100 - count}!`;
    if (count >= 50) return "Ci siamo quasi!";
    if (count >= 25) return "Sta crescendo!";
    return "Serve anche a me!";
  };

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-11 px-4 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Warm artisanal workshop colors - warmer tones like terracotta and golden brown
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return hasVoted
          ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 shadow-sm'
          : 'bg-white text-amber-700 border-amber-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 shadow-sm';
      case 'detail':
        return hasVoted
          ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
          : 'bg-white text-amber-700 border-amber-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 shadow-sm';
      default:
        return hasVoted
          ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
          : 'bg-white text-amber-700 border-amber-300 hover:bg-orange-600 hover:text-white shadow-sm';
    }
  };

  // Enhanced heart animation for workshop warmth
  const heartClasses = clsx(
    iconSizes[size],
    'transition-all duration-300 ease-out',
    hasVoted ? 'fill-current scale-110 drop-shadow-sm' : 'hover:scale-105',
    isVoting ? 'animate-pulse scale-105' : '',
    // Add a gentle golden glow when voted
    hasVoted && variant !== 'detail' ? 'filter drop-shadow-sm' : ''
  );

  if (variant === 'card' && !showCount) {
    return (
      <Button
        size={size}
        variant="outline"
        onClick={onClick}
        disabled={disabled || isLoading || isVoting}
        className={clsx(
          getVariantClasses(),
          'transition-all duration-200',
          className
        )}
      >
        {isVoting ? (
          <div className={clsx(iconSizes[size], 'animate-spin border-2 border-current border-t-transparent rounded-full')} />
        ) : (
          <Heart className={heartClasses} />
        )}
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={onClick}
      disabled={disabled || isLoading || isVoting}
      className={clsx(
        sizeClasses[size],
        getVariantClasses(),
        'flex items-center gap-2 transition-all duration-200',
        className
      )}
    >
      {isVoting ? (
        <div className={clsx(iconSizes[size], 'animate-spin border-2 border-current border-t-transparent rounded-full')} />
      ) : (
        <Heart className={heartClasses} />
      )}
      
      {showCount && (
        <span className="font-medium">
          {isLoading ? 'Controllo...' : (
            <span className="flex flex-col items-center">
              <span className="text-xs leading-tight">
                {formatCommunitySupport(voteCount)}
              </span>
              {voteCount > 0 && voteCount < 100 && (
                <span className="text-xs opacity-75 leading-tight">
                  {getEncouragementText(voteCount)}
                </span>
              )}
            </span>
          )}
        </span>
      )}
    </Button>
  );
};