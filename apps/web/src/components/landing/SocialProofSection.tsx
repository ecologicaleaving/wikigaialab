'use client';

import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Shield, Users, Award, CheckCircle, Heart, TrendingUp } from 'lucide-react';
import { analytics } from '../../lib/analytics';
import { useABTest } from '../../lib/ab-testing';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  location: string;
  avatar: string;
  content: string;
  rating: number;
  problemVoted: string;
  appUsed: string;
  verified: boolean;
  videoUrl?: string;
}

interface TrustIndicator {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  color: string;
}

interface CommunityMetric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  growth: string;
  icon: React.ReactNode;
  color: string;
}

interface SocialProofSectionProps {
  className?: string;
}

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({ className = '' }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [metrics, setMetrics] = useState<CommunityMetric[]>([]);

  // A/B Testing
  const { variant: proofVariant, trackConversion } = useABTest('social_proof_position');
  const { variant: testimonialVariant, trackConversion: trackTestimonialConversion } = useABTest('testimonial_format');

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Marco Rossi',
      role: 'Proprietario Ristorante',
      company: 'Trattoria Il Borgo',
      location: 'Milano, Italia',
      avatar: '/images/testimonials/marco-rossi.svg',
      content: 'Grazie a WikiGaiaLab ho ottenuto un\'app per gestire le prenotazioni che ha rivoluzionato il mio ristorante. Ho semplicemente votato il problema e ora ho accesso gratuito a tutte le funzionalità premium!',
      rating: 5,
      problemVoted: 'Sistema Prenotazioni Ristoranti',
      appUsed: 'BookingMaster',
      verified: true
    },
    {
      id: '2',
      name: 'Giulia Bianchi',
      role: 'Insegnante',
      company: 'Scuola Primaria San Giuseppe',
      location: 'Roma, Italia',
      avatar: '/images/testimonials/giulia-bianchi.svg',
      content: 'L\'app per organizzare le attività scolastiche che ho ottenuto votando su WikiGaiaLab mi ha fatto risparmiare ore di lavoro ogni settimana. La community è fantastica!',
      rating: 5,
      problemVoted: 'Organizzatore Attività Scolastiche',
      appUsed: 'SchoolPlanner',
      verified: true
    },
    {
      id: '3',
      name: 'Andrea Verdi',
      role: 'Freelance Developer',
      location: 'Torino, Italia',
      avatar: '/images/testimonials/andrea-verdi.svg',
      content: 'WikiGaiaLab dimostra che la democratizzazione della tecnologia funziona. Ho partecipato al voto e ora uso quotidianamente l\'app per il time tracking. Geniale!',
      rating: 5,
      problemVoted: 'Time Tracking per Freelance',
      appUsed: 'TimeTracker Pro',
      verified: true,
      videoUrl: '/videos/testimonial-andrea.mp4'
    },
    {
      id: '4',
      name: 'Sofia Ferrari',
      role: 'Event Manager',
      company: 'EventHub',
      location: 'Firenze, Italia',
      avatar: '/images/testimonials/sofia-ferrari.svg',
      content: 'Ho proposto il problema della gestione ospiti per eventi e la community ha votato. Ora ho un\'app personalizzata che uso per tutti i miei eventi. Incredibile!',
      rating: 5,
      problemVoted: 'Gestione Ospiti Eventi',
      appUsed: 'GuestList Manager',
      verified: true
    },
    {
      id: '5',
      name: 'Roberto Neri',
      role: 'Commerciante',
      company: 'Negozio di Quartiere',
      location: 'Napoli, Italia',
      avatar: '/images/testimonials/roberto-neri.svg',
      content: 'La community di WikiGaiaLab ha creato un\'app per la gestione inventario che è perfetta per il mio negozio. Tutto gratis perché ho partecipato al voto!',
      rating: 5,
      problemVoted: 'Gestione Inventario Negozi',
      appUsed: 'StockManager',
      verified: true
    }
  ];

  const trustIndicators: TrustIndicator[] = [
    {
      id: 'gdpr',
      icon: <Shield className="h-8 w-8" />,
      title: 'GDPR Compliant',
      description: 'Rispettiamo la privacy e proteggiamo i tuoi dati',
      value: '100%',
      color: 'text-green-600'
    },
    {
      id: 'community',
      icon: <Users className="h-8 w-8" />,
      title: 'Community Attiva',
      description: 'Migliaia di membri che partecipano attivamente',
      value: '1.247',
      color: 'text-blue-600'
    },
    {
      id: 'opensource',
      icon: <Award className="h-8 w-8" />,
      title: 'Open Source',
      description: 'Codice trasparente e verificabile da tutti',
      value: '100%',
      color: 'text-purple-600'
    },
    {
      id: 'success',
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Apps Sviluppate',
      description: 'Soluzioni create e rilasciate alla community',
      value: '12',
      color: 'text-orange-600'
    }
  ];

  const communityMetrics: CommunityMetric[] = [
    {
      id: 'problems',
      label: 'Problemi Proposti',
      value: 89,
      suffix: '',
      growth: '+23%',
      icon: <Heart className="h-6 w-6" />,
      color: 'text-red-600'
    },
    {
      id: 'votes',
      label: 'Voti Totali',
      value: 3542,
      suffix: '',
      growth: '+45%',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-green-600'
    },
    {
      id: 'users',
      label: 'Utenti Attivi',
      value: 1247,
      suffix: '',
      growth: '+67%',
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600'
    },
    {
      id: 'satisfaction',
      label: 'Soddisfazione',
      value: 98,
      suffix: '%',
      growth: '+2%',
      icon: <Star className="h-6 w-6" />,
      color: 'text-yellow-600'
    }
  ];

  useEffect(() => {
    setMetrics(communityMetrics);
    
    // Track social proof section view
    analytics.trackFunnel('social_proof_view', {
      proof_variant: proofVariant,
      testimonial_variant: testimonialVariant
    });
  }, [proofVariant, testimonialVariant]);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
    
    analytics.trackEvent('testimonial_navigation', {
      action: 'next',
      testimonial_id: testimonials[currentTestimonial].id
    });
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
    
    analytics.trackEvent('testimonial_navigation', {
      action: 'prev',
      testimonial_id: testimonials[currentTestimonial].id
    });
  };

  const handleTestimonialClick = (testimonialId: string) => {
    analytics.trackEvent('testimonial_interaction', {
      action: 'click',
      testimonial_id: testimonialId
    });
    
    trackTestimonialConversion('testimonial_engagement');
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const renderTestimonialCarousel = () => (
    <div className="relative">
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="w-full flex-shrink-0 px-4"
              onClick={() => handleTestimonialClick(testimonial.id)}
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mr-4 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      {testimonial.name}
                      {testimonial.verified && (
                        <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    {testimonial.company && (
                      <p className="text-gray-500 text-xs">{testimonial.company}</p>
                    )}
                    <p className="text-gray-500 text-xs">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Quote className="h-6 w-6 text-primary-200 mb-2" />
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                </div>
                
                <div className="flex items-center justify-between">
                  {renderStars(testimonial.rating)}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Ha votato:</p>
                    <p className="text-xs font-medium text-primary-600">{testimonial.problemVoted}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Usa: <span className="font-medium text-gray-700">{testimonial.appUsed}</span>
                    </span>
                    {testimonial.videoUrl && (
                      <button className="text-primary-600 hover:text-primary-700 text-xs flex items-center">
                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zM8 14.5v-9l6 4.5-6 4.5z"/>
                        </svg>
                        Video
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={prevTestimonial}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
      >
        <ChevronLeft className="h-5 w-5 text-gray-600" />
      </button>
      
      <button
        onClick={nextTestimonial}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
      >
        <ChevronRight className="h-5 w-5 text-gray-600" />
      </button>
      
      <div className="flex justify-center mt-6 space-x-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentTestimonial(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentTestimonial ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );

  const renderTestimonialGrid = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.slice(0, 3).map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
          onClick={() => handleTestimonialClick(testimonial.id)}
        >
          <div className="flex items-center mb-4">
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              className="w-12 h-12 rounded-full mr-3 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default-avatar.svg';
              }}
            />
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center">
                {testimonial.name}
                {testimonial.verified && (
                  <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
                )}
              </h3>
              <p className="text-gray-600 text-sm">{testimonial.role}</p>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm mb-4">"{testimonial.content}"</p>
          
          <div className="flex items-center justify-between">
            {renderStars(testimonial.rating)}
            <span className="text-xs text-gray-500">{testimonial.location}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrustIndicators = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {trustIndicators.map((indicator) => (
        <div key={indicator.id} className="text-center">
          <div className={`flex items-center justify-center mb-4 ${indicator.color}`}>
            {indicator.icon}
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">{indicator.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{indicator.description}</p>
          <div className={`text-2xl font-bold ${indicator.color}`}>
            {indicator.value}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCommunityMetrics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.id} className="text-center">
          <div className={`flex items-center justify-center mb-2 ${metric.color}`}>
            {metric.icon}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metric.value.toLocaleString()}{metric.suffix}
          </div>
          <div className="text-sm text-gray-600">{metric.label}</div>
          <div className="text-xs text-green-600 font-medium">{metric.growth}</div>
        </div>
      ))}
    </div>
  );

  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Cosa dice la nostra Community
          </h2>
          <p className="text-xl text-gray-600">
            Storie reali di persone che hanno trasformato i loro problemi in soluzioni
          </p>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          {testimonialVariant === 'carousel' ? renderTestimonialCarousel() : renderTestimonialGrid()}
        </div>

        {/* Community Metrics */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            I numeri della nostra Community
          </h3>
          {renderCommunityMetrics()}
        </div>

        {/* Trust Indicators */}
        <div>
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Perché fidarsi di WikiGaiaLab
          </h3>
          {renderTrustIndicators()}
        </div>

        {/* Partnership Section */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            In collaborazione con
          </h3>
          <div className="flex justify-center items-center space-x-8">
            <img 
              src="/images/ass-gaia-logo.png" 
              alt="Ass.Gaia" 
              className="h-12 opacity-70 hover:opacity-100 transition-opacity"
            />
            <img 
              src="/images/ecologicaleaving-logo.png" 
              alt="Ecologicaleaving" 
              className="h-12 opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Innovazione sociale e tecnologia per il bene comune
          </p>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;