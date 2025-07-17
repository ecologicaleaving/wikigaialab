'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { abTesting } from '../lib/ab-testing';
import HeroSection from '../components/landing/HeroSection';
import InteractiveDemo from '../components/landing/InteractiveDemo';
import OnboardingFlow from '../components/landing/OnboardingFlow';
import SocialProofSection from '../components/landing/SocialProofSection';
import FAQSection from '../components/landing/FAQSection';
import { performance } from '../lib/performance';
import { UnauthenticatedLayout } from '../components/layout';

export default function HomePage() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize analytics, A/B testing, and performance monitoring
    if (typeof window !== 'undefined') {
      analytics.initialize('G-XXXXXXXXXX'); // Replace with actual GA4 tracking ID
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

      {/* Current Problems Preview */}
      <section className="py-20 bg-neutral-100">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-center mb-12">
            Problemi Attuali
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Problem Card Examples */}
            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-primary">Produttività</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>47 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Generatore di Volantini</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Uno strumento per creare volantini professionali per eventi locali senza competenze grafiche.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>

            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-secondary">Comunicazione</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>32 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Traduttore Locale</h3>
              <p className="text-sm text-neutral-600 mb-4">
                App per tradurre istantaneamente in dialetti locali per facilitare la comunicazione.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>

            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-success">Casa</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>28 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Organizzatore Ricette</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Sistema per organizzare ricette familiari con generazione automatica di liste spesa.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>
          </div>
          <div className="text-center mt-8">
            <button className="btn-primary btn-md">
              Vedi Tutti i Problemi
            </button>
          </div>
        </div>
      </section>

    </UnauthenticatedLayout>
  );
}