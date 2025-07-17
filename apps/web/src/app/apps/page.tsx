'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PremiumBadge } from '@/components/premium/PremiumFeature';
import { UpgradePrompt } from '@/components/premium/UpgradePrompts';

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
  } | null;
}

interface AppsResponse {
  apps: App[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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

export default function AppsPage() {
  const [appsData, setAppsData] = useState<AppsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccessModel, setSelectedAccessModel] = useState<string>('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchApps();
  }, [currentPage, selectedAccessModel, showFeaturedOnly]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });

      if (selectedAccessModel) {
        params.append('accessModel', selectedAccessModel);
      }
      if (showFeaturedOnly) {
        params.append('featured', 'true');
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/apps?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }

      const data = await response.json();
      setAppsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading apps');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApps();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading && !appsData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="h-16 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scopri le Nostre App
          </h1>
          <p className="text-gray-600">
            Soluzioni innovative nate dalle sfide della community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca app..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedAccessModel}
                onChange={(e) => {
                  setSelectedAccessModel(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i modelli</option>
                <option value="freemium">Freemium</option>
                <option value="subscription">Abbonamento</option>
                <option value="one-time">Acquisto unico</option>
              </select>
              
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtra
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Apps Grid */}
        {appsData && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {appsData.pagination.totalCount} app trovate
                {searchQuery && ` per "${searchQuery}"`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {appsData.apps.map((app) => (
                <Link key={app.id} href={`/apps/${app.slug}`}>
                  <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 p-6 h-full">
                    {/* App Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xl">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {app.name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">v{app.version}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ACCESS_MODEL_COLORS[app.access_model]}`}>
                          {ACCESS_MODEL_LABELS[app.access_model]}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {app.description}
                    </p>

                    {/* Related Problem */}
                    {app.problems && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Risolve il problema:</p>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {app.problems.title}
                        </p>
                      </div>
                    )}

                    {/* Features Preview */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Funzionalità principali:</p>
                      <div className="space-y-1">
                        {app.base_features.slice(0, 2).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{feature}</span>
                          </div>
                        ))}
                        {app.premium_features.length > 0 && (
                          <div className="flex items-center gap-2">
                            <PremiumBadge size="xs" />
                            <span className="text-sm text-gray-600">
                              +{app.premium_features.length} funzionalità premium
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Download className="w-4 h-4" />
                          <span>Disponibile</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {appsData.pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!appsData.pagination.hasPrevPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Precedente
                </button>
                
                <span className="text-gray-600">
                  Pagina {appsData.pagination.currentPage} di {appsData.pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!appsData.pagination.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Successiva
                </button>
              </div>
            )}

            {appsData.apps.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessuna app trovata
                </h3>
                <p className="text-gray-600">
                  Prova a modificare i filtri di ricerca o controlla più tardi per nuove app.
                </p>
              </div>
            )}

            {/* Upgrade Prompt for Non-Premium Users */}
            {appsData && appsData.apps.length > 0 && (
              <div className="mt-12">
                <UpgradePrompt 
                  variant="card"
                  requiredVotes={5}
                  feature="Accesso Completo alle App"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}