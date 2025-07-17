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
}) => {
  const formatVoteCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
    return `${Math.floor(count / 1000)}K`;
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

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return hasVoted
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200';
      case 'detail':
        return hasVoted
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200';
      default:
        return hasVoted
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-red-600 hover:text-white';
    }
  };

  const heartClasses = clsx(
    iconSizes[size],
    'transition-all duration-200',
    hasVoted ? 'fill-current scale-110' : '',
    isVoting ? 'animate-pulse' : ''
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
          {isLoading ? '...' : formatVoteCount(voteCount)}
        </span>
      )}
    </Button>
  );
};