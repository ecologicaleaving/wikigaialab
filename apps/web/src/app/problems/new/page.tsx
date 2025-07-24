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
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Fetch real categories from the API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        if (result.success && result.data) {
          // Map database categories to our format
          const mappedCategories: Category[] = result.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            icon: getCategoryIcon(cat.name), // Add appropriate icons
            description: cat.description
          }));
          
          setCategories(mappedCategories);
        } else {
          console.error('Failed to fetch categories:', result);
          setCategoriesError('Impossibile caricare le categorie. Riprova tra un momento.');
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategoriesError('Errore di connessione. Controlla la connessione internet.');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Helper function to get appropriate icons for categories
  const getCategoryIcon = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Ambiente': '🌱',
      'Mobilità': '🚗',
      'Energia': '⚡',
      'Sociale': '👥',
      'Tecnologia': '💻',
      'Salute': '🏥',
      'Educazione': '📚',
      'default': '📝'
    };
    
    return iconMap[categoryName] || iconMap.default;
  };

  const handleStorySubmit = async (data: StoryData) => {
    if (!user) {
      toast.error('Devi essere autenticato per condividere una storia');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting story with data:', data);
      
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          category_id: data.category_id
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.success) {
        toast.success('🎉 La tua storia è stata condivisa con la bottega!', {
          description: 'Ora i vicini possono donare il loro cuore per supportarla'
        });

        // Redirect to the problems list or new story
        router.push(`/problems/${result.data.id}`);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error submitting story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast.error('Ops! Qualcosa è andato storto', {
        description: `Non riesco a condividere la tua storia: ${errorMessage}`
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
          {categoriesError ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-lg text-red-600 mb-4">{categoriesError}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Riprova
              </button>
            </div>
          ) : (
            <ArtisanalStoryForm
              onSubmit={handleStorySubmit}
              categories={categories}
              isSubmitting={isSubmitting}
            />
          )}
          
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