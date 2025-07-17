'use client';

import React, { useState, useEffect } from 'react';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useAuth } from '@/hooks/useAuth';
import { PremiumFeature } from './PremiumFeature';
import {
  RocketLaunchIcon,
  BeakerIcon,
  LightBulbIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  SparklesIcon,
  CogIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface EarlyAccessFeature {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'coming_soon' | 'beta' | 'preview' | 'limited_access';
  category: 'analytics' | 'community' | 'productivity' | 'ai' | 'integration';
  estimatedRelease: string;
  progress: number; // 0-100
  tags: string[];
  enrollmentCount: number;
  maxEnrollment?: number;
  feedbackRequired: boolean;
  href?: string;
  enabled: boolean;
}

export function EarlyAccessFeatures() {
  const { accessData } = usePremiumAccess();
  const { user } = useAuth();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [enrolledFeatures, setEnrolledFeatures] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadEarlyAccessFeatures();
    loadUserEnrollments();
  }, []);

  const loadEarlyAccessFeatures = () => {
    const mockFeatures: EarlyAccessFeature[] = [
      {
        id: 'ai-problem-insights',
        name: 'AI Problem Insights',
        description: 'Analisi automatica dei problemi con intelligenza artificiale',
        longDescription: 'Il nostro sistema AI analizzerà automaticamente i problemi proposti, fornendo insights su categoria ottimale, potenziale viralità, e suggerimenti per migliorare la descrizione.',
        icon: LightBulbIcon,
        status: 'beta',
        category: 'ai',
        estimatedRelease: '2024-02-15',
        progress: 75,
        tags: ['AI', 'Analytics', 'Automation'],
        enrollmentCount: 127,
        maxEnrollment: 200,
        feedbackRequired: true,
        href: '/features/ai-insights',
        enabled: true
      },
      {
        id: 'smart-notifications',
        name: 'Notifiche Intelligenti',
        description: 'Sistema di notifiche personalizzate basato su ML',
        longDescription: 'Notifiche intelligenti che imparano dalle tue preferenze e comportamenti per inviarti solo contenuti davvero rilevanti al momento giusto.',
        icon: BoltIcon,
        status: 'preview',
        category: 'productivity',
        estimatedRelease: '2024-02-28',
        progress: 45,
        tags: ['Machine Learning', 'Personalization', 'UX'],
        enrollmentCount: 89,
        maxEnrollment: 150,
        feedbackRequired: true,
        href: '/features/smart-notifications',
        enabled: true
      },
      {
        id: 'collaborative-voting',
        name: 'Voto Collaborativo',
        description: 'Nuova modalità di voto con discussioni in tempo reale',
        longDescription: 'Permetti agli utenti di discutere e collaborare sui problemi prima di votare, con chat integrate e strumenti di moderazione avanzati.',
        icon: ChatBubbleLeftRightIcon,
        status: 'beta',
        category: 'community',
        estimatedRelease: '2024-03-10',
        progress: 60,
        tags: ['Collaboration', 'Real-time', 'Community'],
        enrollmentCount: 156,
        maxEnrollment: 250,
        feedbackRequired: true,
        href: '/features/collaborative-voting',
        enabled: true
      },
      {
        id: 'advanced-analytics',
        name: 'Analytics Avanzate 2.0',
        description: 'Dashboard analytics di prossima generazione',
        longDescription: 'Nuove visualizzazioni interattive, metriche predittive e insights comportamentali per comprendere meglio le dinamiche della community.',
        icon: ChartBarIcon,
        status: 'preview',
        category: 'analytics',
        estimatedRelease: '2024-03-20',
        progress: 30,
        tags: ['Data Visualization', 'Predictive Analytics', 'Insights'],
        enrollmentCount: 73,
        maxEnrollment: 100,
        feedbackRequired: true,
        enabled: true
      },
      {
        id: 'problem-templates',
        name: 'Template per Problemi',
        description: 'Template guidati per creare problemi di qualità',
        longDescription: 'Sistema di template intelligenti che guidano gli utenti nella creazione di problemi ben strutturati e dettagliati.',
        icon: CogIcon,
        status: 'coming_soon',
        category: 'productivity',
        estimatedRelease: '2024-04-05',
        progress: 15,
        tags: ['Templates', 'Guidance', 'Quality'],
        enrollmentCount: 45,
        feedbackRequired: false,
        enabled: false
      },
      {
        id: 'mobile-app',
        name: 'App Mobile Nativa',
        description: 'Applicazione mobile dedicata per iOS e Android',
        longDescription: 'App mobile nativa con funzionalità offline, notifiche push avanzate e interfaccia ottimizzata per dispositivi mobili.',
        icon: RocketLaunchIcon,
        status: 'coming_soon',
        category: 'integration',
        estimatedRelease: '2024-05-15',
        progress: 5,
        tags: ['Mobile', 'Native App', 'Cross-platform'],
        enrollmentCount: 289,
        feedbackRequired: true,
        enabled: false
      }
    ];

    setFeatures(mockFeatures);
  };

  const loadUserEnrollments = () => {
    // In real app, this would fetch from API
    // Simulate user already enrolled in some features
    const mockEnrollments = new Set(['ai-problem-insights', 'smart-notifications']);
    setEnrolledFeatures(mockEnrollments);
  };

  const handleEnrollment = async (featureId: string) => {
    try {
      // In real app: await fetch('/api/early-access/enroll', { method: 'POST', ... })
      
      setEnrolledFeatures(prev => new Set(prev).add(featureId));
      
      // Update enrollment count
      setFeatures(prev => prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enrollmentCount: feature.enrollmentCount + 1 }
          : feature
      ));
    } catch (error) {
      console.error('Failed to enroll:', error);
    }
  };

  const handleUnenrollment = async (featureId: string) => {
    try {
      // In real app: await fetch('/api/early-access/unenroll', { method: 'POST', ... })
      
      const newEnrollments = new Set(enrolledFeatures);
      newEnrollments.delete(featureId);
      setEnrolledFeatures(newEnrollments);
      
      // Update enrollment count
      setFeatures(prev => prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enrollmentCount: Math.max(0, feature.enrollmentCount - 1) }
          : feature
      ));
    } catch (error) {
      console.error('Failed to unenroll:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preview': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'limited_access': return 'bg-green-100 text-green-800 border-green-200';
      case 'coming_soon': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'beta': return 'Beta';
      case 'preview': return 'Anteprima';
      case 'limited_access': return 'Accesso Limitato';
      case 'coming_soon': return 'Prossimamente';
      default: return 'Sconosciuto';
    }
  };

  const categories = [
    { id: 'all', name: 'Tutte', icon: SparklesIcon },
    { id: 'ai', name: 'AI & ML', icon: LightBulbIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'community', name: 'Community', icon: HeartIcon },
    { id: 'productivity', name: 'Produttività', icon: CogIcon },
    { id: 'integration', name: 'Integrazione', icon: RocketLaunchIcon }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  const enrolledFeaturesData = features.filter(f => enrolledFeatures.has(f.id));

  return (
    <PremiumFeature
      requiredVotes={5}
      feature="Accesso Anticipato"
      fallback={
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-8 text-center">
          <BeakerIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Accesso Anticipato alle Nuove Funzionalità
          </h3>
          <p className="text-gray-600 mb-6">
            Testa in anteprima le funzionalità più innovative prima del rilascio ufficiale
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <RocketLaunchIcon className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Accesso Beta</h4>
                <p className="text-sm text-gray-600">Prova le funzionalità prima di tutti</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Feedback Diretto</h4>
                <p className="text-sm text-gray-600">Influenza lo sviluppo con i tuoi suggerimenti</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StarIcon className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Anteprime Esclusive</h4>
                <p className="text-sm text-gray-600">Accesso a funzionalità sperimentali</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <EyeIcon className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Roadmap Insights</h4>
                <p className="text-sm text-gray-600">Vedi cosa stiamo sviluppando</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Richiede almeno 5 voti per essere sbloccato
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2 mb-2">
            <BeakerIcon className="w-8 h-8 text-purple-500" />
            Accesso Anticipato
          </h2>
          <p className="text-gray-600">
            Partecipa allo sviluppo delle prossime funzionalità innovative
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">{enrolledFeaturesData.length}</p>
              <p className="text-sm text-gray-600">Feature Attive</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {features.filter(f => f.status === 'beta' || f.status === 'preview').length}
              </p>
              <p className="text-sm text-gray-600">In Beta/Anteprima</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {features.filter(f => f.status === 'coming_soon').length}
              </p>
              <p className="text-sm text-gray-600">In Arrivo</p>
            </div>
          </div>
        </div>

        {/* My Active Features */}
        {enrolledFeaturesData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              Le Tue Funzionalità Attive
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledFeaturesData.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <feature.icon className="w-8 h-8 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{feature.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feature.status)}`}>
                          {getStatusLabel(feature.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      <div className="flex items-center justify-between">
                        {feature.href && feature.enabled ? (
                          <Link
                            href={feature.href}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Accedi →
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">Non ancora disponibile</span>
                        )}
                        <button
                          onClick={() => handleUnenrollment(feature.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Disiscriviti
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatures.map((feature) => (
            <EarlyAccessFeatureCard
              key={feature.id}
              feature={feature}
              isEnrolled={enrolledFeatures.has(feature.id)}
              onEnroll={() => handleEnrollment(feature.id)}
              onUnenroll={() => handleUnenrollment(feature.id)}
            />
          ))}
        </div>

        {/* Beta Participation Guidelines */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">
                Linee Guida per la Partecipazione Beta
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Le funzionalità beta potrebbero contenere bug o comportamenti inaspettati</li>
                <li>• Il tuo feedback è fondamentale per migliorare le funzionalità</li>
                <li>• Alcune funzionalità potrebbero essere rimosse o modificate durante lo sviluppo</li>
                <li>• L'accesso alle funzionalità beta è limitato e soggetto a disponibilità</li>
                <li>• Non utilizzare le funzionalità beta per attività critiche</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeature>
  );
}

// Feature Card Component
interface EarlyAccessFeatureCardProps {
  feature: EarlyAccessFeature;
  isEnrolled: boolean;
  onEnroll: () => void;
  onUnenroll: () => void;
}

function EarlyAccessFeatureCard({ feature, isEnrolled, onEnroll, onUnenroll }: EarlyAccessFeatureCardProps) {
  const Icon = feature.icon;
  const canEnroll = !feature.maxEnrollment || feature.enrollmentCount < feature.maxEnrollment;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{feature.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feature.status)}`}>
              {getStatusLabel(feature.status)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{feature.description}</p>
        </div>
      </div>

      {/* Long Description */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
        {feature.longDescription}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progresso sviluppo</span>
          <span>{feature.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${feature.progress}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {feature.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Enrollment Info */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>{feature.enrollmentCount} utenti iscritti</span>
        {feature.maxEnrollment && (
          <span>
            {feature.maxEnrollment - feature.enrollmentCount} posti disponibili
          </span>
        )}
      </div>

      {/* Estimated Release */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <ClockIcon className="w-4 h-4" />
        <span>Rilascio previsto: {new Date(feature.estimatedRelease).toLocaleDateString('it-IT')}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isEnrolled ? (
          <>
            {feature.href && feature.enabled ? (
              <Link
                href={feature.href}
                className="flex-1 bg-purple-600 text-white text-center py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Accedi alla Feature
              </Link>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 text-center py-2 px-4 rounded-lg font-medium">
                Non ancora disponibile
              </div>
            )}
            <button
              onClick={onUnenroll}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Disiscriviti
            </button>
          </>
        ) : (
          <button
            onClick={onEnroll}
            disabled={!canEnroll}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              canEnroll
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canEnroll ? 'Iscriviti al Beta' : 'Posti Esauriti'}
          </button>
        )}
      </div>

      {/* Feedback Required Notice */}
      {feature.feedbackRequired && isEnrolled && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Il tuo feedback è essenziale per questa funzionalità
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions (already defined above)
function getStatusColor(status: string) {
  switch (status) {
    case 'beta': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'preview': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'limited_access': return 'bg-green-100 text-green-800 border-green-200';
    case 'coming_soon': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'beta': return 'Beta';
    case 'preview': return 'Anteprima';
    case 'limited_access': return 'Accesso Limitato';
    case 'coming_soon': return 'Prossimamente';
    default: return 'Sconosciuto';
  }
}