'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { MessageCircle, Send, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

// Artisanal workshop validation schema with encouraging messages
const storySchema = z.object({
  title: z.string()
    .min(5, 'Racconta un po\' di più nel titolo - almeno 5 caratteri')
    .max(100, 'Il titolo è perfetto, ma teniamolo sotto i 100 caratteri'),
  description: z.string()
    .min(20, 'Aiutaci a capire meglio - descrivi con almeno 20 caratteri')
    .max(1000, 'Bellissima storia! Teniamola sotto i 1000 caratteri'),
  category_id: z.string()
    .min(1, 'Scegli in quale scaffale della bottega collocare la tua storia'),
});

type StoryData = z.infer<typeof storySchema>;

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface ArtisanalStoryFormProps {
  onSubmit: (data: StoryData) => Promise<void>;
  categories: Category[];
  isSubmitting?: boolean;
}

export const ArtisanalStoryForm: React.FC<ArtisanalStoryFormProps> = ({
  onSubmit,
  categories,
  isSubmitting = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [encouragementLevel, setEncouragementLevel] = useState<'start' | 'good' | 'excellent' | 'perfect'>('start');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty, dirtyFields }
  } = useForm<StoryData>({
    resolver: zodResolver(storySchema),
    mode: 'onChange'
  });

  // Debug form state in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Form Debug:', {
      isValid,
      isDirty,
      errors,
      dirtyFields,
      watchedValues,
      selectedCategory: selectedCategory?.id
    });
  }

  const watchedValues = watch();
  const titleLength = watchedValues.title?.length || 0;
  const descriptionLength = watchedValues.description?.length || 0;

  // Auto-save functionality with encouraging feedback
  useEffect(() => {
    if (titleLength > 5 || descriptionLength > 10) {
      const timer = setTimeout(() => {
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [titleLength, descriptionLength]);

  // Dynamic encouragement based on form progress
  useEffect(() => {
    const progress = (titleLength / 50) + (descriptionLength / 200) + (selectedCategory ? 0.5 : 0);
    
    if (progress >= 2) setEncouragementLevel('perfect');
    else if (progress >= 1.5) setEncouragementLevel('excellent');
    else if (progress >= 1) setEncouragementLevel('good');
    else setEncouragementLevel('start');
  }, [titleLength, descriptionLength, selectedCategory]);

  const getEncouragementMessage = (): { emoji: string; message: string; color: string } => {
    switch (encouragementLevel) {
      case 'perfect':
        return {
          emoji: '✨',
          message: 'Perfetto! La tua storia è pronta per la bottega',
          color: 'text-green-600'
        };
      case 'excellent':
        return {
          emoji: '🌟',
          message: 'Eccellente! Sta prendendo forma una bella storia',
          color: 'text-blue-600'
        };
      case 'good':
        return {
          emoji: '👍',
          message: 'Bene! Continua così, la comunità apprezzerà',
          color: 'text-orange-600'
        };
      default:
        return {
          emoji: '💭',
          message: 'Inizia a raccontare la tua storia...',
          color: 'text-gray-500'
        };
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setValue('category_id', category.id, { shouldValidate: true, shouldDirty: true });
  };

  const encouragement = getEncouragementMessage();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Workshop header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
          <MessageCircle className="w-4 h-4" />
          <span>Racconta la Tua Storia</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Condividi con la Bottega
        </h1>
        
        <p className="text-gray-600 leading-relaxed">
          Come al tavolo della bottega, racconta ai vicini il tuo piccolo problema quotidiano. 
          Se altri si riconoscono nella tua storia, doneranno il loro cuore per farla diventare realtà.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Story title */}
        <Card className="p-6 bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-semibold text-gray-900">
                In poche parole, qual è il tuo problema?
              </label>
              <div className="text-sm text-gray-500">
                {titleLength}/100
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Scrivi un titolo che faccia capire subito di cosa si tratta
            </p>
          </div>

          <input
            {...register('title')}
            type="text"
            placeholder="Es: Organizzare le feste di compleanno dei bambini..."
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-lg ${
              errors.title 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : titleLength > 0 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                  : 'border-orange-200 focus:border-orange-500 focus:ring-orange-200'
            } focus:ring-2 focus:outline-none`}
          />

          {errors.title && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.title.message}</span>
            </div>
          )}

          {titleLength > 5 && !errors.title && (
            <div className="mt-2 flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Ottimo titolo! Così si capisce subito il problema</span>
            </div>
          )}
        </Card>

        {/* Story description */}
        <Card className="p-6 bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-semibold text-gray-900">
                Raccontaci la tua storia nel dettaglio
              </label>
              <div className="text-sm text-gray-500">
                {descriptionLength}/1000
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Descrivi quando ti capita, cosa provi, che difficoltà incontri. 
              Più dettagli aiutano gli altri a riconoscersi nella tua storia.
            </p>
          </div>

          <textarea
            {...register('description')}
            rows={6}
            placeholder="Es: Ogni volta che devo organizzare una festa per mia figlia, perdo ore a cercare fornitori, confrontare prezzi, coordinare tutto. Vorrei un aiuto per semplificare questo processo e non dimenticare nulla..."
            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none ${
              errors.description 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : descriptionLength > 20 
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                  : 'border-orange-200 focus:border-orange-500 focus:ring-orange-200'
            } focus:ring-2 focus:outline-none`}
          />

          {errors.description && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.description.message}</span>
            </div>
          )}

          {descriptionLength > 50 && !errors.description && (
            <div className="mt-2 flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Perfetto! Una storia così dettagliata aiuta molto la comunità</span>
            </div>
          )}
        </Card>

        {/* Category selection - workshop shelves */}
        <Card className="p-6 bg-gradient-to-br from-white to-orange-50/30 border-orange-100">
          <div className="mb-6">
            <label className="text-lg font-semibold text-gray-900 mb-2 block">
              In quale scaffale della bottega va la tua storia?
            </label>
            <p className="text-sm text-gray-600">
              Scegli la categoria che rappresenta meglio il tuo problema
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                  selectedCategory?.id === category.id
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-semibold text-gray-900">{category.name}</span>
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
              </button>
            ))}
          </div>

          {/* Hidden input to register category_id with react-hook-form */}
          <input type="hidden" {...register('category_id')} />

          {errors.category_id && (
            <div className="mt-4 flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.category_id.message}</span>
            </div>
          )}
        </Card>

        {/* Encouragement and submit */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{encouragement.emoji}</span>
              <div>
                <p className={`font-medium ${encouragement.color}`}>
                  {encouragement.message}
                </p>
                {autoSaved && (
                  <p className="text-sm text-gray-500 mt-1">
                    💾 La tua storia è stata salvata automaticamente
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`px-8 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 ${
                isValid && !isSubmitting
                  ? 'bg-orange-600 hover:bg-orange-700 hover:shadow-xl'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              title={!isValid ? `Form non valido: ${Object.keys(errors).join(', ')}` : 'Invia storia'}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Condividendo...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Condividi con la Bottega</span>
                </div>
              )}
            </Button>
          </div>

          {/* Workshop promise */}
          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-sm text-gray-600 text-center">
              🤝 La tua storia sarà visibile a tutta la comunità. 
              Se 100 vicini doneranno il loro cuore, inizieremo a lavorare per te.
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ArtisanalStoryForm;