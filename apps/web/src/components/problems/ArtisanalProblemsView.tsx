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

// Map category names to appropriate icons
const getIconForCategory = (categoryName: string | undefined): string => {
  if (!categoryName) return '📂';
  
  const iconMap: Record<string, string> = {
    'Ambiente': '🌱',
    'Mobilità': '🚲',
    'Energia': '⚡',
    'Sociale': '🤝',
    'Tecnologia': '💻',
    'Economia': '💰',
    'Famiglia': '👨‍👩‍👧‍👦',
    'Quartiere': '🏘️',
    'Hobby': '📚',
    'Lavoro': '💼',
    'Casa': '🏡'
  };

  return iconMap[categoryName] || '📂';
};

export const ArtisanalProblemsView: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'stories' | 'workshop'>('stories');

  // Load real data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch problems and categories in parallel
        const [problemsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/problems'),
          fetch('/api/categories')
        ]);

        let transformedProblems: Problem[] = [];
        let categoriesMap: Record<string, any> = {};

        // Process categories first to create lookup map
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          if (categoriesData.success && categoriesData.data) {
            categoriesData.data.forEach((category: any) => {
              categoriesMap[category.id] = category;
            });
          }
        }

        if (problemsResponse.ok) {
          const problemsData = await problemsResponse.json();
          if (problemsData.success && problemsData.data?.problems) {
            // Transform database problems with category lookup
            transformedProblems = problemsData.data.problems.map((problem: any) => {
              const category = categoriesMap[problem.category_id];
              return {
                id: problem.id,
                title: problem.title,
                description: problem.description,
                vote_count: problem.vote_count || 0,
                status: problem.status || 'Proposed',
                created_at: problem.created_at,
                category: {
                  id: problem.category_id,
                  name: category?.name || 'Categoria',
                  icon: getIconForCategory(category?.name) || '📂'
                },
                proposer: {
                  id: problem.proposer_id,
                  name: 'Artigiano del Laboratorio'
                }
              };
            });
            setProblems(transformedProblems);
          }
        } else {
          console.error('Failed to fetch problems:', problemsResponse.status);
        }

        // Transform categories for display
        const transformedCategories = Object.values(categoriesMap).map((category: any) => ({
          id: category.id,
          name: category.name,
          icon: getIconForCategory(category.name),
          count: transformedProblems.filter(p => p.category.id === category.id).length
        }));
        setCategories(transformedCategories);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">🛠️</div>
            <div className="text-lg text-teal-700">Preparando il laboratorio...</div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
        {/* Workshop Header */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-teal-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-4">
                <Ear className="w-4 h-4" />
                <span>Problemi del Quartiere</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Aiuta a Risolvere i Problemi dei Vicini
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                Come al mercato del paese, qui ognuno porta i propri piccoli problemi quotidiani. 
                Se riconosci lo stesso problema, dona il tuo cuore per costruire insieme la soluzione.
              </p>

              {/* Quick actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/problems/new">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Porta il Tuo Problema
                  </Button>
                </Link>
                
                <Button 
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 px-6 py-3 rounded-xl"
                  onClick={() => setActiveView(activeView === 'stories' ? 'workshop' : 'stories')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  {activeView === 'stories' ? 'Vedi il Laboratorio' : 'Vedi i Problemi'}
                </Button>
              </div>
            </div>

            {/* Categories - Workshop shelves */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedCategory 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50'
                }`}
              >
                Tutti i Problemi ({problems.length})
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-white text-teal-700 border border-teal-200 hover:bg-teal-50'
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
                <Button className="bg-teal-600 hover:bg-teal-700 text-white">
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
        <div className="bg-white/50 backdrop-blur-sm border-t border-teal-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {problems.reduce((sum, p) => sum + p.vote_count, 0)}
                  </div>
                  <div className="text-gray-600">Cuori donati nel laboratorio</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {problems.length}
                  </div>
                  <div className="text-gray-600">Problemi portati</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600">
                    {problems.filter(p => p.vote_count >= 100).length}
                  </div>
                  <div className="text-gray-600">Attrezzi in lavorazione</div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-6">
                💝 Nel nostro laboratorio, ogni cuore donato è un passo verso la soluzione di un problema comune
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default ArtisanalProblemsView;