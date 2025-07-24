'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Ear, Plus, Filter, Search, Users } from 'lucide-react';
import { AuthenticatedLayout } from '../layout';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import ArtisanalProblemCard from './ArtisanalProblemCard';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string;
  vote_count: number;
  status: string;
  created_at: string;
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  proposer: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const ArtisanalProblemsView: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'stories' | 'workshop'>('stories');

  // Mock data for artisanal workshop
  useEffect(() => {
    const mockProblems: Problem[] = [
      {
        id: '1',
        title: 'Organizzare le feste di compleanno dei bambini',
        description: 'Ogni volta che devo organizzare una festa per mia figlia, perdo ore a cercare fornitori, confrontare prezzi, e coordinare tutto. Vorrei un aiuto per semplificare questo processo e non dimenticare nulla.',
        vote_count: 67,
        status: 'proposed',
        created_at: '2024-07-20T10:00:00Z',
        category: { id: 'famiglia', name: 'Vita di Famiglia', icon: '👨‍👩‍👧‍👦' },
        proposer: { id: '1', name: 'Maria R.' }
      },
      {
        id: '2', 
        title: 'Trovare qualcuno per aiutare gli anziani del condominio',
        description: 'Nel nostro palazzo ci sono diversi anziani che hanno difficoltà con la spesa e le commissioni. Vorrei organizzare un sistema di aiuto tra vicini, ma non so come coordinarlo.',
        vote_count: 89,
        status: 'proposed',
        created_at: '2024-07-19T15:30:00Z',
        category: { id: 'comunita', name: 'Vita di Quartiere', icon: '🏘️' },
        proposer: { id: '2', name: 'Giuseppe M.' }
      },
      {
        id: '3',
        title: 'Gestire il gruppo di lettura del circolo',
        description: 'Coordino un gruppo di lettura ma è difficile scegliere i libri, organizzare gli incontri e tenere traccia di chi ha letto cosa. Serve qualcosa di semplice per gestire tutto.',
        vote_count: 34,
        status: 'proposed', 
        created_at: '2024-07-18T09:15:00Z',
        category: { id: 'hobby', name: 'Passioni e Hobby', icon: '📚' },
        proposer: { id: '3', name: 'Sofia B.' }
      }
    ];

    const mockCategories: Category[] = [
      { id: 'famiglia', name: 'Vita di Famiglia', icon: '👨‍👩‍👧‍👦', count: 23 },
      { id: 'comunita', name: 'Vita di Quartiere', icon: '🏘️', count: 18 },
      { id: 'hobby', name: 'Passioni e Hobby', icon: '📚', count: 15 },
      { id: 'lavoro', name: 'Vita Lavorativa', icon: '💼', count: 12 },
      { id: 'casa', name: 'Casa e Giardino', icon: '🏡', count: 9 }
    ];

    setTimeout(() => {
      setProblems(mockProblems);
      setCategories(mockCategories);
      setLoading(false);
    }, 500);
  }, []);

  const filteredProblems = problems.filter(problem => {
    const matchesCategory = !selectedCategory || problem.category.id === selectedCategory;
    const matchesSearch = !searchQuery || 
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVote = (problemId: string) => {
    // Mock voting logic
    setProblems(prev => prev.map(p => 
      p.id === problemId 
        ? { ...p, vote_count: p.vote_count + 1 }
        : p
    ));
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🛠️</div>
            <div className="text-lg text-orange-700">Preparando la bottega...</div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Workshop Header */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-orange-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mb-4">
                <Ear className="w-4 h-4" />
                <span>Storie del Quartiere</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Ascolta le Storie dei Tuoi Vicini
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                Come al mercato del paese, qui ognuno racconta i propri piccoli problemi quotidiani. 
                Se ti riconosci in una storia, dona il tuo cuore per farla diventare realtà.
              </p>

              {/* Quick actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/problems/new">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Racconta la Tua Storia
                  </Button>
                </Link>
                
                <Button 
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 px-6 py-3 rounded-xl"
                  onClick={() => setActiveView(activeView === 'stories' ? 'workshop' : 'stories')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  {activeView === 'stories' ? 'Vedi la Bottega' : 'Vedi le Storie'}
                </Button>
              </div>
            </div>

            {/* Categories - Workshop shelves */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
                }`}
              >
                Tutte le Storie ({problems.length})
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🤷‍♀️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nessuna storia in questa categoria
              </h3>
              <p className="text-gray-600 mb-6">
                Sii il primo a condividere un problema di questo tipo!
              </p>
              <Link href="/problems/new">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Racconta la Prima Storia
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProblems.map(problem => (
                <ArtisanalProblemCard
                  key={problem.id}
                  problem={problem}
                  onVote={handleVote}
                  hasVoted={false} // TODO: Get real vote status
                  showRealtimeIndicator={Math.random() > 0.7} // Mock realtime activity
                />
              ))}
            </div>
          )}
        </div>

        {/* Community stats footer */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-orange-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {problems.reduce((sum, p) => sum + p.vote_count, 0)}
                  </div>
                  <div className="text-gray-600">Cuori donati nella bottega</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {problems.length}
                  </div>
                  <div className="text-gray-600">Storie condivise</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {problems.filter(p => p.vote_count >= 100).length}
                  </div>
                  <div className="text-gray-600">Attrezzi in lavorazione</div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-6">
                💝 Nella nostra bottega, ogni cuore donato è un passo verso la soluzione di un problema comune
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ArtisanalProblemsView;