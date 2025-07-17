'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, Users, Heart, Zap, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { analytics } from '../../lib/analytics';
import { useABTest } from '../../lib/ab-testing';
import { valuePropositionVariants, ctaVariants } from '../../lib/ab-testing';

interface CommunityStats {
  members: number;
  problems: number;
  votes: number;
  apps: number;
}

interface HeroSectionProps {
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ className = '' }) => {
  const { user, loading } = useAuth();
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    members: 0,
    problems: 0,
    votes: 0,
    apps: 0
  });

  // A/B Testing
  const { variant: valueProVariant, trackConversion: trackValuePropConversion } = useABTest('value_proposition');
  const { variant: ctaVariant, trackConversion: trackCtaConversion } = useABTest('hero_cta_text');
  const { variant: layoutVariant, trackConversion: trackLayoutConversion } = useABTest('hero_layout');

  const valueProposition = valuePropositionVariants[valueProVariant as keyof typeof valuePropositionVariants] || valuePropositionVariants.community_focused;
  const ctaConfig = ctaVariants[ctaVariant as keyof typeof ctaVariants] || ctaVariants['Inizia Subito'];

  useEffect(() => {
    // Track hero section view
    analytics.trackFunnel('hero_section_view', {
      value_prop_variant: valueProVariant,
      cta_variant: ctaVariant,
      layout_variant: layoutVariant,
      user_authenticated: !!user
    });

    // Fetch community statistics
    fetchCommunityStats();
  }, [valueProVariant, ctaVariant, layoutVariant, user]);

  const fetchCommunityStats = async () => {
    try {
      // Simulate API call - replace with actual API
      const mockStats = {
        members: 1247,
        problems: 89,
        votes: 3542,
        apps: 12
      };
      
      // Animate numbers
      animateNumbers(mockStats);
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
    }
  };

  const animateNumbers = (targetStats: CommunityStats) => {
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCommunityStats({
        members: Math.floor(targetStats.members * easeOut),
        problems: Math.floor(targetStats.problems * easeOut),
        votes: Math.floor(targetStats.votes * easeOut),
        apps: Math.floor(targetStats.apps * easeOut)
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const handlePrimaryCTA = () => {
    analytics.trackFunnel('cta_click', {
      cta_type: 'primary',
      cta_text: ctaConfig.text,
      source: 'hero',
      user_authenticated: !!user
    });
    
    trackCtaConversion('primary_cta_click');
  };

  const handleSecondaryCTA = () => {
    analytics.trackFunnel('cta_click', {
      cta_type: 'secondary',
      source: 'hero',
      user_authenticated: !!user
    });
    
    // Smooth scroll to how it works section
    document.getElementById('come-funziona')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleVideoPlay = () => {
    analytics.trackEvent('hero_video_play', {
      layout_variant: layoutVariant
    });
  };

  // Layout variants
  const getLayoutClasses = () => {
    switch (layoutVariant) {
      case 'left_aligned':
        return 'text-left items-start';
      case 'two_column':
        return 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center';
      case 'video_background':
        return 'text-center relative';
      default:
        return 'text-center';
    }
  };

  const renderBackgroundVideo = () => {
    if (layoutVariant !== 'video_background') return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="w-full h-full object-cover opacity-20"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30" />
      </div>
    );
  };

  const renderCommunityStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-900 mb-1">
          {communityStats.members.toLocaleString()}
        </div>
        <div className="text-sm text-primary-600">Membri</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-900 mb-1">
          {communityStats.problems.toLocaleString()}
        </div>
        <div className="text-sm text-primary-600">Problemi</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-900 mb-1">
          {communityStats.votes.toLocaleString()}
        </div>
        <div className="text-sm text-primary-600">Voti</div>
      </div>
      <div className="text-center">
        <div className="text-2xl md:text-3xl font-bold text-primary-900 mb-1">
          {communityStats.apps.toLocaleString()}
        </div>
        <div className="text-sm text-primary-600">App Create</div>
      </div>
    </div>
  );

  const renderCTAButtons = () => (
    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
      {user ? (
        <a
          href="/dashboard"
          className="btn-primary btn-lg inline-flex items-center justify-center"
          onClick={handlePrimaryCTA}
        >
          Vai alla Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      ) : (
        <GoogleLoginButton
          size="lg"
          className="btn-primary btn-lg"
          onStart={() => {
            analytics.trackFunnel('auth_start', { source: 'hero' });
            handlePrimaryCTA();
          }}
          onSuccess={() => {
            analytics.trackFunnel('auth_complete', { source: 'hero' });
            trackCtaConversion('auth_complete');
          }}
        >
          {ctaConfig.text}
          <ArrowRight className="ml-2 h-5 w-5" />
        </GoogleLoginButton>
      )}
      
      <button
        className="btn-outline btn-lg"
        onClick={handleSecondaryCTA}
      >
        Scopri di Più
      </button>
    </div>
  );

  const renderSocialProof = () => (
    <div className="text-center">
      <p className="text-sm text-primary-600 mb-4">
        Innovazione sociale e tecnologia per il bene comune
      </p>
      <div className="flex justify-center items-center space-x-6 mb-4">
        <img 
          src="/images/ass-gaia-logo.png" 
          alt="Ass.Gaia" 
          className="h-8 opacity-70 hover:opacity-100 transition-opacity"
        />
        <img 
          src="/images/ecologicaleaving-logo.png" 
          alt="Ecologicaleaving" 
          className="h-8 opacity-70 hover:opacity-100 transition-opacity"
        />
      </div>
      <div className="flex justify-center items-center space-x-4 text-sm text-primary-600">
        <span className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          GDPR Compliant
        </span>
        <span className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          Open Source
        </span>
        <span className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          Gratis
        </span>
      </div>
    </div>
  );

  return (
    <section className={`relative bg-gradient-to-br from-primary-50 to-secondary-50 py-20 overflow-hidden ${className}`}>
      {renderBackgroundVideo()}
      
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
      </div>
      
      <div className="container-narrow relative z-10">
        <div className={getLayoutClasses()}>
          {layoutVariant === 'two_column' ? (
            <>
              {/* Left Column */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-6 leading-tight">
                    {valueProposition.headline}
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-3xl">
                    {valueProposition.subtitle}
                  </p>
                  
                  {renderCTAButtons()}
                  {renderSocialProof()}
                </div>
              </div>
              
              {/* Right Column */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
                    <div className="text-center mb-6">
                      <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Play className="h-8 w-8 text-primary-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Guarda come funziona</h3>
                      <p className="text-sm text-neutral-600 mt-2">
                        Scopri in 2 minuti come WikiGaiaLab trasforma le tue idee in realtà
                      </p>
                    </div>
                    <button
                      onClick={handleVideoPlay}
                      className="w-full bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Riproduci Demo
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-6 leading-tight">
                {valueProposition.headline.split(' ').map((word, index) => (
                  <span key={index} className={
                    word.toLowerCase().includes(valueProposition.emphasis) ? 
                    'text-secondary-600' : ''
                  }>
                    {word}{' '}
                  </span>
                ))}
              </h1>
              
              {/* Value Proposition */}
              <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-4xl mx-auto">
                {valueProposition.subtitle}
              </p>
              
              {/* Community Stats */}
              {renderCommunityStats()}
              
              {/* CTA Section */}
              {renderCTAButtons()}
              
              {/* Social Proof */}
              {renderSocialProof()}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;