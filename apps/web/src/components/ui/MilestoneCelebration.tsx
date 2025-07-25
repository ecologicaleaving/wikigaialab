'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MilestoneCelebrationProps {
  show: boolean;
  milestone: 25 | 50 | 75 | 100;
  onComplete?: () => void;
  duration?: number;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  show,
  milestone,
  onComplete,
  duration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    color: string;
    size: number;
  }>>([]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generate confetti pieces for workshop celebration
      const pieces = Array.from({ length: milestone === 100 ? 50 : 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2000,
        color: ['bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 'bg-red-400'][Math.floor(Math.random() * 4)],
        size: Math.random() * 8 + 4
      }));
      
      setConfettiPieces(pieces);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, milestone, duration, onComplete]);

  // Workshop celebration messages
  const getMilestoneMessage = (milestone: number): { emoji: string; title: string; subtitle: string } => {
    switch (milestone) {
      case 25:
        return {
          emoji: '🌱',
          title: 'Prima Pietra!',
          subtitle: 'La storia inizia a interessare il laboratorio'
        };
      case 50:
        return {
          emoji: '💪',
          title: 'A Metà Strada!',
          subtitle: 'La comunità si sta formando attorno a questa storia'
        };
      case 75:
        return {
          emoji: '🔥',
          title: 'Quasi Pronti!',
          subtitle: 'Mancano solo 25 cuori per iniziare il lavoro'
        };
      case 100:
        return {
          emoji: '🎉',
          title: 'Siamo in 100!',
          subtitle: 'Il maestro artigiano si mette al lavoro per tutti'
        };
      default:
        return {
          emoji: '✨',
          title: 'Traguardo Raggiunto!',
          subtitle: 'Il laboratorio celebra questo momento'
        };
    }
  };

  if (!isVisible) return null;

  const message = getMilestoneMessage(milestone);

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Confetti Background */}
      <div className="absolute inset-0 overflow-hidden">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className={`absolute ${piece.color} rounded-full animate-bounce`}
            style={{
              left: `${piece.left}%`,
              top: '-10px',
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              animationDelay: `${piece.delay}ms`,
              animationDuration: '3s',
              animationIterationCount: 'infinite',
              transform: `translateY(${window.innerHeight + 20}px)`,
              transition: `transform ${3 + Math.random() * 2}s ease-out`,
            }}
          />
        ))}
      </div>

      {/* Central Celebration Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`
            bg-white/95 backdrop-blur-sm border border-orange-200 shadow-2xl rounded-3xl p-8 mx-4 max-w-md text-center
            transform transition-all duration-500 ease-out
            ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          `}
          style={{
            animation: isVisible ? 'celebrationPulse 0.6s ease-out' : 'none'
          }}
        >
          {/* Workshop celebration emoji */}
          <div className="text-6xl mb-4 animate-bounce">
            {message.emoji}
          </div>

          {/* Milestone title */}
          <h2 className="text-2xl font-bold text-orange-800 mb-2">
            {message.title}
          </h2>

          {/* Workshop subtitle */}
          <p className="text-gray-600 leading-relaxed mb-4">
            {message.subtitle}
          </p>

          {/* Special message for 100 milestone */}
          {milestone === 100 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="text-lg font-semibold text-orange-800 mb-2">
                🛠️ Il Laboratorio è in Fermento!
              </div>
              <p className="text-sm text-orange-700">
                Questa storia ha conquistato il cuore di 100 vicini. 
                Il maestro artigiano inizierà presto a lavorare per creare 
                uno strumento che risolva questo problema per tutti.
              </p>
            </div>
          )}

          {/* Workshop gratitude */}
          <div className="mt-6 text-sm text-gray-500 italic">
            Grazie per aver contribuito al nostro laboratorio! 💝
          </div>
        </div>
      </div>

      {/* CSS for custom animation */}
      <style jsx>{`
        @keyframes celebrationPulse {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default MilestoneCelebration;