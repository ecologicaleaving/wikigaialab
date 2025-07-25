'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Settings, User, Bell, Shield, Palette, Heart } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout 
        title="Il Mio Banco di Lavoro"
        showBreadcrumbs={true}
        showNotifications={false}
      >
        <div className="space-y-8">
          {/* Header Section with WikiGaia Branding */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="text-teal-600" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-teal-800">
                  Il Mio Banco di Lavoro
                </h2>
                <p className="text-teal-700">
                  Sistemare i tuoi attrezzi del laboratorio
                </p>
              </div>
            </div>
            <p className="text-teal-700 mb-4">
              Qui puoi sistemare i tuoi attrezzi e scegliere come vuoi che funzioni 
              il tuo angolo del laboratorio. Ogni artigiano ha le sue preferenze!
            </p>
          </div>

          {/* Settings Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <User className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Il Mio Profilo
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Come ti presenti agli altri membri del laboratorio. 
                Il tuo nome, la tua storia, le tue competenze.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Il maestro sta preparando questi attrezzi
                </p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Bell className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Le Novità del Laboratorio
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Quando e come vuoi essere avvisato delle novità: 
                nuovi problemi, soluzioni pronte, messaggi del maestro.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Sistema di notifiche in preparazione
                </p>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Shield className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                La Mia Privacy
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Chi può vedere i tuoi problemi, i tuoi consensi, 
                la tua attività nel laboratorio. Tu decidi.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Controlli privacy in sviluppo
                </p>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Palette className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                L'Aspetto del Laboratorio
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Come vuoi che appaia il tuo laboratorio: colori, 
                dimensioni dei caratteri, tema chiaro o scuro.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Personalizzazione in arrivo
                </p>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Heart className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Le Mie Preferenze
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Che tipo di problemi ti interessano di più, 
                come vuoi che il laboratorio ti suggerisca le novità.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Sistema di raccomandazioni in sviluppo
                </p>
              </div>
            </div>
          </div>

          {/* Construction Notice - Enhanced with WikiGaia Personality */}
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-green-50 border border-teal-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🛠️</div>
            <h2 className="text-2xl font-bold text-teal-800 mb-4">
              Il Maestro Sta Preparando i Tuoi Attrezzi
            </h2>
            <p className="text-teal-700 max-w-2xl mx-auto">
              Come ogni bravo artigiano, anche noi stiamo preparando con cura tutti gli strumenti 
              che ti serviranno per personalizzare il tuo angolo di laboratorio. Ogni dettaglio 
              è pensato per rendere la tua esperienza unica e familiare.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="bg-white rounded-full px-6 py-2 border border-teal-300">
                <p className="text-teal-800 text-sm font-medium">
                  Torna presto per scoprire le novità!
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}