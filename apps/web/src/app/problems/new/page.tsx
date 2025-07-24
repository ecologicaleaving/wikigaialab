'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '../../../components/layout';
import { useAuth } from '../../../hooks/useAuth';
import ArtisanalStoryForm from '../../../components/forms/ArtisanalStoryForm';
import { toast } from 'sonner';

interface StoryData {
  title: string;
  description: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function NewStoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock categories for artisanal workshop
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Vita di Famiglia',
        icon: '👨‍👩‍👧‍👦',
        description: 'Organizzare eventi, gestire i bambini, vita domestica'
      },
      {
        id: '2',
        name: 'Vita di Quartiere',
        icon: '🏘️',
        description: 'Aiutare i vicini, coordinare iniziative, vita comunitaria'
      },
      {
        id: '3',
        name: 'Passioni e Hobby',
        icon: '📚',
        description: 'Gestire gruppi, organizzare attività, condividere interessi'
      },
      {
        id: '4',
        name: 'Vita Lavorativa',
        icon: '💼',
        description: 'Organizzazione, produttività, collaborazione'
      },
      {
        id: '5',
        name: 'Casa e Giardino',
        icon: '🏡',
        description: 'Manutenzione, progetti fai-da-te, giardinaggio'
      },
      {
        id: '6',
        name: 'Salute e Benessere',
        icon: '🌱',
        description: 'Fitness, alimentazione, cura di sé'
      }
    ];

    setTimeout(() => {
      setCategories(mockCategories);
      setLoading(false);
    }, 500);
  }, []);

  const handleStorySubmit = async (data: StoryData) => {
    if (!user) {
      toast.error('Devi essere autenticato per condividere una storia');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      toast.success('🎉 La tua storia è stata condivisa con la bottega!', {
        description: 'Ora i vicini possono donare il loro cuore per supportarla'
      });

      // Redirect to the new story (mock ID)
      router.push('/problems/mock-story-123');
      
    } catch (error) {
      console.error('Error submitting story:', error);
      toast.error('Ops! Qualcosa è andato storto', {
        description: 'Non riesco a condividere la tua storia. Riprova tra un momento.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-lg text-orange-700">Preparando il quaderno per la tua storia...</div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ArtisanalStoryForm
            onSubmit={handleStorySubmit}
            categories={categories}
            isSubmitting={isSubmitting}
          />
          
          {/* Workshop tips */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>💡</span>
                Consigli dalla Bottega
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  <span>
                    <strong>Sii specifico:</strong> Invece di "Ho problemi con l'organizzazione", 
                    scrivi "Non riesco a coordinare gli orari della famiglia"
                  </span>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  <span>
                    <strong>Racconta l'esperienza:</strong> Descrivi quando ti capita, 
                    cosa provi, quali difficoltà incontri
                  </span>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-orange-500">•</span>
                  <span>
                    <strong>Pensa ai vicini:</strong> Altri potrebbero avere lo stesso problema 
                    e riconoscersi nella tua storia
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-orange-200 text-center">
                <p className="text-xs text-gray-500 italic">
                  🛠️ Ricorda: nella nostra bottega, ogni problema è un'opportunità per creare qualcosa di utile insieme
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}