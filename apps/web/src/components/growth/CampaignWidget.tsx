/**
 * Campaign Widget Component
 * Story 4.5: Community Growth Tools
 * Widget for displaying and managing engagement campaigns
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaignType: string;
  status: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  goalType: string;
  goalValue: number;
  rewardType: string;
  rewardValue: number;
  rewardData: any;
  rules: any;
}

interface CampaignParticipation {
  id: string;
  campaignId: string;
  joinedAt: string;
  currentProgress: number;
  goalReached: boolean;
  rewardClaimed: boolean;
  rewardClaimedAt?: string;
}

interface CampaignWidgetProps {
  userId?: string;
  compact?: boolean;
  showJoined?: boolean;
  className?: string;
}

export function CampaignWidget({ 
  userId, 
  compact = false, 
  showJoined = true,
  className = '' 
}: CampaignWidgetProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userParticipation, setUserParticipation] = useState<CampaignParticipation[]>([]);
  const [eligibleCampaigns, setEligibleCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningCampaign, setJoiningCampaign] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [userId]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const url = `/api/campaigns${userId ? `?user_id=${userId}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setUserParticipation(data.userParticipation || []);
        setEligibleCampaigns(data.eligibleCampaigns || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinCampaign = async (campaignId: string) => {
    if (!userId) return;
    
    try {
      setJoiningCampaign(campaignId);
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          campaignId,
          userId
        })
      });

      if (response.ok) {
        await fetchCampaigns(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join campaign');
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      alert('Failed to join campaign');
    } finally {
      setJoiningCampaign(null);
    }
  };

  const claimReward = async (campaignId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claim_reward',
          campaignId,
          userId
        })
      });

      if (response.ok) {
        await fetchCampaigns(); // Refresh data
        alert('Reward claimed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to claim reward');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward');
    }
  };

  const getProgressPercentage = (participation: CampaignParticipation, campaign: Campaign) => {
    return Math.min((participation.currentProgress / campaign.goalValue) * 100, 100);
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'challenge': return '🏆';
      case 'contest': return '🎯';
      case 'milestone': return '📈';
      case 'streak': return '🔥';
      case 'referral_bonus': return '👥';
      default: return '🎮';
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'points': return '⭐';
      case 'badges': return '🏅';
      case 'premium_days': return '👑';
      case 'features': return '🎁';
      case 'recognition': return '🌟';
      default: return '🎁';
    }
  };

  const isUserParticipating = (campaignId: string) => {
    return userParticipation.some(p => p.campaignId === campaignId);
  };

  const getUserParticipation = (campaignId: string) => {
    return userParticipation.find(p => p.campaignId === campaignId);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const joinedCampaigns = showJoined ? 
    activeCampaigns.filter(c => isUserParticipating(c.id)) : [];
  const availableCampaigns = activeCampaigns.filter(c => 
    !isUserParticipating(c.id) && eligibleCampaigns.includes(c.id)
  );

  if (compact) {
    const displayCampaigns = joinedCampaigns.length > 0 ? joinedCampaigns : availableCampaigns;
    
    return (
      <Card className={`p-4 ${className}`}>
        <div className="space-y-3">
          <h3 className="font-medium">Active Campaigns</h3>
          
          {displayCampaigns.length === 0 ? (
            <p className="text-sm text-gray-600">No active campaigns</p>
          ) : (
            <div className="space-y-2">
              {displayCampaigns.slice(0, 2).map((campaign) => {
                const participation = getUserParticipation(campaign.id);
                const isParticipating = !!participation;
                
                return (
                  <div key={campaign.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getCampaignTypeIcon(campaign.campaignType)}</span>
                        <span className="text-sm font-medium truncate">{campaign.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {getDaysRemaining(campaign.endDate)}d left
                      </span>
                    </div>
                    
                    {isParticipating && participation && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{participation.currentProgress}/{campaign.goalValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${getProgressPercentage(participation, campaign)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
        <div>
          <h2 className="text-xl font-semibold">Engagement Campaigns</h2>
          <p className="text-gray-600 text-sm mt-1">
            Join challenges and earn rewards for being active in the community
          </p>
        </div>

        {/* Joined Campaigns */}
        {joinedCampaigns.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Your Active Campaigns</h3>
            <div className="space-y-4">
              {joinedCampaigns.map((campaign) => {
                const participation = getUserParticipation(campaign.id)!;
                const progressPercentage = getProgressPercentage(participation, campaign);
                const canClaimReward = participation.goalReached && !participation.rewardClaimed;
                
                return (
                  <Card key={campaign.id} className="p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCampaignTypeIcon(campaign.campaignType)}</span>
                        <div>
                          <h4 className="font-medium">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {getDaysRemaining(campaign.endDate)} days left
                        </div>
                        {canClaimReward && (
                          <Button
                            onClick={() => claimReward(campaign.id)}
                            size="sm"
                            className="mt-1"
                          >
                            Claim Reward
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{participation.currentProgress}/{campaign.goalValue} {campaign.goalType}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            participation.goalReached ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          Reward: {getRewardIcon(campaign.rewardType)} {campaign.rewardValue} {campaign.rewardType}
                        </span>
                        {participation.goalReached && (
                          <span className="text-green-600 font-medium">
                            {participation.rewardClaimed ? 'Reward Claimed!' : 'Goal Reached!'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Campaigns */}
        {availableCampaigns.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Available Campaigns</h3>
            <div className="space-y-4">
              {availableCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getCampaignTypeIcon(campaign.campaignType)}</span>
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Goal: {campaign.goalValue} {campaign.goalType}</span>
                          <span>•</span>
                          <span>Reward: {getRewardIcon(campaign.rewardType)} {campaign.rewardValue} {campaign.rewardType}</span>
                          <span>•</span>
                          <span>{getDaysRemaining(campaign.endDate)} days left</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => joinCampaign(campaign.id)}
                      disabled={joiningCampaign === campaign.id}
                      size="sm"
                    >
                      {joiningCampaign === campaign.id ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Campaigns */}
        {activeCampaigns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">🎯</span>
            <p>No active campaigns right now</p>
            <p className="text-sm mt-1">Check back soon for new challenges!</p>
          </div>
        )}
      </div>
    </Card>
  );
}