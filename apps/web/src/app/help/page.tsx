'use client';

import { UnauthenticatedLayout } from '@/components/layout/UnauthenticatedLayout';
import { HelpCircle, MessageCircle, FileText, Mail, Heart, Users } from 'lucide-react';

export default function HelpPage() {
  return (
    <UnauthenticatedLayout
      title="Centro Aiuto"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <HelpCircle size={48} className="mx-auto text-teal-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Il Banco del Maestro - Centro Aiuto
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Benvenuto al banco del maestro! Qui troverai tutto quello che serve per iniziare 
              il tuo percorso nel nostro laboratorio artigiano digitale.
            </p>
          </div>

          {/* Help Sections */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <FileText className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                I Primi Passi nel Laboratorio
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Impara a portare i tuoi problemi al banco, donare il cuore ai progetti che ti interessano 
                e diventare parte della famiglia artigiana.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Il maestro sta preparando le guide
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Heart className="text-teal-600 mb-4 group-hover:scale-110 group-hover:text-red-500 transition-all duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Le Domande del Cuore
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Le domande che tutti i membri della famiglia si fanno quando arrivano al laboratorio. 
                Risposte semplici e genuine come piace a noi.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 FAQ del laboratorio in preparazione
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <Users className="text-teal-600 mb-4 group-hover:scale-110 transition-transform duration-200" size={32} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Parla con i Maestri
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Se non trovi quello che cerchi, i maestri artigiani sono sempre disponibili 
                ad ascoltare e aiutare. Nessuna domanda è troppo semplice.
              </p>
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <p className="text-teal-800 text-xs">
                  🔧 Sistema di supporto in sviluppo
                </p>
              </div>
            </div>
          </div>

          {/* Construction Notice */}
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-green-50 border border-teal-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🛠️</div>
            <h2 className="text-2xl font-bold text-teal-800 mb-4">
              Il Laboratorio Sta Crescendo
            </h2>
            <p className="text-teal-700 max-w-2xl mx-auto mb-6">
              Come ogni buon laboratorio artigiano, anche il nostro sta crescendo giorno dopo giorno. 
              Stiamo preparando guide dettagliate, risposte alle domande più comuni e un modo semplice 
              per parlare direttamente con i maestri. Torna presto per scoprire tutte le novità!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white rounded-full px-4 py-2 border border-teal-300 shadow-sm">
                <p className="text-teal-800 text-sm font-medium">
                  📚 Guide del laboratorio
                </p>
              </div>
              <div className="bg-white rounded-full px-4 py-2 border border-teal-300 shadow-sm">
                <p className="text-teal-800 text-sm font-medium">
                  💬 Chat con i maestri
                </p>
              </div>
              <div className="bg-white rounded-full px-4 py-2 border border-teal-300 shadow-sm">
                <p className="text-teal-800 text-sm font-medium">
                  🎯 Tutorial interattivi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnauthenticatedLayout>
  );
}