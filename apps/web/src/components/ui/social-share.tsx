'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { 
  Share2, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Copy, 
  Check,
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx } from 'clsx';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
  voteCount: number;
  category: string;
  variant?: 'full' | 'compact' | 'floating';
  className?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({
  title,
  description,
  url,
  voteCount,
  category,
  variant = 'full',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Generate sharing messages for different platforms
  const generateMessage = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin') => {
    const baseMessage = `🚀 ${title}`;
    const voteText = voteCount > 0 ? ` (${voteCount} voti)` : '';
    const hashtags = '#WikiGaiaLab #InnovazioneItalia #Problemi';
    const callToAction = 'Vota su WikiGaiaLab!';
    
    switch (platform) {
      case 'whatsapp':
        return `${baseMessage}${voteText}\n\n${description.substring(0, 100)}...\n\n${callToAction}\n${url}`;
      
      case 'facebook':
        return `${baseMessage}${voteText}\n\n${callToAction} ${hashtags}`;
      
      case 'twitter':
        const shortDesc = description.substring(0, 80) + '...';
        return `${baseMessage}${voteText}\n\n${shortDesc}\n\n${callToAction} ${hashtags}`;
      
      case 'linkedin':
        return `${baseMessage}${voteText}\n\nCategoria: ${category}\n\n${description.substring(0, 150)}...\n\n${callToAction}`;
      
      default:
        return `${baseMessage} - ${callToAction}`;
    }
  };

  // Platform-specific sharing functions
  const shareWhatsApp = () => {
    const message = encodeURIComponent(generateMessage('whatsapp'));
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank', 'width=600,height=400');
    trackShare('whatsapp');
  };

  const shareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(generateMessage('facebook'))}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    trackShare('facebook');
  };

  const shareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(generateMessage('twitter'))}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    trackShare('twitter');
  };

  const shareLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(generateMessage('linkedin'))}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    trackShare('linkedin');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiato!', {
        description: 'Il link è stato copiato negli appunti',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
      trackShare('copy');
    } catch (error) {
      toast.error('Errore nella copia del link');
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: generateMessage('whatsapp'),
          url,
        });
        trackShare('native');
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  };

  // Track sharing events
  const trackShare = async (platform: string) => {
    try {
      // Send to our analytics endpoint
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          problem_id: url.split('/').pop(), // Extract problem ID from URL
          problem_title: title,
          problem_url: url,
          vote_count: voteCount,
          category,
        }),
      });
    } catch (error) {
      // Silently handle analytics errors - don't block user sharing
    }

    // Also integrate with client-side analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Problem Shared', {
        platform,
        problem_title: title,
        problem_url: url,
        vote_count: voteCount,
        category,
      });
    }
  };

  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <Button
          size="sm"
          variant="outline"
          onClick={shareWhatsApp}
          className="text-green-600 hover:bg-green-50 hover:border-green-200"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={copyLink}
          className="text-gray-600 hover:bg-gray-50"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
        {navigator.share && (
          <Button
            size="sm"
            variant="outline"
            onClick={shareNative}
            className="text-blue-600 hover:bg-blue-50 hover:border-blue-200"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={clsx('fixed right-6 bottom-6 z-50 flex flex-col gap-2', className)}>
        <Button
          size="lg"
          onClick={shareWhatsApp}
          className="rounded-full w-12 h-12 bg-green-500 hover:bg-green-600 text-white shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={copyLink}
          className="rounded-full w-12 h-12 bg-white shadow-lg"
        >
          {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </Button>
      </div>
    );
  }

  // Full variant
  return (
    <div className={clsx('space-y-4', className)}>
      <h4 className="font-medium text-gray-900 flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Condividi questo problema
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* WhatsApp - Primary for Italian market */}
        <Button
          onClick={shareWhatsApp}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>

        {/* Facebook */}
        <Button
          onClick={shareFacebook}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </Button>

        {/* Twitter */}
        <Button
          onClick={shareTwitter}
          className="bg-gray-900 hover:bg-black text-white"
        >
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </Button>

        {/* LinkedIn */}
        <Button
          onClick={shareLinkedIn}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </Button>
      </div>

      {/* Copy Link */}
      <div className="pt-2 border-t">
        <Button
          onClick={copyLink}
          variant="outline"
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              Link copiato!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copia link
            </>
          )}
        </Button>
      </div>

      {/* Native sharing for mobile */}
      {navigator.share && (
        <Button
          onClick={shareNative}
          variant="outline"
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Condividi...
        </Button>
      )}
    </div>
  );
};