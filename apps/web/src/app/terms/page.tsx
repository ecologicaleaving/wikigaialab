'use client';

import { UnauthenticatedLayout } from '@/components/layout/UnauthenticatedLayout';
import { FileText, Scale, Shield } from 'lucide-react';

export default function TermsPage() {
  return (
    <UnauthenticatedLayout
      title="Termini di Servizio"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <FileText size={48} className="mx-auto text-primary-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Termini di Servizio
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I termini e le condizioni per l'utilizzo della piattaforma WikiGaiaLab.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <Scale className="text-blue-500 mx-auto mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Condizioni Generali
              </h3>
              <p className="text-gray-600 text-sm">
                Termini di utilizzo della piattaforma
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <Shield className="text-green-500 mx-auto mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Privacy & Sicurezza
              </h3>
              <p className="text-gray-600 text-sm">
                Protezione dei dati personali
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <FileText className="text-orange-500 mx-auto mb-4" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Regole Community
              </h3>
              <p className="text-gray-600 text-sm">
                Linee guida per la partecipazione
              </p>
            </div>
          </div>

          {/* Construction Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">⚖️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Termini di Servizio in Preparazione
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Stiamo definendo i termini di servizio completi per garantire un utilizzo 
              corretto e sicuro della piattaforma WikiGaiaLab.
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-4 max-w-md mx-auto">
              <p className="text-yellow-800 text-sm font-medium">
                📋 Documenti legali in fase di redazione
              </p>
            </div>
          </div>
        </div>
      </div>
    </UnauthenticatedLayout>
  );
}