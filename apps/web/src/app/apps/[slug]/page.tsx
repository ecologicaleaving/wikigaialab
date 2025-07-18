'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Star, 
  Download, 
  Shield, 
  Check, 
  Lock, 
  Zap, 
  Heart, 
  Share2,
  ArrowLeft,
  ExternalLink,
  Users,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { PremiumFeature, PremiumBadge } from '@/components/premium/PremiumFeature';
import { AccessStatusCard } from '@/components/premium/AccessStatusCard';
import { QuickVotePrompt } from '@/components/premium/UpgradePrompts';

interface App {
  id: string;
  name: string;
  description: string;
  version: string;
  slug: string;
  access_model: 'freemium' | 'subscription' | 'one-time';
  base_features: string[];
  premium_features: string[];
  is_published: boolean;
  created_at: string;
  problems?: {
    id: string;
    title: string;
    description: string;
    status: string;
    vote_count: number;
    created_at: string;
  } | null;
}

interface UserAccess {
  canAccessPremium: boolean;
  votesNeeded: number;
  subscriptionStatus: string;
}

interface AppDetailResponse {
  app: App;
  userAccess: UserAccess | null;
  userUsage: any;
}

const ACCESS_MODEL_LABELS = {
  freemium: 'Freemium',
  subscription: 'Abbonamento',
  'one-time': 'Acquisto unico'
};

const ACCESS_MODEL_COLORS = {
  freemium: 'bg-green-100 text-green-800',
  subscription: 'bg-blue-100 text-blue-800',
  'one-time': 'bg-purple-100 text-purple-800'
};

export default function AppDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuth();
  const [appData, setAppData] = useState<AppDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      // Redirect to actual Volantino Generator app
      if (params.slug === 'volantino-generator') {
        window.location.href = '/apps/volantino-generator';
        return;
      }
      fetchAppDetail(params.slug as string);
    }
  }, [params.slug]);

  const fetchAppDetail = async (slug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('App non trovata');
        }
        throw new Error('Errore nel caricamento dell\'app');
      }

      const data = await response.json();
      setAppData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleDownload = () => {
    // Placeholder for download functionality
    alert('Funzionalità di download in sviluppo');
  };

  const handleShare = async () => {
    if (navigator.share && appData) {
      try {
        await navigator.share({
          title: appData.app.name,
          text: appData.app.description,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiato negli appunti!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiato negli appunti!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="h-24 bg-gray-300 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Errore</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link 
              href="/apps"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alle app
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!appData) {
    return null;
  }

  const { app, userAccess } = appData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/apps"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Tutte le app
          </Link>
        </div>

        {/* App Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {app.name.charAt(0)}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{app.name}</h1>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-gray-600">Versione {app.version}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${ACCESS_MODEL_COLORS[app.access_model]}`}>
                      {ACCESS_MODEL_LABELS[app.access_model]}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-lg mb-6">{app.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Disponibile per il download</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">
                    Pubblicata il {new Date(app.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                  <Download className="w-5 h-5" />
                  Scarica App
                </button>
                
                {app.access_model !== 'freemium' && (
                  <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Anteprima
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Related Problem */}
            {app.problems && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Problema Risolto
                </h2>
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-medium text-blue-900 mb-2">
                        {app.problems.title}
                      </h3>
                      <p className="text-blue-700 text-sm mb-3">
                        {app.problems.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-blue-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {app.problems.vote_count} voti
                        </span>
                        <span className="capitalize">{app.problems.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Comparison */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Funzionalità
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Features */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Funzionalità di Base
                  </h3>
                  <ul className="space-y-3">
                    {app.base_features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Premium Features */}
                {app.premium_features.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Funzionalità Premium
                      <PremiumBadge size="sm" />
                    </h3>
                    <PremiumFeature 
                      requiredVotes={5}
                      feature="Funzionalità Premium App"
                      fallback={
                        <ul className="space-y-3">
                          {app.premium_features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-400">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      }
                    >
                      <ul className="space-y-3">
                        {app.premium_features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </PremiumFeature>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Access Control */}
            {isAuthenticated ? (
              <AccessStatusCard />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Sblocca le Funzionalità Premium
                </h3>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm mb-3">
                    Accedi e vota 5 problemi per sbloccare tutte le funzionalità premium.
                  </p>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Accedi
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Vote Prompt */}
            {isAuthenticated && (
              <QuickVotePrompt />
            )}

            {/* App Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informazioni App</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versione</span>
                  <span className="font-medium">{app.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modello</span>
                  <span className="font-medium">{ACCESS_MODEL_LABELS[app.access_model]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pubblicata</span>
                  <span className="font-medium">
                    {new Date(app.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stato</span>
                  <span className="font-medium text-green-600">Attiva</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}