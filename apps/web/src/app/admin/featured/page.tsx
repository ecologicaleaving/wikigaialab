'use client';

import React from 'react';
import { 
  StarIcon,
  ChartBarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

export default function AdminFeaturedPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <StarIcon className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-800">Storie in Evidenza</h1>
            <p className="text-teal-700 font-medium">Gestione contenuti speciali del laboratorio</p>
          </div>
        </div>
        <p className="text-teal-700">
          Qui gestisci le storie che meritano di essere messe in evidenza nella vetrina di WikiGaiaLab.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <StarIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-700 truncate">
                    Storie in Evidenza
                  </dt>
                  <dd className="text-lg font-medium text-emerald-800">
                    12
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
                  <ChartBarIcon className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-teal-700 truncate">
                    Visualizzazioni Totali
                  </dt>
                  <dd className="text-lg font-medium text-teal-800">
                    2,847
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
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FlagIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-amber-700 truncate">
                    In Revisione
                  </dt>
                  <dd className="text-lg font-medium text-amber-800">
                    3
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Gestione Featured</h2>
          <p className="text-sm text-gray-600 mt-1">
            Promuovi e gestisci le storie più importanti del laboratorio
          </p>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sistema Featured in Sviluppo
            </h3>
            <p className="text-gray-600 mb-6">
              Il sistema per gestire le storie in evidenza è in fase di sviluppo. 
              Presto potrai selezionare e promuovere i contenuti migliori del laboratorio.
            </p>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-teal-700">
                <strong>Funzionalità previste:</strong><br/>
                • Selezione manuale storie<br/>
                • Algoritmo di raccomandazione<br/>
                • Programmazione pubblicazione<br/>
                • Analytics dettagliate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}