'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import { Trophy, Target, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface VoteMilestonesProps {
  voteCount: number;
  className?: string;
}

const milestones = [
  { threshold: 25, label: 'Prima Milestone', icon: Target, color: 'bg-blue-100 text-blue-700' },
  { threshold: 50, label: 'Trending', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  { threshold: 100, label: 'Popular', icon: Trophy, color: 'bg-green-100 text-green-700' },
];

export const VoteMilestones: React.FC<VoteMilestonesProps> = ({
  voteCount,
  className = '',
}) => {
  const achievedMilestones = milestones.filter(m => voteCount >= m.threshold);
  const nextMilestone = milestones.find(m => voteCount < m.threshold);

  if (achievedMilestones.length === 0 && !nextMilestone) {
    return null;
  }

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {achievedMilestones.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <Badge
                key={milestone.threshold}
                variant="secondary"
                className={clsx(
                  'flex items-center gap-1 px-3 py-1',
                  milestone.color
                )}
              >
                <Icon className="w-3 h-3" />
                {milestone.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Next Milestone Progress */}
      {nextMilestone && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Prossima milestone: {nextMilestone.label}
            </span>
            <span className="text-sm text-gray-500">
              {voteCount}/{nextMilestone.threshold} voti
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((voteCount / nextMilestone.threshold) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ancora {nextMilestone.threshold - voteCount} voti per raggiungere {nextMilestone.label}
          </p>
        </div>
      )}
    </div>
  );
};