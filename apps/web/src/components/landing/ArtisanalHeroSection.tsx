'use client';

import React, { useEffect, useState } from 'react';
import { Heart, Users, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { analytics } from '../../lib/analytics';

interface CommunityStats {
  neighbors: number; // members -> neighbors
  stories: number;   // problems -> stories  
  hearts: number;    // votes -> hearts
  tools: number;     // apps -> tools
}

interface ArtisanalHeroSectionProps {
  className?: string;
}

export const ArtisanalHeroSection: React.FC<ArtisanalHeroSectionProps> = ({ 
  className = '' 
}) => {
  const { user, loading } = useAuth();
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    neighbors: 0,
    stories: 0,
    hearts: 0,
    tools: 0
  });

  useEffect(() => {
    // Track hero section view with artisanal workshop context
    analytics.trackFunnel('artisanal_hero_view', {
      user_authenticated: !!user,
      approach: 'artisanal_workshop'
    });

    // Fetch and animate community stats
    fetchCommunityStats();
  }, [user]);

  const fetchCommunityStats = async () => {
    try {
      // Mock stats with artisanal workshop language
      const mockStats = {
        neighbors: 1247,
        stories: 89,
        hearts: 3542,
        tools: 12
      };
      
      // Gentle animation for workshop warmth
      animateStats(mockStats);
    } catch (error) {
      console.error('Non riesco a caricare le statistiche della bottega:', error);
    }
  };

  const animateStats = (targetStats: CommunityStats) => {
    const duration = 2500; // Slower, more contemplative
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Gentle easing like workshop movements
      const easeOut = 1 - Math.pow(1 - progress, 2);
      
      setCommunityStats({
        neighbors: Math.floor(targetStats.neighbors * easeOut),
        stories: Math.floor(targetStats.stories * easeOut),
        hearts: Math.floor(targetStats.hearts * easeOut),
        tools: Math.floor(targetStats.tools * easeOut)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleEnterWorkshop = () => {
    analytics.trackFunnel('workshop_entry_click', {
      user_authenticated: !!user,
      source: 'artisanal_hero'
    });

    if (user) {
      window.location.href = '/problems';
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Warm workshop background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" />
      
      {/* Subtle artisanal pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20 lg:py-28">
          
          {/* Workshop greeting */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-amber-700 text-sm font-medium border border-amber-200 shadow-sm">
              <Wrench className="w-4 h-4" />
              <span>Benvenuti nella Bottega Digitale</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Main headline - artisanal workshop style */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="block text-amber-600">Una Bottega Artigianale</span>
            <span className="block">dove l'intelligenza artificiale</span>
            <span className="block text-orange-600">serve le persone comuni</span>
          </h1>

          {/* Warm description */}
          <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Come in un'antica bottega di paese, qui ci ritroviamo per raccontare 
            i nostri problemi quotidiani e creare insieme soluzioni semplici, 
            usando l'intelligenza artificiale come <strong>un attrezzo amichevole</strong> 
            nelle mani di chi sa ascoltare.
          </p>

          {/* Community stats - workshop style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-orange-100">
                <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{communityStats.neighbors}</div>
                <div className="text-sm text-gray-600 font-medium">Vicini di bottega</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-amber-100">
                <div className="w-8 h-8 mx-auto mb-2 text-amber-600 font-bold text-lg">📖</div>
                <div className="text-2xl font-bold text-gray-900">{communityStats.stories}</div>
                <div className="text-sm text-gray-600 font-medium">Storie condivise</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-red-100">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{communityStats.hearts}</div>
                <div className="text-sm text-gray-600 font-medium">Cuori donati</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-100">
                <Wrench className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{communityStats.tools}</div>
                <div className="text-sm text-gray-600 font-medium">Attrezzi creati</div>
              </div>
            </div>
          </div>

          {/* Workshop entry CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!loading && (
              <>
                {user ? (
                  <button
                    onClick={handleEnterWorkshop}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <span>Entra nella Bottega</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <GoogleLoginButton
                      onSuccess={() => {
                        analytics.trackFunnel('workshop_signup_success', {
                          source: 'artisanal_hero'
                        });
                      }}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <span>Unisciti alla Bottega</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </GoogleLoginButton>
                    
                    <button
                      onClick={() => window.location.href = '/problems'}
                      className="inline-flex items-center gap-2 px-6 py-3 text-orange-700 hover:text-orange-800 font-medium hover:bg-white/50 rounded-xl transition-all duration-200"
                    >
                      <span>Prima guarda i problemi</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Workshop promise */}
          <p className="text-sm text-gray-600 mt-8 max-w-md mx-auto">
            Come in ogni bottega che si rispetti, qui si entra senza impegno. 
            Guardate, ascoltate, e se vi piace, rimanete a lavorare con noi.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ArtisanalHeroSection;