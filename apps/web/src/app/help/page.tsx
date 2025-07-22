'use client';

import { UnauthenticatedLayout } from '@/components/layout/UnauthenticatedLayout';
import { HelpCircle, MessageCircle, FileText, Mail } from 'lucide-react';

export default function HelpPage() {
  return (
    <UnauthenticatedLayout
      title="Centro Aiuto"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <HelpCircle size={48} className="mx-auto text-primary-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Centro Aiuto WikiGaiaLab
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trova risposte alle tue domande e scopri come partecipare attivamente alla community.
            </p>
          </div>

          {/* Help Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <FileText className="text-primary-500 mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Come Iniziare
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Scopri come proporre problemi, votare e contribuire alla community.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-xs">
                  🚧 Guide dettagliate in arrivo
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <MessageCircle className="text-green-500 mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Domande Frequenti
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Trova risposte rapide alle domande più comuni della community.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-xs">
                  🚧 FAQ in preparazione
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <Mail className="text-orange-500 mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contatta il Supporto
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Non trovi quello che cerchi? Contatta direttamente il nostro team.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-xs">
                  🚧 Sistema di supporto in sviluppo
                </p>
              </div>
            </div>
          </div>

          {/* Construction Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🏗️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Centro Aiuto in Costruzione
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stiamo lavorando per creare un centro aiuto completo con guide dettagliate, 
              FAQ e supporto diretto. Torna presto per tutte le risorse di cui hai bisogno!
            </p>
          </div>
        </div>
      </div>
    </UnauthenticatedLayout>
  );
}