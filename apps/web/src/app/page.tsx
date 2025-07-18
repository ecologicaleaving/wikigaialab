'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Zap, ArrowRight, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { abTesting } from '../lib/ab-testing';
import HeroSection from '../components/landing/HeroSection';
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
      {/* Enhanced Hero Section */}
      <HeroSection />
      
      {/* Interactive Demo */}
      <InteractiveDemo />
      
      {/* Onboarding Flow */}
      <OnboardingFlow />

      {/* How It Works */}
      <section id="come-funziona" className="py-20">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-center mb-12">
            Come Funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proponi</h3>
              <p className="text-neutral-600">
                Condividi problemi quotidiani che potrebbero essere risolti con semplici app digitali.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Vota</h3>
              <p className="text-neutral-600">
                Vota i problemi che ti interessano di più. A 100 voti, iniziamo lo sviluppo!
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accedi</h3>
              <p className="text-neutral-600">
                Chi ha votato ottiene accesso gratuito alle funzionalità premium dell&apos;app sviluppata.
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
      <section className="py-20 bg-gradient-to-br from-secondary-50 to-primary-50">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-secondary-600" />
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
                <Heart className="h-6 w-6 text-primary-600" />
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
              <BookOpen className="h-6 w-6 text-purple-600" />
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
      <section className="py-20 bg-primary-600 text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Discover More?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
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