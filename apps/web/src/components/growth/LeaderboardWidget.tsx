/**
 * Leaderboard Widget Component
 * Story 4.5: Community Growth Tools
 * Widget for displaying community leaderboards
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    reputation_score: number;
  };
  score: number;
  previousRank?: number;
  rankChange: number;
  streakCount: number;
}

interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  isActive: boolean;
  isFeatured: boolean;
  lastUpdated: string;
}

interface LeaderboardWidgetProps {
  userId?: string;
  compact?: boolean;
  showControls?: boolean;
  defaultLeaderboardId?: string;
  className?: string;
}

export function LeaderboardWidget({ 
  userId, 
  compact = false, 
  showControls = true,
  defaultLeaderboardId,
  className = '' 
}: LeaderboardWidgetProps) {
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  useEffect(() => {
    if (selectedLeaderboard) {
      fetchLeaderboardData(selectedLeaderboard);
    }
  }, [selectedLeaderboard, userId]);

  const fetchLeaderboards = async () => {
    try {
      const response = await fetch('/api/leaderboards');
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboards(data.leaderboards || []);
        
        // Set default leaderboard
        const defaultId = defaultLeaderboardId || 
          data.leaderboards?.find((lb: Leaderboard) => lb.isFeatured)?.id ||
          data.leaderboards?.[0]?.id;
        
        if (defaultId) {
          setSelectedLeaderboard(defaultId);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    }
  };

  const fetchLeaderboardData = async (leaderboardId: string) => {
    try {
      setLoading(true);
      const url = `/api/leaderboards?id=${leaderboardId}${userId ? `&user_id=${userId}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
        setCurrentUserRank(data.currentUserRank);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboard = async () => {
    if (!selectedLeaderboard) return;
    
    setRefreshing(true);
    await fetchLeaderboardData(selectedLeaderboard);
    setRefreshing(false);
  };

  const getRankChangeIcon = (rankChange: number) => {
    if (rankChange > 0) {
      return <span className="text-green-500">↗</span>;
    } else if (rankChange < 0) {
      return <span className="text-red-500">↘</span>;
    }
    return <span className="text-gray-400">→</span>;
  };

  const getRankChangeColor = (rankChange: number) => {
    if (rankChange > 0) return 'text-green-600';
    if (rankChange < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getScoreLabel = (type: string) => {
    switch (type) {
      case 'votes': return 'Votes';
      case 'problems': return 'Problems';
      case 'referrals': return 'Referrals';
      case 'engagement': return 'Days Active';
      case 'reputation': return 'Points';
      default: return 'Score';
    }
  };

  const currentLeaderboard = leaderboards.find(lb => lb.id === selectedLeaderboard);

  if (compact) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Leaderboard</h3>
            {showControls && (
              <Button
                onClick={refreshLeaderboard}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                {refreshing ? '...' : '↻'}
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 3).map((entry) => (
                <div key={entry.user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium w-6">#{entry.rank}</span>
                    <span className="text-sm truncate">{entry.user.name}</span>
                  </div>
                  <span className="text-sm font-medium">{entry.score}</span>
                </div>
              ))}
              
              {currentUserRank && currentUserRank > 3 && (
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-sm font-medium">Your rank: #{currentUserRank}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Community Leaderboard</h2>
            {currentLeaderboard && (
              <p className="text-gray-600 text-sm mt-1">
                {currentLeaderboard.description}
              </p>
            )}
          </div>
          
          {showControls && (
            <Button
              onClick={refreshLeaderboard}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>

        {/* Leaderboard Selection */}
        {showControls && leaderboards.length > 1 && (
          <div>
            <Select
              value={selectedLeaderboard}
              onChange={(e) => setSelectedLeaderboard(e.target.value)}
              className="w-full"
            >
              {leaderboards.map((leaderboard) => (
                <option key={leaderboard.id} value={leaderboard.id}>
                  {leaderboard.name} ({leaderboard.period})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Current User Rank */}
        {currentUserRank && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-900">Your Current Rank</span>
              <span className="text-2xl font-bold text-blue-600">#{currentUserRank}</span>
            </div>
          </Card>
        )}

        {/* Leaderboard Entries */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.user.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  userId === entry.user.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' :
                      entry.rank === 3 ? 'text-orange-400' :
                      'text-gray-600'
                    }`}>
                      #{entry.rank}
                    </span>
                    
                    {/* Rank Change */}
                    {entry.previousRank && (
                      <div className="flex items-center space-x-1">
                        {getRankChangeIcon(entry.rankChange)}
                        <span className={`text-xs ${getRankChangeColor(entry.rankChange)}`}>
                          {Math.abs(entry.rankChange)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    {entry.user.avatar_url ? (
                      <img
                        src={entry.user.avatar_url}
                        alt={entry.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {entry.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="font-medium">{entry.user.name}</div>
                      {entry.user.reputation_score > 0 && (
                        <div className="text-xs text-gray-500">
                          {entry.user.reputation_score} reputation
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-lg font-bold">{entry.score}</div>
                  <div className="text-xs text-gray-500">
                    {currentLeaderboard ? getScoreLabel(currentLeaderboard.type) : 'Score'}
                  </div>
                  {entry.streakCount > 0 && (
                    <div className="text-xs text-orange-600">
                      🔥 {entry.streakCount} streak
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No leaderboard data available</p>
            <Button
              onClick={refreshLeaderboard}
              variant="outline"
              className="mt-2"
            >
              Refresh
            </Button>
          </div>
        )}

        {/* Footer Info */}
        {currentLeaderboard && (
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date(currentLeaderboard.lastUpdated).toLocaleDateString()}
            {currentLeaderboard.period !== 'all_time' && (
              <span> • Period: {currentLeaderboard.period}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}