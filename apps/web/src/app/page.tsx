'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Calendar, ShoppingCart, HelpCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { UnauthenticatedLayout } from '../components/layout';
import { config } from '../lib/env';

export default function HomePage() {
  const { user } = useAuth();

  // Handle sharing a problem
  const handleShareProblem = () => {
    window.location.href = '/problems/new';
  };

  // Handle exploring problems
  const handleExplorProblems = () => {
    window.location.href = '/problems';
  };

  // Handle login/signup
  const handleGetStarted = () => {
    window.location.href = user ? '/problems/new' : '/login';
  };

  useEffect(() => {
    // Simple analytics tracking
    if (typeof window !== 'undefined') {
      analytics.initialize(config.NEXT_PUBLIC_GA_MEASUREMENT_ID);
      
      // Track page view
      analytics.trackFunnel('landing_page_view', {
        user_authenticated: !!user,
        referrer: document.referrer
      });
    }
  }, [user]);

  return (
    <UnauthenticatedLayout>
      {/* Hero Section - Simple and Warm */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
            Aiuto per i Piccoli Problemi della Vita
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Unisciti ai vicini che capiscono esattamente cosa stai passando
          </p>

          {/* Hero Image Placeholder - Will be replaced with real photo */}
          <div className="bg-gradient-to-r from-teal-200 to-emerald-200 rounded-3xl p-12 mb-10 mx-auto max-w-2xl">
            <div className="flex items-center justify-center gap-6">
              <Users className="h-16 w-16 text-teal-600" />
              <Heart className="h-20 w-20 text-red-500" />
              <Users className="h-16 w-16 text-teal-600" />
            </div>
            <p className="text-gray-700 mt-4 italic">
              "Persone vere che aiutano persone vere"
            </p>
          </div>

          {/* Primary Action */}
          <button 
            onClick={handleShareProblem}
            className="bg-teal-500 hover:bg-teal-600 text-white text-xl px-8 py-4 rounded-xl font-semibold shadow-lg transition-colors duration-200 mb-4"
          >
            Racconta il Tuo Problema
          </button>
          
          {/* Social Proof */}
          <p className="text-gray-600 text-lg">
            Oltre 2.000 vicini che si aiutano a vicenda
          </p>
        </div>
      </section>

      {/* Problem Examples Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4">
            Problemi che Risolviamo Ogni Giorno
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Nessun problema è troppo piccolo quando i vicini si prendono cura l'uno dell'altro
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Family Logistics */}
            <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8">
              <div className="bg-blue-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-blue-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Organizzazione Familiare
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Aiuto per organizzare orari familiari, accompagnamenti e attività. 
                Rendere la vita più semplice per i genitori impegnati.
              </p>
            </div>

            {/* Daily Tasks */}
            <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8">
              <div className="bg-green-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-green-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Commissioni Quotidiane
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Aiuto per la spesa, appuntamenti e commissioni varie. 
                Supporto quando ne hai più bisogno.
              </p>
            </div>

            {/* Community Questions */}
            <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8">
              <div className="bg-purple-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <HelpCircle className="h-12 w-12 text-purple-700" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-4">
                Domande di Vicinato
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Trovare servizi affidabili, raccomandazioni locali e consigli 
                da persone che vivono nelle vicinanze.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Maximum Simplicity */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4">
            È Semplice Come Chiedere a un Amico
          </h2>
          <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Tre semplici passi per ottenere l'aiuto di cui hai bisogno
          </p>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-teal-700">1</span>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  Condividi il Tuo Problema
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Raccontaci di cosa hai bisogno, proprio come chiederesti a un vicino di casa. 
                  Usa parole semplici - siamo tutti persone normali qui.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-pink-100 to-red-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <Heart className="h-12 w-12 text-red-600" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  Altri si Riconoscono
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  I vicini che hanno lo stesso problema ti sostengono con un cuore. 
                  Quando abbastanza persone condividono lo stesso bisogno, sappiamo che è importante.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-serif font-semibold text-gray-900 mb-3">
                  Aiutiamo Insieme
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Quando abbastanza persone hanno bisogno dello stesso aiuto, creiamo insieme una soluzione. 
                  Persone vere che aiutano persone vere, non tecnologia complicata.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8">
            Spazio Sicuro per Persone Vere
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Nessuna Vendita
              </h4>
              <p className="text-gray-700">
                Non vendiamo mai le tue informazioni e non ti inviamo pubblicità indesiderata
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Veri Vicini
              </h4>
              <p className="text-gray-700">
                Persone vere con nomi veri che aiutano nella loro comunità
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-2xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Comunità Gentile
              </h4>
              <p className="text-gray-700">
                Linee guida rispettose mantengono il nostro spazio accogliente per tutti
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
            Pronto per Iniziare?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Unisciti ai tuoi vicini e inizia a ricevere aiuto per le sfide quotidiane
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-teal-600 text-xl px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg"
            >
              Inizia a Ricevere Aiuto
            </button>
            <button 
              onClick={handleExplorProblems}
              className="border-2 border-white text-white text-xl px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-teal-600 transition-colors duration-200"
            >
              Vedi Cosa Chiedono gli Altri
            </button>
          </div>
        </div>
      </section>

    </UnauthenticatedLayout>
  );
}