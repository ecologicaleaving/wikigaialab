'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  Lightbulb, 
  Vote, 
  Gift,
  Info,
  X,
  ChevronRight,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { analytics } from '../../lib/analytics';
import { useABTest } from '../../lib/ab-testing';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  completed: boolean;
  content: React.ReactNode;
}

interface UserInterest {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  selected: boolean;
}

interface OnboardingFlowProps {
  className?: string;
}

interface TooltipProps {
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, position, children, visible }) => {
  if (!visible) return <>{children}</>;

  const positionClasses = {
    top: '-top-10 left-1/2 transform -translate-x-1/2',
    bottom: '-bottom-10 left-1/2 transform -translate-x-1/2',
    left: '-left-2 top-1/2 transform -translate-y-1/2 -translate-x-full',
    right: '-right-2 top-1/2 transform -translate-y-1/2 translate-x-full'
  };

  return (
    <div className="relative">
      {children}
      <div className={`absolute ${positionClasses[position]} z-50`}>
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {content}
        </div>
      </div>
    </div>
  );
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // A/B Testing
  const { variant: onboardingVariant, trackConversion } = useABTest('onboarding_flow');

  const userInterests: UserInterest[] = [
    {
      id: 'productivity',
      name: 'Produttività',
      description: 'Strumenti per ottimizzare il lavoro e gestire il tempo',
      icon: <Zap className="h-5 w-5" />,
      examples: ['Time tracking', 'Task management', 'Note-taking'],
      selected: false
    },
    {
      id: 'communication',
      name: 'Comunicazione',
      description: 'Soluzioni per migliorare la comunicazione',
      icon: <Users className="h-5 w-5" />,
      examples: ['Chat tools', 'Video calls', 'Social platforms'],
      selected: false
    },
    {
      id: 'business',
      name: 'Business',
      description: 'Strumenti per gestire attività commerciali',
      icon: <Gift className="h-5 w-5" />,
      examples: ['CRM', 'Inventario', 'Fatturazione'],
      selected: false
    },
    {
      id: 'lifestyle',
      name: 'Stile di Vita',
      description: 'App per migliorare la vita quotidiana',
      icon: <Heart className="h-5 w-5" />,
      examples: ['Fitness', 'Cucina', 'Viaggi'],
      selected: false
    },
    {
      id: 'education',
      name: 'Educazione',
      description: 'Strumenti per apprendimento e insegnamento',
      icon: <Lightbulb className="h-5 w-5" />,
      examples: ['E-learning', 'Corsi online', 'Skill development'],
      selected: false
    },
    {
      id: 'health',
      name: 'Salute',
      description: 'App per monitorare e migliorare la salute',
      icon: <CheckCircle className="h-5 w-5" />,
      examples: ['Fitness tracker', 'Dieta', 'Benessere'],
      selected: false
    }
  ];

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'discover',
      title: 'Scopri i Problemi',
      description: 'Esplora i problemi proposti dalla community e trova quelli che ti interessano',
      icon: <Users className="h-6 w-6" />,
      action: 'Esplora Problemi',
      completed: false,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Ogni giorno, membri della community propongono problemi reali che potrebbero essere risolti 
            con semplici applicazioni digitali.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Esempi di problemi:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Organizzare ricette familiari</li>
              <li>• Gestire prenotazioni ristorante</li>
              <li>• Creare volantini per eventi</li>
              <li>• Tracciare tempo di lavoro</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'vote',
      title: 'Vota le Soluzioni',
      description: 'Esprimi la tua preferenza per i problemi che trovi più interessanti',
      icon: <Vote className="h-6 w-6" />,
      action: 'Vota Ora',
      completed: false,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Il tuo voto conta! Quando un problema raggiunge 100 voti, la community inizia 
            lo sviluppo di una soluzione.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Come funziona il voto:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• 1 voto = 1 problema per utente</li>
              <li>• 100 voti = sviluppo garantito</li>
              <li>• Chi vota ottiene accesso premium</li>
              <li>• Processo completamente trasparente</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'access',
      title: 'Accedi all\'App',
      description: 'Ottieni accesso gratuito alle funzionalità premium delle app sviluppate',
      icon: <Gift className="h-6 w-6" />,
      action: 'Accedi Gratis',
      completed: false,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Chi partecipa al voto ottiene accesso gratuito a vita alle funzionalità premium 
            dell'app sviluppata.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Vantaggi premium:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Accesso a tutte le funzionalità</li>
              <li>• Supporto prioritario</li>
              <li>• Aggiornamenti gratuiti</li>
              <li>• Personalizzazioni avanzate</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const [steps, setSteps] = useState<OnboardingStep[]>(onboardingSteps);

  useEffect(() => {
    // Track onboarding flow view
    analytics.trackFunnel('onboarding_flow_view', {
      onboarding_variant: onboardingVariant,
      user_authenticated: !!user
    });

    // Update progress
    const completed = steps.filter(step => step.completed).length;
    setProgressPercentage((completed / steps.length) * 100);
  }, [steps, onboardingVariant, user]);

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    analytics.trackEvent('onboarding_step_complete', {
      step_id: stepId,
      onboarding_variant: onboardingVariant
    });
    
    trackConversion('onboarding_step_complete');
  };

  const handleInterestSelect = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
    
    analytics.trackEvent('interest_selected', {
      interest_id: interestId,
      total_selected: selectedInterests.length
    });
  };

  const startGuidedTour = () => {
    setTourActive(true);
    setTourStep(0);
    setIsPlaying(true);
    
    analytics.trackEvent('guided_tour_start', {
      onboarding_variant: onboardingVariant
    });
  };

  const nextTourStep = () => {
    if (tourStep < steps.length - 1) {
      setTourStep(tourStep + 1);
      analytics.trackEvent('guided_tour_next', {
        step: tourStep + 1
      });
    } else {
      setTourActive(false);
      setIsPlaying(false);
      analytics.trackEvent('guided_tour_complete', {
        onboarding_variant: onboardingVariant
      });
      trackConversion('guided_tour_complete');
    }
  };

  const pauseTour = () => {
    setIsPlaying(false);
    analytics.trackEvent('guided_tour_pause', {
      step: tourStep
    });
  };

  const resumeTour = () => {
    setIsPlaying(true);
    analytics.trackEvent('guided_tour_resume', {
      step: tourStep
    });
  };

  const exitTour = () => {
    setTourActive(false);
    setIsPlaying(false);
    analytics.trackEvent('guided_tour_exit', {
      step: tourStep
    });
  };

  const renderProgressiveDisclosure = () => (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 mt-2 text-center">
          {Math.round(progressPercentage)}% completato
        </div>
      </div>

      {/* Interest Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">
          Seleziona i tuoi interessi
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {userInterests.map((interest) => (
            <div
              key={interest.id}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${selectedInterests.includes(interest.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => handleInterestSelect(interest.id)}
            >
              <div className="flex items-center mb-2">
                <div className={`
                  p-2 rounded-full mr-3
                  ${selectedInterests.includes(interest.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {interest.icon}
                </div>
                <h4 className="font-medium">{interest.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{interest.description}</p>
              <div className="text-xs text-gray-500">
                {interest.examples.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              border rounded-lg p-6 transition-all duration-300
              ${step.completed 
                ? 'border-green-500 bg-green-50' 
                : currentStep === index 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200'
              }
            `}
          >
            <div className="flex items-start">
              <div className={`
                flex items-center justify-center w-12 h-12 rounded-full mr-4
                ${step.completed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-primary-500 text-white'
                }
              `}>
                {step.completed ? <CheckCircle className="h-6 w-6" /> : step.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <Tooltip
                    content="Clicca per maggiori informazioni"
                    position="left"
                    visible={showTooltip === step.id}
                  >
                    <button
                      onClick={() => setShowTooltip(showTooltip === step.id ? null : step.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
                
                <p className="text-gray-600 mb-4">{step.description}</p>
                
                {/* Step Content */}
                {(currentStep === index || showTooltip === step.id) && (
                  <div className="mb-4">
                    {step.content}
                  </div>
                )}
                
                {!step.completed && (
                  <button
                    onClick={() => {
                      handleStepComplete(step.id);
                      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
                    }}
                    className="btn-primary btn-sm"
                  >
                    {step.action}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuidedTour = () => (
    <div className="space-y-6">
      {/* Tour Controls */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-primary-500 text-white rounded-full p-2 mr-3">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Tour Guidato</h3>
              <p className="text-sm text-gray-600">
                Passo {tourStep + 1} di {steps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={isPlaying ? pauseTour : resumeTour}
              className="btn-ghost btn-sm"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={exitTour}
              className="btn-ghost btn-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Current Tour Step */}
      {tourActive && (
        <div className="bg-white border-2 border-primary-500 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="bg-primary-500 text-white rounded-full p-3 mr-4">
              {steps[tourStep].icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{steps[tourStep].title}</h3>
              <p className="text-gray-600">{steps[tourStep].description}</p>
            </div>
          </div>
          
          <div className="mb-6">
            {steps[tourStep].content}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {tourStep + 1} di {steps.length}
            </div>
            <button
              onClick={nextTourStep}
              className="btn-primary btn-sm"
            >
              {tourStep === steps.length - 1 ? 'Completa Tour' : 'Continua'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSingleStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="bg-primary-500 text-white rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-bold mb-2">
            Benvenuto in WikiGaiaLab!
          </h3>
          <p className="text-gray-600">
            Scopri come trasformare i tuoi problemi quotidiani in soluzioni innovative
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.id} className="text-center">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  {step.icon}
                </div>
                <h4 className="font-semibold mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button
              onClick={() => {
                trackConversion('onboarding_complete');
                analytics.trackEvent('onboarding_single_step_complete', {
                  onboarding_variant: onboardingVariant
                });
              }}
              className="btn-primary btn-lg"
            >
              Inizia Ora
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOnboardingContent = () => {
    switch (onboardingVariant) {
      case 'progressive_disclosure':
        return renderProgressiveDisclosure();
      case 'guided_tour':
        return renderGuidedTour();
      case 'single_step':
        return renderSingleStep();
      default:
        return renderProgressiveDisclosure();
    }
  };

  return (
    <section className={`py-20 bg-gradient-to-br from-primary-50 to-white ${className}`}>
      <div className="container-narrow">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Come Iniziare
          </h2>
          <p className="text-xl text-gray-600">
            Tre semplici passaggi per trasformare le tue idee in realtà
          </p>
        </div>

        {onboardingVariant === 'guided_tour' && !tourActive && (
          <div className="text-center mb-8">
            <button
              onClick={startGuidedTour}
              className="btn-primary btn-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Inizia Tour Guidato
            </button>
          </div>
        )}

        {renderOnboardingContent()}
      </div>
    </section>
  );
};

export default OnboardingFlow;