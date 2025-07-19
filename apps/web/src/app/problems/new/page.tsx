'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthenticatedLayout } from '../../../components/layout';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Lightbulb, Send, AlertCircle } from 'lucide-react';

// Problem proposal form schema
const problemProposalSchema = z.object({
  title: z.string()
    .min(5, 'Il titolo deve contenere almeno 5 caratteri')
    .max(100, 'Il titolo non può superare i 100 caratteri'),
  description: z.string()
    .min(10, 'La descrizione deve contenere almeno 10 caratteri')
    .max(1000, 'La descrizione non può superare i 1000 caratteri'),
  category_id: z.string()
    .uuid('Seleziona una categoria valida'),
});

type ProblemProposalData = z.infer<typeof problemProposalSchema>;

interface Category {
  id: string;
  name: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

export default function NewProblemPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const form = useForm<ProblemProposalData>({
    resolver: zodResolver(problemProposalSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: '',
    },
  });

  // State for categories and loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Errore nel caricamento delle categorie');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        // console.error('Error fetching categories:', error);
        toast.error('Errore nel caricamento delle categorie');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: ProblemProposalData) => {
    setIsSubmitting(true);
    try {
      // Get the current session to include in API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('No valid session. Please log in again.');
      }

      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore nella creazione del problema');
      }

      const result = await response.json();
      toast.success('Problema creato con successo!', {
        description: 'Il tuo voto è stato automaticamente aggiunto.',
      });
      router.push(`/problems/${result.id}`);
    } catch (error: unknown) {
      toast.error('Errore nella creazione del problema', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const { watch, formState: { errors } } = form;
  const title = watch('title') || '';
  const description = watch('description') || '';
  const titleCount = title.length;
  const descriptionCount = description.length;

  return (
    <AuthenticatedLayout title="Proponi un Problema">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proponi un Problema
          </h1>
          <p className="text-lg text-gray-600">
            Condividi una sfida che credi la comunità possa aiutarti a risolvere
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Dettagli del Problema
            </CardTitle>
            <CardDescription>
              Fornisci informazioni chiare e dettagliate per aiutare la comunità a comprendere la sfida.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titolo del Problema *
                </Label>
                <div className="space-y-1">
                  <Input
                    id="title"
                    placeholder="Es: Come ridurre l'inquinamento plastico negli oceani?"
                    {...form.register('title')}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  <div className="flex justify-between text-sm">
                    <span className={`${errors.title ? 'text-red-500' : 'text-gray-500'}`}>
                      {errors.title?.message || 'Sii specifico e coinvolgente'}
                    </span>
                    <span className={`${titleCount > 90 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {titleCount}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Categoria *
                </Label>
                <Select 
                  onValueChange={(value) => form.setValue('category_id', value)}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleziona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-red-500">{errors.category_id.message}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Descrizione Dettagliata *
                </Label>
                <div className="space-y-1">
                  <Textarea
                    id="description"
                    placeholder="Descrivi il problema nel dettaglio: qual è la situazione attuale, perché è importante risolverlo, quali sono le sfide principali..."
                    rows={6}
                    {...form.register('description')}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  <div className="flex justify-between text-sm">
                    <span className={`${errors.description ? 'text-red-500' : 'text-gray-500'}`}>
                      {errors.description?.message || 'Più dettagli aiutano la comunità a capire meglio'}
                    </span>
                    <span className={`${descriptionCount > 900 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {descriptionCount}/1000
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">
                    Cosa succede dopo?
                  </p>
                  <p className="text-blue-700">
                    Una volta pubblicato, il tuo problema riceverà automaticamente il tuo voto. 
                    La comunità potrà votare e proporre soluzioni innovative.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-32"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creazione...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Pubblica Problema
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}