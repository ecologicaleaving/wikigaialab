'use client';

import React, { useState, useEffect } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useVotingHistory } from '@/hooks/useVotingHistory';
import { useAuth } from '@/hooks/useAuth';
import { PremiumFeature } from './PremiumFeature';
import {
  StarIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  RocketLaunchIcon,
  UserGroupIcon,
  LightBulbIcon,
  CalendarIcon,
  CheckCircleIcon,
  CrownIcon,
  HeartIcon,
  BookmarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  TrophyIcon as TrophyIconSolid,
  FireIcon as FireIconSolid
} from '@heroicons/react/24/solid';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'voting' | 'community' | 'engagement' | 'milestone' | 'premium';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirements: {
    description: string;
    criteria: BadgeCriteria[];
  };
  earned: boolean;
  earned_at?: string;
  progress?: number;
  max_progress?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  premium_only: boolean;
}

interface BadgeCriteria {
  type: 'votes_count' | 'streak_days' | 'categories_voted' | 'problems_created' | 'community_engagement' | 'special_event';
  value: number;
  current?: number;
}

export function PremiumBadgeSystem() {
  const { accessData } = usePremiumAccess();
  const { history, stats } = useVotingHistory();
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    generateBadges();
  }, [stats, accessData]);

  const generateBadges = () => {
    const allBadges: Badge[] = [
      // Voting Badges
      {
        id: 'first-vote',
        name: 'Primo Voto',
        description: 'Il tuo primo passo nella community',
        icon: StarIcon,
        category: 'voting',
        tier: 'bronze',
        requirements: {
          description: 'Esprimi il tuo primo voto',
          criteria: [{ type: 'votes_count', value: 1, current: stats?.totalVotes || 0 }]
        },
        earned: (stats?.totalVotes || 0) >= 1,
        earned_at: (stats?.totalVotes || 0) >= 1 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.totalVotes || 0, 1),
        max_progress: 1,
        rarity: 'common',
        premium_only: false
      },
      {
        id: 'active-voter',
        name: 'Votante Attivo',
        description: 'Hai raggiunto 25 voti espressi',
        icon: BoltIcon,
        category: 'voting',
        tier: 'silver',
        requirements: {
          description: 'Esprimi 25 voti nella community',
          criteria: [{ type: 'votes_count', value: 25, current: stats?.totalVotes || 0 }]
        },
        earned: (stats?.totalVotes || 0) >= 25,
        earned_at: (stats?.totalVotes || 0) >= 25 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.totalVotes || 0, 25),
        max_progress: 25,
        rarity: 'uncommon',
        premium_only: false
      },
      {
        id: 'voting-legend',
        name: 'Leggenda del Voto',
        description: 'Hai superato i 100 voti!',
        icon: TrophyIcon,
        category: 'voting',
        tier: 'gold',
        requirements: {
          description: 'Esprimi 100 voti nella community',
          criteria: [{ type: 'votes_count', value: 100, current: stats?.totalVotes || 0 }]
        },
        earned: (stats?.totalVotes || 0) >= 100,
        earned_at: (stats?.totalVotes || 0) >= 100 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.totalVotes || 0, 100),
        max_progress: 100,
        rarity: 'rare',
        premium_only: false
      },

      // Streak Badges
      {
        id: 'consistent-voter',
        name: 'Votante Consistente',
        description: 'Hai mantenuto una serie di 7 giorni',
        icon: FireIcon,
        category: 'engagement',
        tier: 'silver',
        requirements: {
          description: 'Mantieni una serie di voti per 7 giorni consecutivi',
          criteria: [{ type: 'streak_days', value: 7, current: stats?.votingStreak || 0 }]
        },
        earned: (stats?.votingStreak || 0) >= 7,
        earned_at: (stats?.votingStreak || 0) >= 7 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.votingStreak || 0, 7),
        max_progress: 7,
        rarity: 'uncommon',
        premium_only: false
      },
      {
        id: 'dedication-master',
        name: 'Maestro della Dedizione',
        description: 'Serie di 30 giorni consecutivi',
        icon: CrownIcon,
        category: 'engagement',
        tier: 'platinum',
        requirements: {
          description: 'Mantieni una serie di voti per 30 giorni consecutivi',
          criteria: [{ type: 'streak_days', value: 30, current: stats?.votingStreak || 0 }]
        },
        earned: (stats?.votingStreak || 0) >= 30,
        earned_at: (stats?.votingStreak || 0) >= 30 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.votingStreak || 0, 30),
        max_progress: 30,
        rarity: 'epic',
        premium_only: true
      },

      // Category Diversification
      {
        id: 'explorer',
        name: 'Esploratore',
        description: 'Hai votato in 5 categorie diverse',
        icon: RocketLaunchIcon,
        category: 'community',
        tier: 'silver',
        requirements: {
          description: 'Vota problemi in almeno 5 categorie diverse',
          criteria: [{ type: 'categories_voted', value: 5, current: stats?.categoriesVoted || 0 }]
        },
        earned: (stats?.categoriesVoted || 0) >= 5,
        earned_at: (stats?.categoriesVoted || 0) >= 5 ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.categoriesVoted || 0, 5),
        max_progress: 5,
        rarity: 'uncommon',
        premium_only: false
      },

      // Premium Exclusive Badges
      {
        id: 'premium-member',
        name: 'Membro Premium',
        description: 'Hai sbloccato l\'accesso premium',
        icon: SparklesIcon,
        category: 'premium',
        tier: 'gold',
        requirements: {
          description: 'Raggiungi il livello premium votando almeno 5 problemi',
          criteria: [{ type: 'votes_count', value: 5, current: stats?.totalVotes || 0 }]
        },
        earned: accessData?.canAccessPremium || false,
        earned_at: accessData?.canAccessPremium ? new Date().toISOString() : undefined,
        progress: Math.min(stats?.totalVotes || 0, 5),
        max_progress: 5,
        rarity: 'rare',
        premium_only: true
      },
      {
        id: 'analytics-expert',
        name: 'Esperto di Analytics',
        description: 'Hai utilizzato le analytics premium',
        icon: LightBulbIcon,
        category: 'premium',
        tier: 'gold',
        requirements: {
          description: 'Accedi alle analytics premium per 3 giorni',
          criteria: [{ type: 'special_event', value: 3, current: accessData?.canAccessPremium ? 3 : 0 }]
        },
        earned: accessData?.canAccessPremium || false,
        earned_at: accessData?.canAccessPremium ? new Date().toISOString() : undefined,
        progress: accessData?.canAccessPremium ? 3 : 0,
        max_progress: 3,
        rarity: 'rare',
        premium_only: true
      },
      {
        id: 'community-champion',
        name: 'Campione della Community',
        description: 'Livello massimo di coinvolgimento',
        icon: ShieldCheckIcon,
        category: 'milestone',
        tier: 'diamond',
        requirements: {
          description: 'Raggiungi 25+ voti e mantieni una serie di 15+ giorni',
          criteria: [
            { type: 'votes_count', value: 25, current: stats?.totalVotes || 0 },
            { type: 'streak_days', value: 15, current: stats?.votingStreak || 0 }
          ]
        },
        earned: (stats?.totalVotes || 0) >= 25 && (stats?.votingStreak || 0) >= 15,
        earned_at: (stats?.totalVotes || 0) >= 25 && (stats?.votingStreak || 0) >= 15 ? new Date().toISOString() : undefined,
        progress: Math.min(((stats?.totalVotes || 0) >= 25 ? 1 : 0) + ((stats?.votingStreak || 0) >= 15 ? 1 : 0), 2),
        max_progress: 2,
        rarity: 'legendary',
        premium_only: true
      },

      // Special Event Badges
      {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Uno dei primi utenti della piattaforma',
        icon: HeartIcon,
        category: 'milestone',
        tier: 'platinum',
        requirements: {
          description: 'Registrato nei primi 100 utenti',
          criteria: [{ type: 'special_event', value: 1, current: 1 }]
        },
        earned: true, // Simulate for demo
        earned_at: new Date().toISOString(),
        progress: 1,
        max_progress: 1,
        rarity: 'legendary',
        premium_only: false
      }
    ];

    setBadges(allBadges);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      case 'diamond': return 'from-blue-400 to-cyan-400';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'uncommon': return 'border-green-300 bg-green-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50 shadow-lg';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const categories = [
    { id: 'all', name: 'Tutti', icon: StarIcon },
    { id: 'voting', name: 'Voti', icon: BoltIcon },
    { id: 'community', name: 'Community', icon: UserGroupIcon },
    { id: 'engagement', name: 'Engagement', icon: FireIcon },
    { id: 'milestone', name: 'Traguardi', icon: TrophyIcon },
    { id: 'premium', name: 'Premium', icon: SparklesIcon }
  ];

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const earnedBadges = badges.filter(badge => badge.earned);
  const availableBadges = badges.filter(badge => !badge.earned);

  return (
    <PremiumFeature
      requiredVotes={0} // Basic badges are free, but premium badges require premium access
      feature="Sistema Badge"
      showUpgradePrompt={false}
      fallback={null}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2">
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
            Sistema Badge
          </h2>
          <p className="text-gray-600">
            Colleziona badge per celebrare i tuoi traguardi nella community
          </p>
        </div>

        {/* Stats Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{earnedBadges.length}</p>
              <p className="text-sm text-gray-600">Badge Ottenuti</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{badges.length}</p>
              <p className="text-sm text-gray-600">Badge Totali</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {earnedBadges.filter(b => b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary').length}
              </p>
              <p className="text-sm text-gray-600">Badge Rari</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {Math.round((earnedBadges.length / badges.length) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Completamento</p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Earned Badges Section */}
        {earnedBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              Badge Ottenuti ({earnedBadges.filter(b => selectedCategory === 'all' || b.category === selectedCategory).length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges
                .filter(badge => selectedCategory === 'all' || badge.category === selectedCategory)
                .map((badge) => (
                  <BadgeCard 
                    key={badge.id} 
                    badge={badge} 
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Available Badges Section */}
        {availableBadges.filter(b => selectedCategory === 'all' || b.category === selectedCategory).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookmarkIcon className="w-5 h-5 text-gray-600" />
              Badge Disponibili ({availableBadges.filter(b => selectedCategory === 'all' || b.category === selectedCategory).length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBadges
                .filter(badge => selectedCategory === 'all' || badge.category === selectedCategory)
                .map((badge) => (
                  <BadgeCard 
                    key={badge.id} 
                    badge={badge} 
                    onClick={() => setSelectedBadge(badge)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Premium Badge Notice */}
        <PremiumFeature
          requiredVotes={5}
          feature="Badge Premium Esclusivi"
          showUpgradePrompt={false}
          fallback={
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6 text-center">
              <SparklesIcon className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Badge Premium Esclusivi
              </h3>
              <p className="text-gray-600 mb-4">
                Sblocca badge esclusivi e rari con l'accesso premium. Raggiungi 5 voti per accedere a badge leggendari!
              </p>
              <div className="flex justify-center gap-4">
                {badges.filter(b => b.premium_only).slice(0, 3).map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.id} className="flex flex-col items-center opacity-60">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor(badge.tier)} flex items-center justify-center mb-1`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-gray-600">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        >
          <div></div>
        </PremiumFeature>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </div>
    </PremiumFeature>
  );
}

// Badge Card Component
interface BadgeCardProps {
  badge: Badge;
  onClick: () => void;
}

function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const Icon = badge.icon;
  const tierColor = getTierColor(badge.tier);
  const rarityColor = getRarityColor(badge.rarity);

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${rarityColor} ${
        badge.earned ? '' : 'opacity-60'
      }`}
    >
      {/* Premium Badge Indicator */}
      {badge.premium_only && (
        <div className="absolute top-2 right-2">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
        </div>
      )}

      {/* Badge Icon */}
      <div className="text-center mb-3">
        <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center mb-2 ${
          badge.earned ? 'shadow-lg' : ''
        }`}>
          <Icon className={`w-8 h-8 text-white ${badge.earned ? '' : 'opacity-50'}`} />
        </div>
        
        {/* Tier Label */}
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
          badge.earned ? 'bg-white bg-opacity-20 text-gray-800' : 'bg-gray-200 text-gray-600'
        }`}>
          {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
        </span>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h4 className="font-semibold text-gray-900 mb-1">{badge.name}</h4>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
        
        {/* Progress Bar */}
        {!badge.earned && badge.progress !== undefined && badge.max_progress !== undefined && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{badge.progress}/{badge.max_progress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(badge.progress / badge.max_progress) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Earned Date */}
        {badge.earned && badge.earned_at && (
          <p className="text-xs text-gray-500 mt-2">
            Ottenuto il {new Date(badge.earned_at).toLocaleDateString('it-IT')}
          </p>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getTierColor(tier: string) {
  switch (tier) {
    case 'bronze': return 'from-amber-600 to-amber-800';
    case 'silver': return 'from-gray-400 to-gray-600';
    case 'gold': return 'from-yellow-400 to-yellow-600';
    case 'platinum': return 'from-purple-400 to-purple-600';
    case 'diamond': return 'from-blue-400 to-cyan-400';
    default: return 'from-gray-400 to-gray-600';
  }
}

function getRarityColor(rarity: string) {
  switch (rarity) {
    case 'common': return 'border-gray-300 bg-gray-50';
    case 'uncommon': return 'border-green-300 bg-green-50';
    case 'rare': return 'border-blue-300 bg-blue-50';
    case 'epic': return 'border-purple-300 bg-purple-50';
    case 'legendary': return 'border-yellow-300 bg-yellow-50 shadow-lg';
    default: return 'border-gray-300 bg-gray-50';
  }
}

// Badge Detail Modal Component
interface BadgeDetailModalProps {
  badge: Badge;
  onClose: () => void;
}

function BadgeDetailModal({ badge, onClose }: BadgeDetailModalProps) {
  const Icon = badge.icon;
  const tierColor = getTierColor(badge.tier);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${tierColor} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-gray-900">{badge.name}</h3>
            {badge.premium_only && (
              <SparklesIcon className="w-5 h-5 text-purple-500" />
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r ${tierColor} text-white`}>
              {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
            </span>
          </div>
          
          <p className="text-gray-600">{badge.description}</p>
        </div>

        {/* Requirements */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Requisiti:</h4>
          <p className="text-sm text-gray-600 mb-3">{badge.requirements.description}</p>
          
          <div className="space-y-2">
            {badge.requirements.criteria.map((criterion, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  {criterion.type === 'votes_count' && 'Voti espressi'}
                  {criterion.type === 'streak_days' && 'Giorni consecutivi'}
                  {criterion.type === 'categories_voted' && 'Categorie votate'}
                  {criterion.type === 'problems_created' && 'Problemi creati'}
                  {criterion.type === 'community_engagement' && 'Coinvolgimento community'}
                  {criterion.type === 'special_event' && 'Evento speciale'}
                </span>
                <span className={`text-sm font-medium ${
                  (criterion.current || 0) >= criterion.value ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {criterion.current || 0}/{criterion.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        {!badge.earned && badge.progress !== undefined && badge.max_progress !== undefined && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Progresso</span>
              <span>{Math.round((badge.progress / badge.max_progress) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${tierColor} transition-all`}
                style={{ width: `${(badge.progress / badge.max_progress) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Earned Status */}
        {badge.earned ? (
          <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-800">Badge Ottenuto!</p>
            {badge.earned_at && (
              <p className="text-sm text-green-600">
                {new Date(badge.earned_at).toLocaleDateString('it-IT')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700">Non ancora ottenuto</p>
            <p className="text-sm text-gray-600">Continua così per sbloccarlo!</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}