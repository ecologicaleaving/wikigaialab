/**
 * Social Sharing Component
 * Story 4.3: User Profiles & Social Features
 * Share profiles, achievements, and activities on social platforms
 */

'use client';

import React, { useState } from 'react';
import { Achievement, UserProfile } from '../../../../../packages/shared/src/types/social';

interface ShareData {
  url: string;
  title: string;
  description: string;
  image?: string;
  hashtags?: string[];
}

interface SocialSharingProps {
  data: ShareData;
  platforms?: SocialPlatform[];
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

type SocialPlatform = 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'copy';

const PLATFORM_CONFIGS = {
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-500 hover:bg-blue-600',
    getUrl: (data: ShareData) => {
      const text = `${data.title}\n\n${data.description}`;
      const hashtags = data.hashtags?.join(',') || '';
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.url)}&hashtags=${encodeURIComponent(hashtags)}`;
    }
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    color: 'bg-blue-600 hover:bg-blue-700',
    getUrl: (data: ShareData) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}&quote=${encodeURIComponent(data.description)}`
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700 hover:bg-blue-800',
    getUrl: (data: ShareData) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}&summary=${encodeURIComponent(data.description)}&title=${encodeURIComponent(data.title)}`
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: 'bg-green-500 hover:bg-green-600',
    getUrl: (data: ShareData) => 
      `https://wa.me/?text=${encodeURIComponent(`${data.title}\n\n${data.description}\n\n${data.url}`)}`
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    color: 'bg-blue-400 hover:bg-blue-500',
    getUrl: (data: ShareData) => 
      `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(`${data.title}\n\n${data.description}`)}`
  },
  copy: {
    name: 'Copia Link',
    icon: '📋',
    color: 'bg-gray-600 hover:bg-gray-700',
    getUrl: () => '#'
  }
};

export const SocialSharing: React.FC<SocialSharingProps> = ({
  data,
  platforms = ['twitter', 'facebook', 'linkedin', 'whatsapp', 'copy'],
  layout = 'horizontal',
  size = 'md',
  showLabels = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async (platform: SocialPlatform) => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(data.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
      return;
    }

    const config = PLATFORM_CONFIGS[platform];
    const shareUrl = config.getUrl(data);
    
    // Try to use Web Share API if available
    if (navigator.share && platform !== 'copy') {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        });
        return;
      } catch (error) {
        // Fallback to opening window
      }
    }

    // Open in new window
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8 text-xs';
      case 'lg': return 'h-12 w-12 text-base';
      default: return 'h-10 w-10 text-sm';
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'vertical': return 'flex flex-col space-y-2';
      case 'dropdown': return 'relative';
      default: return 'flex space-x-2';
    }
  };

  if (layout === 'dropdown') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
            ${getSizeClasses()}
            inline-flex items-center justify-center
            bg-gray-600 hover:bg-gray-700 text-white rounded-full
            transition-colors duration-200
          `}
          title="Condividi"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
            {platforms.map((platform) => {
              const config = PLATFORM_CONFIGS[platform];
              return (
                <button
                  key={platform}
                  onClick={() => {
                    handleShare(platform);
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span className="mr-3">{config.icon}</span>
                  {config.name}
                  {platform === 'copy' && copied && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Backdrop */}
        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={getLayoutClasses()}>
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIGS[platform];
        const isPlatformCopy = platform === 'copy';
        
        return (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            className={`
              ${getSizeClasses()}
              inline-flex items-center justify-center
              ${config.color} text-white rounded-full
              transition-colors duration-200
              ${showLabels ? 'px-4' : ''}
            `}
            title={config.name}
          >
            {isPlatformCopy && copied ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className={showLabels ? 'mr-2' : ''}>{config.icon}</span>
            )}
            {showLabels && !copied && config.name}
            {showLabels && copied && isPlatformCopy && 'Copiato!'}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Share Profile Component
 */
interface ShareProfileProps {
  user: UserProfile;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const ShareProfile: React.FC<ShareProfileProps> = ({
  user,
  layout = 'horizontal',
  size = 'md',
  showLabels = false
}) => {
  const shareData: ShareData = {
    url: `${window.location.origin}/users/${user.id}`,
    title: `Profilo di ${user.name || user.email.split('@')[0]} su WikiGaiaLab`,
    description: user.bio || `Scopri il profilo di ${user.name || user.email.split('@')[0]} su WikiGaiaLab. Reputazione: ${user.reputation_score} punti, ${user.total_followers} follower.`,
    hashtags: ['WikiGaiaLab', 'Profilo', 'Comunità'],
    image: user.avatar_url
  };

  return (
    <SocialSharing
      data={shareData}
      layout={layout}
      size={size}
      showLabels={showLabels}
    />
  );
};

/**
 * Share Achievement Component
 */
interface ShareAchievementProps {
  achievement: Achievement;
  userAchievement?: {
    earned_at: string;
    user_id: string;
  };
  userName?: string;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const ShareAchievement: React.FC<ShareAchievementProps> = ({
  achievement,
  userAchievement,
  userName = 'Un utente',
  layout = 'horizontal',
  size = 'md',
  showLabels = false
}) => {
  const shareData: ShareData = {
    url: userAchievement 
      ? `${window.location.origin}/users/${userAchievement.user_id}`
      : window.location.href,
    title: `🏆 ${userName} ha ottenuto l'achievement "${achievement.name}"!`,
    description: `${achievement.description} (+${achievement.points} punti reputazione) su WikiGaiaLab`,
    hashtags: ['WikiGaiaLab', 'Achievement', achievement.category],
  };

  return (
    <SocialSharing
      data={shareData}
      layout={layout}
      size={size}
      showLabels={showLabels}
    />
  );
};

/**
 * Share Activity Component
 */
interface ShareActivityProps {
  activityType: string;
  title: string;
  description: string;
  url?: string;
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const ShareActivity: React.FC<ShareActivityProps> = ({
  activityType,
  title,
  description,
  url = window.location.href,
  layout = 'horizontal',
  size = 'md',
  showLabels = false
}) => {
  const getActivityEmoji = (type: string) => {
    switch (type) {
      case 'problem_created': return '💡';
      case 'problem_voted': return '🗳️';
      case 'achievement_earned': return '🏆';
      case 'user_followed': return '👥';
      case 'problem_favorited': return '❤️';
      default: return '✨';
    }
  };

  const shareData: ShareData = {
    url,
    title: `${getActivityEmoji(activityType)} ${title}`,
    description: `${description} su WikiGaiaLab`,
    hashtags: ['WikiGaiaLab', 'Attività', 'Comunità']
  };

  return (
    <SocialSharing
      data={shareData}
      layout={layout}
      size={size}
      showLabels={showLabels}
    />
  );
};

/**
 * Custom Share Component for arbitrary content
 */
interface CustomShareProps {
  title: string;
  description: string;
  url?: string;
  hashtags?: string[];
  platforms?: SocialPlatform[];
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const CustomShare: React.FC<CustomShareProps> = ({
  title,
  description,
  url = window.location.href,
  hashtags = ['WikiGaiaLab'],
  platforms,
  layout = 'horizontal',
  size = 'md',
  showLabels = false
}) => {
  const shareData: ShareData = {
    url,
    title,
    description,
    hashtags
  };

  return (
    <SocialSharing
      data={shareData}
      platforms={platforms}
      layout={layout}
      size={size}
      showLabels={showLabels}
    />
  );
};

/**
 * Quick Share Button (single button that opens share menu)
 */
interface QuickShareProps {
  title: string;
  description: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const QuickShare: React.FC<QuickShareProps> = ({
  title,
  description,
  url = window.location.href,
  size = 'md',
  variant = 'ghost'
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const shareData: ShareData = {
    url,
    title,
    description,
    hashtags: ['WikiGaiaLab']
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8 text-xs';
      case 'lg': return 'h-12 w-12 text-base';
      default: return 'h-10 w-10 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary': return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary': return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      default: return 'text-gray-400 hover:text-gray-600 hover:bg-gray-100';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`
          ${getSizeClasses()}
          inline-flex items-center justify-center rounded-full
          transition-colors duration-200
          ${getVariantClasses()}
        `}
        title="Condividi"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <SocialSharing
            data={shareData}
            layout="vertical"
            size="sm"
          />
        </div>
      )}

      {/* Backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default {
  SocialSharing,
  ShareProfile,
  ShareAchievement,
  ShareActivity,
  CustomShare,
  QuickShare
};