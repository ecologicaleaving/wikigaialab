'use client';

import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Users, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';
import { analytics } from '../../lib/analytics';
import { useABTest } from '../../lib/ab-testing';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface DemoProblem {
  id: string;
  title: string;
  description: string;
  category: string;
  votes: number;
  hasVoted: boolean;
  impact: string;
  difficulty: 'Facile' | 'Medio' | 'Difficile';
}

interface InteractiveDemoProps {
  className?: string;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [demoStarted, setDemoStarted] = useState(false);
  const [userVoted, setUserVoted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<DemoProblem | null>(null);

  // A/B Testing
  const { variant: demoVariant, trackConversion } = useABTest('onboarding_flow');

  const demoSteps: DemoStep[] = [
    {
      id: 'discover',
      title: 'Scopri Problemi',
      description: 'Esplora i problemi proposti dalla community',
      action: 'Esplora',
      icon: <Users className="h-5 w-5" />,
      completed: false
    },
    {
      id: 'vote',
      title: 'Vota la Soluzione',
      description: 'Esprimi la tua preferenza per i problemi più interessanti',
      action: 'Vota',
      icon: <Heart className="h-5 w-5" />,
      completed: false
    },
    {
      id: 'access',
      title: 'Accedi all\'App',
      description: 'Ottieni accesso gratuito alle funzionalità premium',
      action: 'Accedi',
      icon: <CheckCircle className="h-5 w-5" />,
      completed: false
    }
  ];

  const demoProblems: DemoProblem[] = [
    {
      id: 'flyer-generator',
      title: 'Generatore di Volantini',
      description: 'Uno strumento per creare volantini professionali per eventi locali senza competenze grafiche.',
      category: 'Produttività',
      votes: 47,
      hasVoted: false,
      impact: 'Alto',
      difficulty: 'Medio'
    },
    {
      id: 'recipe-organizer',
      title: 'Organizzatore Ricette',
      description: 'Sistema per organizzare ricette familiari con generazione automatica di liste spesa.',
      category: 'Casa',
      votes: 34,
      hasVoted: false,
      impact: 'Medio',
      difficulty: 'Facile'
    },
    {
      id: 'local-translator',
      title: 'Traduttore Locale',
      description: 'App per tradurre istantaneamente in dialetti locali per facilitare la comunicazione.',
      category: 'Comunicazione',
      votes: 28,
      hasVoted: false,
      impact: 'Alto',
      difficulty: 'Difficile'
    }
  ];

  const [problems, setProblems] = useState<DemoProblem[]>(demoProblems);
  const [steps, setSteps] = useState<DemoStep[]>(demoSteps);

  useEffect(() => {
    if (demoStarted) {
      analytics.trackEvent('demo_started', {
        demo_variant: demoVariant,
        user_authenticated: !!user
      });
    }
  }, [demoStarted, demoVariant, user]);

  const startDemo = () => {
    setDemoStarted(true);
    setIsPlaying(true);
    setCurrentStep(0);
    
    analytics.trackEvent('demo_interaction', {
      action: 'start_demo',
      demo_variant: demoVariant
    });
  };

  const handleProblemClick = (problem: DemoProblem) => {
    setSelectedProblem(problem);
    
    // Complete first step
    const newSteps = [...steps];
    newSteps[0].completed = true;
    setSteps(newSteps);
    
    if (currentStep === 0) {
      setCurrentStep(1);
    }
    
    analytics.trackEvent('demo_interaction', {
      action: 'problem_selected',
      problem_id: problem.id,
      problem_title: problem.title
    });
  };

  const handleVote = (problemId: string) => {
    if (userVoted) return;
    
    setUserVoted(true);
    
    // Update problem votes
    setProblems(prev => prev.map(p => 
      p.id === problemId 
        ? { ...p, votes: p.votes + 1, hasVoted: true }
        : p
    ));
    
    // Complete second step
    const newSteps = [...steps];
    newSteps[1].completed = true;
    setSteps(newSteps);
    
    setCurrentStep(2);
    
    // Show success message after delay
    setTimeout(() => {
      setShowSuccess(true);
      
      // Complete third step
      const finalSteps = [...newSteps];
      finalSteps[2].completed = true;
      setSteps(finalSteps);
      
      analytics.trackEvent('demo_interaction', {
        action: 'vote_completed',
        problem_id: problemId
      });
      
      trackConversion('demo_completion');
    }, 1000);
  };

  const resetDemo = () => {
    setDemoStarted(false);
    setUserVoted(false);
    setShowSuccess(false);
    setIsPlaying(false);
    setCurrentStep(0);
    setSelectedProblem(null);
    setProblems(demoProblems);
    setSteps(demoSteps);
    
    analytics.trackEvent('demo_interaction', {
      action: 'reset_demo'
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    analytics.trackEvent('demo_interaction', {
      action: isPlaying ? 'pause_demo' : 'resume_demo'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Produttività':
        return 'bg-blue-100 text-blue-800';
      case 'Casa':
        return 'bg-green-100 text-green-800';
      case 'Comunicazione':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile':
        return 'text-green-600';
      case 'Medio':
        return 'text-yellow-600';
      case 'Difficile':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderDemoControls = () => (
    <div className="flex justify-center space-x-4 mb-8">
      {!demoStarted ? (
        <button
          onClick={startDemo}
          className="btn-primary btn-lg flex items-center"
        >
          <Play className="h-5 w-5 mr-2" />
          Inizia Demo Interattiva
        </button>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={togglePlayPause}
            className="btn-outline btn-md flex items-center"
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pausa' : 'Riprendi'}
          </button>
          <button
            onClick={resetDemo}
            className="btn-ghost btn-md flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Riavvia
          </button>
        </div>
      )}
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
              ${step.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : currentStep === index 
                  ? 'bg-primary-500 border-primary-500 text-white animate-pulse' 
                  : 'bg-white border-gray-300 text-gray-400'
              }
            `}>
              {step.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-2 transition-all duration-300
                ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (!demoStarted) return null;

    const step = steps[currentStep];
    
    return (
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary-100 rounded-full p-3 mr-4">
            {step.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">{step.title}</h3>
            <p className="text-sm text-primary-600">{step.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderProblems = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {problems.map((problem) => (
        <div
          key={problem.id}
          className={`
            card-hover cursor-pointer transition-all duration-300 transform
            ${selectedProblem?.id === problem.id ? 'ring-2 ring-primary-500 scale-105' : ''}
            ${problem.hasVoted ? 'bg-green-50 border-green-200' : ''}
          `}
          onClick={() => handleProblemClick(problem)}
        >
          <div className="flex items-start justify-between mb-3">
            <span className={`badge ${getCategoryColor(problem.category)}`}>
              {problem.category}
            </span>
            <div className="flex items-center text-sm text-neutral-500">
              <Heart className={`h-4 w-4 mr-1 ${problem.hasVoted ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="font-medium">{problem.votes} voti</span>
            </div>
          </div>
          
          <h3 className="font-semibold mb-2">{problem.title}</h3>
          <p className="text-sm text-neutral-600 mb-4">{problem.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-500">
              Impatto: <span className="font-medium">{problem.impact}</span>
            </span>
            <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
          
          <button
            className={`
              btn-sm w-full transition-all duration-300
              ${problem.hasVoted 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : currentStep >= 1 
                  ? 'btn-primary' 
                  : 'btn-ghost opacity-50 cursor-not-allowed'
              }
            `}
            onClick={(e) => {
              e.stopPropagation();
              if (currentStep >= 1 && !problem.hasVoted) {
                handleVote(problem.id);
              }
            }}
            disabled={currentStep < 1 || problem.hasVoted}
          >
            {problem.hasVoted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Voto registrato!
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Vota questo problema
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );

  const renderSuccessMessage = () => {
    if (!showSuccess) return null;

    return (
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Perfetto! Hai completato la demo
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Ora hai accesso gratuito a tutte le funzionalità premium del{' '}
            <strong>{selectedProblem?.title}</strong> quando sarà sviluppato!
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Cosa ottieni:</strong>
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Accesso gratuito a vita alle funzionalità premium</li>
              <li>• Notifiche prioritarie sugli sviluppi</li>
              <li>• Possibilità di influenzare le funzionalità</li>
              <li>• Supporto prioritario dalla community</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderCallToAction = () => (
    <div className="text-center">
      <p className="text-lg text-neutral-600 mb-6">
        {showSuccess 
          ? 'Pronto a iniziare per davvero? Unisciti alla community!'
          : 'Ti piace l\'idea? Prova l\'esperienza completa!'
        }
      </p>
      
      {user ? (
        <a
          href="/dashboard"
          className="btn-primary btn-lg inline-flex items-center"
          onClick={() => {
            analytics.trackFunnel('cta_click', { source: 'demo', user_authenticated: true });
            trackConversion('demo_to_dashboard');
          }}
        >
          Vai alla Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </a>
      ) : (
        <GoogleLoginButton
          size="lg"
          onStart={() => {
            analytics.trackFunnel('auth_start', { source: 'demo' });
            trackConversion('demo_to_auth');
          }}
          onSuccess={() => {
            analytics.trackFunnel('auth_complete', { source: 'demo' });
            trackConversion('auth_complete');
          }}
        >
          Registrati Ora
          <ArrowRight className="ml-2 h-5 w-5" />
        </GoogleLoginButton>
      )}
    </div>
  );

  return (
    <section className={`py-20 bg-gradient-to-r from-neutral-50 to-primary-50 ${className}`}>
      <div className="container-narrow">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Prova l'Esperienza WikiGaiaLab
          </h2>
          <p className="text-xl text-neutral-600">
            Interagisci con una demo del nostro sistema di voto e scopri come funziona
          </p>
        </div>

        {renderDemoControls()}
        
        {demoStarted && (
          <>
            {renderStepIndicator()}
            {renderCurrentStep()}
          </>
        )}

        {demoStarted && renderProblems()}
        
        {renderSuccessMessage()}
        
        {renderCallToAction()}
      </div>
    </section>
  );
};

export default InteractiveDemo;