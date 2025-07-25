'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Zap, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { abTesting } from '../lib/ab-testing';
import ArtisanalHeroSection from '../components/landing/ArtisanalHeroSection';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import OnboardingFlow from '../components/landing/OnboardingFlow';
import SocialProofSection from '../components/landing/SocialProofSection';
import FAQSection from '../components/landing/FAQSection';
import RecommendationWidget from '../components/recommendations/RecommendationWidget';
import CollectionWidget from '../components/recommendations/CollectionWidget';
import { performance } from '../lib/performance';
import { UnauthenticatedLayout } from '../components/layout';
import { config } from '../lib/env';

export default function HomePage() {
  const { user } = useAuth();

  // Handle navigation to problems page
  const handleProblemClick = (problemId: string) => {
    window.location.href = `/problems/${problemId}`;
  };

  // Handle navigation to collections page  
  const handleCollectionClick = (collectionId: string) => {
    window.location.href = `/collections/${collectionId}`;
  };

  // Handle navigation to discovery page
  const handleViewAllProblems = () => {
    window.location.href = '/problems';
  };

  // Handle navigation to specific discovery sections
  const handleViewAllTrending = () => {
    window.location.href = '/problems?tab=trending';
  };

  const handleViewAllCollections = () => {
    window.location.href = '/collections';
  };

  useEffect(() => {
    // Initialize analytics, A/B testing, and performance monitoring
    if (typeof window !== 'undefined') {
      analytics.initialize(config.NEXT_PUBLIC_GA_MEASUREMENT_ID);
      abTesting.initialize();
      performance.initialize();
      
      // Initialize tracking
      analytics.initializeScrollTracking();
      analytics.initializeTimeTracking();
      
      // Track page view
      analytics.trackFunnel('landing_page_view', {
        user_authenticated: !!user,
        referrer: document.referrer,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
      });
      
      // Track page performance
      setTimeout(() => {
        analytics.trackPagePerformance();
      }, 1000);
      
      // Register service worker for performance optimization
      performance.registerServiceWorker();
    }
  }, [user]);

  return (
    <UnauthenticatedLayout>
      {/* Artisanal Workshop Hero Section */}
      <ArtisanalHeroSection />
      
      {/* Interactive Demo */}
      <InteractiveDemo />
      
      {/* Onboarding Flow */}
      <OnboardingFlow />

      {/* Come Funziona il Laboratorio - Artisanal Workshop Style */}
      <section id="come-funziona-laboratorio" className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="container-narrow">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Come Funziona il Nostro Laboratorio
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Come in ogni laboratorio artigiano che si rispetti, qui si lavora insieme 
              con semplicità, pazienza e il calore della comunità.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1: Racconta */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <div className="text-3xl">🗣️</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Porta</h3>
              <p className="text-gray-600 leading-relaxed">
                Come al banco del laboratorio, porta ai maestri artigiani 
                i piccoli problemi quotidiani che vuoi risolvere. 
                <strong>Nessun problema è troppo semplice</strong> per non essere ascoltato.
              </p>
            </div>

            {/* Step 2: Ascolta */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <Heart className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Riconosci</h3>
              <p className="text-gray-600 leading-relaxed">
                Riconosci i problemi degli altri e se hai lo stesso problema, 
                dona il tuo cuore. <strong>Quando siamo in 100</strong>, 
                i maestri artigiani costruiscono la soluzione per tutti.
              </p>
            </div>

            {/* Step 3: Impara */}
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                <div className="text-3xl">🛠️</div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Impara</h3>
              <p className="text-gray-600 leading-relaxed">
                Chi ha donato il cuore può usare <strong>tutti gli attrezzi del laboratorio</strong> 
                gratuitamente. L'intelligenza artificiale diventa il vostro aiutante personale.
              </p>
            </div>
          </div>

          {/* Workshop Promise */}
          <div className="mt-16 text-center">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-teal-200 shadow-sm">
              <div className="text-2xl mb-4">🤝</div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                La Promessa del Laboratorio
              </h4>
              <p className="text-gray-700 leading-relaxed">
                Come in ogni laboratorio degno di questo nome, qui non si lavora per il profitto 
                ma per la soddisfazione di vedere le persone che usano con gioia 
                quello che abbiamo creato insieme. <strong>L'intelligenza artificiale 
                è solo un attrezzo</strong> - quello che conta è il cuore che ci mettete.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section */}
      <SocialProofSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Discovery Section - Trending Problems */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-teal-600" />
              <h2 className="text-3xl font-bold">Trending Now</h2>
            </div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Discover the most voted and engaging problems from our community
            </p>
          </div>
          
          <RecommendationWidget
            type="trending"
            limit={6}
            showExplanations={false}
            onProblemClick={handleProblemClick}
            onViewAll={handleViewAllTrending}
          />
        </div>
      </section>

      {/* Personalized Recommendations Section (authenticated users only) */}
      {user && (
        <section className="py-20 bg-white">
          <div className="container-narrow">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="h-6 w-6 text-teal-600" />
                <h2 className="text-3xl font-bold">Recommended for You</h2>
              </div>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Problems tailored to your interests and voting history
              </p>
            </div>
            
            <RecommendationWidget
              type="personal"
              limit={6}
              showExplanations={true}
              onProblemClick={handleProblemClick}
              onViewAll={() => window.location.href = '/problems?tab=personal'}
            />
          </div>
        </section>
      )}

      {/* Featured Collections Section */}
      <section className="py-20 bg-neutral-100">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="h-6 w-6 text-teal-600" />
              <h2 className="text-3xl font-bold">Curated Collections</h2>
            </div>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Explore hand-picked collections of problems organized by themes and categories
            </p>
          </div>
          
          <CollectionWidget
            featuredOnly={true}
            limit={4}
            showProblems={false}
            compact={false}
            onCollectionClick={handleCollectionClick}
            onViewAll={handleViewAllCollections}
          />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Discover More?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join our community and start exploring problems that matter to you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleViewAllProblems}
              className="btn-secondary btn-lg"
            >
              Explore All Problems
            </button>
            {!user && (
              <button 
                onClick={() => window.location.href = '/login'}
                className="btn-outline-white btn-lg"
              >
                Sign Up for Free
              </button>
            )}
          </div>
        </div>
      </section>

    </UnauthenticatedLayout>
  );
}