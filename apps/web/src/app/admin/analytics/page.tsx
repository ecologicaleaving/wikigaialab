'use client';

import React from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AdminAnalyticsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ChartBarIcon className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-800">Analytics del Laboratorio</h1>
            <p className="text-teal-700 font-medium">Metriche e insights di WikiGaiaLab</p>
          </div>
        </div>
        <p className="text-teal-700">
          Analizza le metriche del laboratorio per comprendere come la comunità interagisce con i contenuti.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-700 truncate">
                    Visite Totali
                  </dt>
                  <dd className="text-lg font-medium text-blue-800">
                    15,423
                  </dd>
                  <dd className="text-xs text-blue-600">
                    +12% questa settimana
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-700 truncate">
                    Artigiani Attivi
                  </dt>
                  <dd className="text-lg font-medium text-emerald-800">
                    1,247
                  </dd>
                  <dd className="text-xs text-emerald-600">
                    +8% questo mese
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-teal-700 truncate">
                    Engagement Rate
                  </dt>
                  <dd className="text-lg font-medium text-teal-800">
                    78%
                  </dd>
                  <dd className="text-xs text-teal-600">
                    +3% questa settimana
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-rose-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-rose-700 truncate">
                    Problemi Risolti
                  </dt>
                  <dd className="text-lg font-medium text-rose-800">
                    89
                  </dd>
                  <dd className="text-xs text-rose-600">
                    +15% questo mese
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Traffic Analytics */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Traffico del Sito</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visualizzazioni delle pagine negli ultimi 30 giorni
            </p>
          </div>
          
          <div className="p-6">
            <div className="text-center py-12">
              <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Grafici in Arrivo
              </h3>
              <p className="text-gray-600">
                I grafici di traffico saranno disponibili presto
              </p>
            </div>
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Coinvolgimento Utenti</h2>
            <p className="text-sm text-gray-600 mt-1">
              Come gli artigiani interagiscono con i contenuti
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Voti medi per storia</span>
                <span className="text-sm text-gray-900">4.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Tempo medio sulla pagina</span>
                <span className="text-sm text-gray-900">3m 24s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Tasso di rimbalzo</span>
                <span className="text-sm text-gray-900">24%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Sessioni per utente</span>
                <span className="text-sm text-gray-900">2.8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Categorie</h2>
            <p className="text-sm text-gray-600 mt-1">
              Quali scaffali del laboratorio sono più attivi
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  <span className="text-sm font-medium">Ambiente</span>
                </div>
                <span className="text-sm text-gray-600">342 storie</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium">Tecnologia</span>
                </div>
                <span className="text-sm text-gray-600">287 storie</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Economia</span>
                </div>
                <span className="text-sm text-gray-600">198 storie</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium">Sociale</span>
                </div>
                <span className="text-sm text-gray-600">156 storie</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tendenze Recenti</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cosa sta succedendo nel laboratorio
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="border-l-4 border-teal-500 pl-4">
                <p className="text-sm font-medium text-gray-900">
                  Aumento storie ambiente
                </p>
                <p className="text-xs text-gray-600">
                  +25% nelle ultime 2 settimane
                </p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="text-sm font-medium text-gray-900">
                  Più voti su storie tech
                </p>
                <p className="text-xs text-gray-600">
                  Engagement +18% questo mese
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm font-medium text-gray-900">
                  Nuovi artigiani attivi
                </p>
                <p className="text-xs text-gray-600">
                  47 nuovi contributori attivi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}