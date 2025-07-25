'use client';

import React, { useEffect } from 'react';
import { Heart, Users, Calendar, ShoppingCart, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../lib/analytics';
import { UnauthenticatedLayout } from '../components/layout';
import { config } from '../lib/env';

export default function HomePage() {
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

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
      {/* Hero Section - Enhanced with sophisticated animations */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-teal-50 to-emerald-50 overflow-hidden">
        {/* Floating background elements */}
        <motion.div 
          className="absolute top-10 left-10 w-20 h-20 bg-teal-200/30 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-32 right-16 w-12 h-12 bg-emerald-300/40 rounded-full"
          animate={{ 
            y: [0, 15, 0],
            x: [0, -10, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-32 w-16 h-16 bg-teal-300/25 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -180, -360]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          style={{ y, opacity }}
        >
          {/* Main Headline with staggered animation */}
          <motion.h1 
            className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Aiuto per i Piccoli Problemi della Vita
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Condividi il tuo problema, insieme creiamo la soluzione
          </motion.p>

          {/* Hero Image with enhanced interactivity */}
          <motion.div 
            className="bg-gradient-to-r from-teal-200 to-emerald-200 rounded-3xl p-12 mb-10 mx-auto max-w-2xl cursor-pointer group"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div className="flex items-center justify-center gap-6">
              <motion.div
                whileHover={{ 
                  scale: 1.2,
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="h-16 w-16 text-teal-600 transition-colors group-hover:text-teal-700" />
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ 
                  scale: 1.2,
                  rotate: -5
                }}
              >
                <Heart className="h-20 w-20 text-red-500 transition-colors group-hover:text-red-600" />
              </motion.div>
              <motion.div
                whileHover={{ 
                  scale: 1.2,
                  rotate: -5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Users className="h-16 w-16 text-teal-600 transition-colors group-hover:text-teal-700" />
              </motion.div>
            </div>
            <motion.p 
              className="text-gray-700 mt-4 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              "Persone vere che aiutano persone vere"
            </motion.p>
          </motion.div>

          {/* Primary Action with magnetic hover */}
          <motion.button 
            onClick={handleShareProblem}
            className="relative bg-teal-500 hover:bg-teal-600 text-white text-xl px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 mb-4 group overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(20, 184, 166, 0.4)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
            <span className="relative z-10">Racconta il Tuo Problema</span>
            <motion.div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
              initial={{ x: -10 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </motion.button>
          
          {/* Social Proof */}
          <motion.p 
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Oltre 2.000 problemi trasformati in soluzioni condivise
          </motion.p>
        </motion.div>
      </section>

      {/* Problem Examples Section with enhanced card interactions */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Problemi che Risolviamo Ogni Giorno
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Quando abbastanza persone condividono lo stesso problema, creiamo insieme la soluzione
          </motion.p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Family Logistics */}
            <motion.div 
              className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 cursor-pointer group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)",
                y: -10
              }}
            >
              <motion.div 
                className="bg-blue-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-300 transition-colors duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Calendar className="h-12 w-12 text-blue-700 group-hover:text-blue-800 transition-colors" />
              </motion.div>
              <motion.h3 
                className="text-2xl font-serif font-semibold text-gray-900 mb-4"
                whileHover={{ color: "#1d4ed8" }}
              >
                Organizzazione Familiare
              </motion.h3>
              <p className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-800 transition-colors">
                Aiuto per organizzare orari familiari, accompagnamenti e attività. 
                Rendere la vita più semplice per i genitori impegnati.
              </p>
            </motion.div>

            {/* Daily Tasks */}
            <motion.div 
              className="text-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 cursor-pointer group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(34, 197, 94, 0.15)",
                y: -10
              }}
            >
              <motion.div 
                className="bg-green-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-green-300 transition-colors duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: -5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <ShoppingCart className="h-12 w-12 text-green-700 group-hover:text-green-800 transition-colors" />
              </motion.div>
              <motion.h3 
                className="text-2xl font-serif font-semibold text-gray-900 mb-4"
                whileHover={{ color: "#16a34a" }}
              >
                Commissioni Quotidiane
              </motion.h3>
              <p className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-800 transition-colors">
                Aiuto per la spesa, appuntamenti e commissioni varie. 
                Supporto quando ne hai più bisogno.
              </p>
            </motion.div>

            {/* Community Questions */}
            <motion.div 
              className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 cursor-pointer group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(168, 85, 247, 0.15)",
                y: -10
              }}
            >
              <motion.div 
                className="bg-purple-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-300 transition-colors duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <HelpCircle className="h-12 w-12 text-purple-700 group-hover:text-purple-800 transition-colors" />
              </motion.div>
              <motion.h3 
                className="text-2xl font-serif font-semibold text-gray-900 mb-4"
                whileHover={{ color: "#9333ea" }}
              >
                Domande di Vicinato
              </motion.h3>
              <p className="text-gray-700 text-lg leading-relaxed group-hover:text-gray-800 transition-colors">
                Trovare servizi affidabili, raccomandazioni locali e consigli 
                da persone che vivono nelle vicinanze.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced with sophisticated step animations */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 bg-emerald-200/20 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-24 h-24 bg-teal-200/30 rounded-full"
          animate={{ 
            y: [0, -30, 0],
            x: [0, 20, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Dal Problema alla Soluzione Condivisa
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Tre semplici passi per trasformare il tuo problema in una soluzione per tutti
          </motion.p>

          <div className="space-y-12">
            {/* Step 1 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center gap-8 group"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5
                }}
                animate={{ 
                  boxShadow: ["0 0 0 0 rgba(20, 184, 166, 0.4)", "0 0 0 10px rgba(20, 184, 166, 0)", "0 0 0 0 rgba(20, 184, 166, 0)"]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5
                }}
              >
                <span className="text-3xl font-bold text-teal-700">1</span>
              </motion.div>
              <div className="text-center md:text-left">
                <motion.h3 
                  className="text-2xl font-serif font-semibold text-gray-900 mb-3"
                  whileHover={{ color: "#0f766e" }}
                >
                  Condividi il Tuo Problema
                </motion.h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Descrivi il tuo problema con parole semplici. Ogni problema condiviso 
                  è il primo passo verso una soluzione che aiuterà anche altri.
                </p>
              </div>
            </motion.div>

            {/* Connecting line */}
            <motion.div 
              className="flex justify-center"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="w-0.5 h-8 bg-gradient-to-b from-teal-300 to-red-300"></div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center gap-8 group"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="bg-gradient-to-br from-pink-100 to-red-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: -5
                }}
                animate={{ 
                  boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.4)", "0 0 0 10px rgba(239, 68, 68, 0)", "0 0 0 0 rgba(239, 68, 68, 0)"]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 1.5
                }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Heart className="h-12 w-12 text-red-600" />
                </motion.div>
              </motion.div>
              <div className="text-center md:text-left">
                <motion.h3 
                  className="text-2xl font-serif font-semibold text-gray-900 mb-3"
                  whileHover={{ color: "#dc2626" }}
                >
                  La Comunità si Mobilita
                </motion.h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Le persone che vivono lo stesso problema ti sostengono con un cuore. 
                  Quando raggiungiamo abbastanza sostegno, sappiamo che vale la pena creare una soluzione.
                </p>
              </div>
            </motion.div>

            {/* Connecting line */}
            <motion.div 
              className="flex justify-center"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="w-0.5 h-8 bg-gradient-to-b from-red-300 to-blue-300"></div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center gap-8 group"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5
                }}
                animate={{ 
                  boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.4)", "0 0 0 10px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0)"]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: 2.5
                }}
              >
                <Users className="h-12 w-12 text-blue-600" />
              </motion.div>
              <div className="text-center md:text-left">
                <motion.h3 
                  className="text-2xl font-serif font-semibold text-gray-900 mb-3"
                  whileHover={{ color: "#2563eb" }}
                >
                  Creiamo la Soluzione
                </motion.h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Il nostro team sviluppa strumenti e risorse specifiche per risolvere il problema. 
                  Ogni soluzione nasce dall'esperienza reale di chi vive quella difficoltà.
                </p>
              </div>
            </motion.div>
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

      {/* Final Call to Action - Enhanced with sophisticated interactions */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative overflow-hidden">
        {/* Animated background particles */}
        <motion.div 
          className="absolute top-10 left-20 w-2 h-2 bg-white/30 rounded-full"
          animate={{ 
            y: [0, -100, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: 0
          }}
        />
        <motion.div 
          className="absolute top-40 right-32 w-1 h-1 bg-white/40 rounded-full"
          animate={{ 
            y: [0, -80, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            delay: 1
          }}
        />
        <motion.div 
          className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-white/25 rounded-full"
          animate={{ 
            y: [0, -60, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            delay: 2
          }}
        />

        <motion.div 
          className="max-w-3xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold mb-6"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Pronto per Iniziare?
          </motion.h2>
          <motion.p 
            className="text-xl mb-10 opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Condividi il tuo problema e contribuisci a creare soluzioni che aiuteranno migliaia di persone
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.button 
              onClick={handleGetStarted}
              className="relative bg-white text-teal-600 text-xl px-8 py-4 rounded-xl font-semibold shadow-lg overflow-hidden group"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <span className="relative z-10">Inizia a Ricevere Aiuto</span>
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-5 w-5 text-teal-600" />
              </motion.div>
            </motion.button>
            
            <motion.button 
              onClick={handleExplorProblems}
              className="relative border-2 border-white text-white text-xl px-8 py-4 rounded-xl font-semibold overflow-hidden group"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(255, 255, 255, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <motion.span 
                className="relative z-10 transition-colors duration-300 group-hover:text-teal-600"
                initial={false}
              >
                Scopri le Soluzioni Create
              </motion.span>
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-5 w-5 text-teal-600" />
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

    </UnauthenticatedLayout>
  );
}