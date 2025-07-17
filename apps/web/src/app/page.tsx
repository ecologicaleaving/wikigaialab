import { Heart, Users, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="container-narrow">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-6">
              WikiGaiaLab
            </h1>
            <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-3xl mx-auto">
              Una piattaforma dove la community propone problemi, vota le soluzioni più utili, 
              e accede ad app AI-powered create per tutti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary btn-lg">
                Inizia Subito
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="btn-outline btn-lg">
                Scopri di Più
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-center mb-12">
            Come Funziona
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proponi</h3>
              <p className="text-neutral-600">
                Condividi problemi quotidiani che potrebbero essere risolti con semplici app digitali.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Vota</h3>
              <p className="text-neutral-600">
                Vota i problemi che ti interessano di più. A 100 voti, iniziamo lo sviluppo!
              </p>
            </div>
            <div className="text-center">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Accedi</h3>
              <p className="text-neutral-600">
                Chi ha votato ottiene accesso gratuito alle funzionalità premium dell&apos;app sviluppata.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Current Problems Preview */}
      <section className="py-20 bg-neutral-100">
        <div className="container-narrow">
          <h2 className="text-3xl font-bold text-center mb-12">
            Problemi Attuali
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Problem Card Examples */}
            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-primary">Produttività</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>47 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Generatore di Volantini</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Uno strumento per creare volantini professionali per eventi locali senza competenze grafiche.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>

            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-secondary">Comunicazione</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>32 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Traduttore Locale</h3>
              <p className="text-sm text-neutral-600 mb-4">
                App per tradurre istantaneamente in dialetti locali per facilitare la comunicazione.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>

            <div className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="badge-success">Casa</span>
                <div className="flex items-center text-sm text-neutral-500">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>28 voti</span>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Organizzatore Ricette</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Sistema per organizzare ricette familiari con generazione automatica di liste spesa.
              </p>
              <button className="btn-ghost btn-sm w-full">
                Vota questo problema
              </button>
            </div>
          </div>
          <div className="text-center mt-8">
            <button className="btn-primary btn-md">
              Vedi Tutti i Problemi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-12">
        <div className="container-narrow">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">WikiGaiaLab</h3>
              <p className="text-sm">
                Innovazione sociale attraverso la tecnologia. Un progetto di collaborazione tra 
                Ass.Gaia e Ecologicaleaving.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Link Utili</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Come Funziona</a></li>
                <li><a href="#" className="hover:text-white">Problemi</a></li>
                <li><a href="#" className="hover:text-white">App Sviluppate</a></li>
                <li><a href="#" className="hover:text-white">Contatti</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Partner</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white">Ass.Gaia</a></li>
                <li><a href="#" className="hover:text-white">Ecologicaleaving</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 WikiGaiaLab. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}