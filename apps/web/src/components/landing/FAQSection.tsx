'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { faqStructuredData, generateJsonLdScript } from '../../lib/seo';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  popular: boolean;
}

interface FAQSectionProps {
  className?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ className = '' }) => {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqItems: FAQItem[] = [
    {
      id: 'how-it-works',
      question: 'Come funziona WikiGaiaLab?',
      answer: 'WikiGaiaLab è una piattaforma community dove puoi proporre problemi quotidiani, votare le soluzioni più interessanti e accedere gratuitamente alle app AI-powered sviluppate dalla comunità. Il processo è semplice: proponi un problema, la community vota, e quando si raggiungono 100 voti iniziamo lo sviluppo.',
      category: 'generale',
      keywords: ['funziona', 'processo', 'community', 'voti'],
      popular: true
    },
    {
      id: 'is-free',
      question: 'È gratuito utilizzare WikiGaiaLab?',
      answer: 'Sì, la partecipazione alla community è completamente gratuita. Non ci sono costi nascosti o abbonamenti. Chi vota un problema ottiene accesso gratuito alle funzionalità premium delle app sviluppate, il che significa che non paghi mai per le soluzioni che hai contribuito a creare.',
      category: 'costi',
      keywords: ['gratuito', 'free', 'costi', 'abbonamento', 'premium'],
      popular: true
    },
    {
      id: 'what-problems',
      question: 'Che tipo di problemi posso proporre?',
      answer: 'Puoi proporre qualsiasi problema quotidiano che potrebbe essere risolto con una semplice applicazione digitale. Esempi includono: gestione del tempo, organizzazione domestica, strumenti di produttività, comunicazione, salute e benessere, educazione. L\'importante è che sia un problema reale che potrebbe beneficiare di una soluzione digitale.',
      category: 'problemi',
      keywords: ['problemi', 'proporre', 'esempi', 'categorie'],
      popular: true
    },
    {
      id: 'voting-system',
      question: 'Come funziona il sistema di voto?',
      answer: 'Ogni utente registrato può votare un problema per volta. Una volta che un problema raggiunge 100 voti, iniziamo lo sviluppo. Il voto è permanente e garantisce l\'accesso gratuito alle funzionalità premium dell\'app sviluppata. Puoi cambiare il tuo voto solo se il problema non ha ancora raggiunto i 100 voti.',
      category: 'voto',
      keywords: ['voto', 'sistema', '100 voti', 'sviluppo', 'cambiare'],
      popular: true
    },
    {
      id: 'app-development',
      question: 'Come vengono sviluppate le app?',
      answer: 'Una volta che un problema raggiunge 100 voti, iniziamo lo sviluppo utilizzando tecnologie AI-powered e metodologie collaborative. Il processo include: analisi dei requisiti, progettazione UX/UI, sviluppo con intelligenza artificiale, testing con la community, e rilascio. Tutto è trasparente e la community può seguire i progressi.',
      category: 'sviluppo',
      keywords: ['sviluppo', 'app', 'AI', 'processo', 'tecnologie'],
      popular: false
    },
    {
      id: 'premium-access',
      question: 'Cosa include l\'accesso premium?',
      answer: 'L\'accesso premium include: tutte le funzionalità avanzate dell\'app, supporto prioritario dalla community, aggiornamenti gratuiti a vita, possibilità di influenzare lo sviluppo di nuove funzionalità, e accesso esclusivo alle beta version. Ricorda: ottenere l\'accesso premium è gratuito se hai votato il problema!',
      category: 'premium',
      keywords: ['premium', 'accesso', 'funzionalità', 'vantaggi', 'beta'],
      popular: false
    },
    {
      id: 'partners',
      question: 'Chi sono i partner di WikiGaiaLab?',
      answer: 'WikiGaiaLab è un progetto di collaborazione tra Ass.Gaia e Ecologicaleaving, due organizzazioni italiane focalizzate su innovazione sociale e tecnologia per il bene comune. La nostra missione è democratizzare l\'accesso alla tecnologia e creare soluzioni che beneficiano l\'intera comunità.',
      category: 'organizzazione',
      keywords: ['partner', 'Ass.Gaia', 'Ecologicaleaving', 'missione', 'organizzazione'],
      popular: false
    },
    {
      id: 'privacy-security',
      question: 'Come vengono protetti i miei dati?',
      answer: 'La privacy e la sicurezza sono priorità assolute. Siamo completamente conformi al GDPR, utilizziamo crittografia end-to-end per tutti i dati sensibili, e seguiamo il principio del "privacy by design". I tuoi dati non vengono mai venduti a terzi e hai sempre il controllo completo sulle tue informazioni.',
      category: 'privacy',
      keywords: ['privacy', 'sicurezza', 'GDPR', 'dati', 'protezione'],
      popular: false
    },
    {
      id: 'open-source',
      question: 'WikiGaiaLab è open source?',
      answer: 'Sì, WikiGaiaLab è completamente open source. Puoi visualizzare il codice sorgente, contribuire allo sviluppo, e verificare personalmente la sicurezza e la trasparenza della piattaforma. Crediamo che la tecnologia per il bene comune debba essere aperta e accessibile a tutti.',
      category: 'tecnico',
      keywords: ['open source', 'codice', 'trasparenza', 'contribuire'],
      popular: false
    },
    {
      id: 'mobile-app',
      question: 'Esiste un\'app mobile?',
      answer: 'Attualmente WikiGaiaLab è ottimizzata per il web mobile con un\'esperienza completamente responsive. Stiamo sviluppando app native per iOS e Android che saranno disponibili prossimamente. Nel frattempo, puoi aggiungere WikiGaiaLab alla home screen del tuo dispositivo per un\'esperienza simile a un\'app.',
      category: 'tecnico',
      keywords: ['mobile', 'app', 'iOS', 'Android', 'responsive'],
      popular: false
    },
    {
      id: 'community-guidelines',
      question: 'Quali sono le linee guida della community?',
      answer: 'La nostra community si basa su rispetto, collaborazione e innovazione. I problemi proposti devono essere costruttivi e realizzabili. Proibiamo spam, contenuti offensivi, e problemi che potrebbero causare danni. Tutti i membri devono mantenere un comportamento professionale e rispettoso.',
      category: 'community',
      keywords: ['linee guida', 'regole', 'comportamento', 'rispetto'],
      popular: false
    },
    {
      id: 'support',
      question: 'Come posso ottenere supporto?',
      answer: 'Offriamo supporto attraverso diversi canali: forum della community per discussioni pubbliche, email support per questioni private, documentazione completa online, e video tutorial. La community stessa è molto attiva nel fornire aiuto e supporto reciproco.',
      category: 'supporto',
      keywords: ['supporto', 'help', 'forum', 'assistenza', 'tutorial'],
      popular: false
    }
  ];

  const categories = [
    { id: 'all', name: 'Tutte le categorie' },
    { id: 'generale', name: 'Generale' },
    { id: 'costi', name: 'Costi e Prezzi' },
    { id: 'problemi', name: 'Problemi e Soluzioni' },
    { id: 'voto', name: 'Sistema di Voto' },
    { id: 'sviluppo', name: 'Sviluppo App' },
    { id: 'premium', name: 'Accesso Premium' },
    { id: 'organizzazione', name: 'Organizzazione' },
    { id: 'privacy', name: 'Privacy e Sicurezza' },
    { id: 'tecnico', name: 'Aspetti Tecnici' },
    { id: 'community', name: 'Community' },
    { id: 'supporto', name: 'Supporto' }
  ];

  const filteredItems = faqItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const popularItems = faqItems.filter(item => item.popular);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    
    analytics.trackEvent('faq_interaction', {
      action: openItems.includes(itemId) ? 'close' : 'open',
      question_id: itemId,
      question: faqItems.find(item => item.id === itemId)?.question || ''
    });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    
    if (term.length > 2) {
      analytics.trackEvent('faq_search', {
        search_term: term,
        results_count: filteredItems.length
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    analytics.trackEvent('faq_filter', {
      category: category,
      results_count: filteredItems.length
    });
  };

  return (
    <section className={`py-20 bg-neutral-50 ${className}`}>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateJsonLdScript(faqStructuredData),
        }}
      />
      
      <div className="container-narrow">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="h-8 w-8 text-primary-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">
              Domande Frequenti
            </h2>
          </div>
          <p className="text-xl text-gray-600">
            Trova risposte alle domande più comuni su WikiGaiaLab
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca nelle FAQ..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Questions */}
        {searchTerm === '' && selectedCategory === 'all' && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6 text-center">
              Domande Più Popolari
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {popularItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{item.question}</span>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {openItems.includes(item.id) && (
                    <div className="mt-3 text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nessuna domanda trovata
                </h3>
                <p className="text-gray-600">
                  Prova a modificare i termini di ricerca o seleziona una categoria diversa.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{item.question}</span>
                      {item.popular && (
                        <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                          Popolare
                        </span>
                      )}
                    </div>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <div className="bg-primary-50 rounded-lg p-8">
            <h3 className="text-lg font-semibold mb-2">
              Non trovi la risposta che cerchi?
            </h3>
            <p className="text-gray-600 mb-4">
              Il nostro team è sempre pronto ad aiutarti. Contattaci per qualsiasi domanda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@wikigaialab.com"
                className="btn-primary btn-md"
                onClick={() => analytics.trackEvent('faq_contact', { type: 'email' })}
              >
                Contatta il Supporto
              </a>
              <a
                href="/community"
                className="btn-outline btn-md"
                onClick={() => analytics.trackEvent('faq_contact', { type: 'community' })}
              >
                Vai al Forum
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;