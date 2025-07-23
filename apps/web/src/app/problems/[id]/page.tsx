'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AuthenticatedLayout } from '../../../components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Lightbulb, Calendar, Heart, Tag, User2, Clock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useVoting } from '../../../hooks/useVoting';
import { RealtimeVoteButtonDetailed } from '../../../components/ui/RealtimeVoteButton';
import { useRealtimeProblemVotes } from '../../../hooks/useRealtimeVotes';
import { Breadcrumb } from '../../../components/ui/breadcrumb';
import { RelatedProblems } from '../../../components/problems/related-problems';
import { VoteMilestones } from '../../../components/problems/vote-milestones';
import { SocialShare } from '../../../components/ui/social-share';
import { SocialShareWidget } from '../../../components/growth/SocialShareWidget';
import { useSEO } from '../../../hooks/useSEO';
import { useAuth } from '../../../hooks/useAuth';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  vote_count: number;
  created_at: string;
  proposer_id: string;
  category_id: string;
}

export default function ProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;
  const { user } = useAuth();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Voting functionality - temporarily simplified to avoid auth issues
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  
  const toggleVote = async () => {
    // Placeholder for voting functionality
    console.log('Vote toggle - temporarily disabled');
  };

  // Real-time vote updates - temporarily disabled
  const realtimeVoteCount = voteCount;
  const realtimeConnected = false;

  // Use real-time vote count when available, otherwise fallback to regular count
  const displayVoteCount = realtimeVoteCount !== undefined ? realtimeVoteCount : (voteLoading ? problem?.vote_count || 0 : voteCount);

  // SEO and social sharing
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Update SEO meta tags when problem data is available
  useSEO(problem ? {
    title: problem.title,
    description: problem.description.substring(0, 160) + (problem.description.length > 160 ? '...' : ''),
    url: currentUrl,
    type: 'article',
    siteName: 'WikiGaiaLab',
  } : {
    title: 'Caricamento...',
    description: 'WikiGaiaLab - Risolviamo i problemi del mondo insieme',
    url: currentUrl,
  });

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        console.log('Fetching problem:', problemId);
        const response = await fetch(`/api/problems/${problemId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', response.status, errorData);
          throw new Error(errorData.error || 'Problema non trovato');
        }
        
        const result = await response.json();
        console.log('Problem data received:', result);
        setProblem(result.data);
        setVoteCount(result.data.vote_count || 0);
      } catch (error) {
        console.error('Fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Errore nel caricamento del problema';
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  if (loading) {
    return (
      <AuthenticatedLayout title="Caricamento...">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!problem) {
    return (
      <AuthenticatedLayout title="Problema non trovato">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Problema non trovato
          </h1>
          <p className="text-gray-600">
            Il problema che stai cercando non esiste o è stato rimosso.
          </p>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return date.toLocaleDateString('it-IT');
  };

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Problemi', href: '/problems' },
    { label: 'Categoria', href: `/problems?category=${problem.category_id}` },
    { label: problem.title, current: true },
  ];

  return (
    <AuthenticatedLayout title={problem.title}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Breadcrumb items={breadcrumbItems} />
          <Link href="/problems">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna ai problemi
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3 leading-tight">
                      {problem.title}
                    </CardTitle>
                    
                    {/* Enhanced Proposer Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <Link 
                          href={`/users/${problem.proposer_id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          Utente
                        </Link>
                        <p className="text-sm text-gray-500">
                          Proposto {formatRelativeTime(problem.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-600 transition-all duration-300">
                        {displayVoteCount}
                        {realtimeConnected && (
                          <div className="inline-block ml-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {displayVoteCount === 1 ? 'voto' : 'voti'}
                        {realtimeConnected && (
                          <span className="ml-1 text-green-600 text-xs">• Live</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={toggleVote}
                      disabled={isVoting}
                      variant="default"
                      size="lg"
                    >
                      {hasVoted ? '❤️ Votato' : '🤍 Vota'}
                    </Button>
                  </div>
                </div>
                
                {/* Enhanced Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <Badge variant="secondary">Categoria</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Creato {formatRelativeTime(problem.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <Badge 
                      variant={problem.status === 'Proposed' ? 'default' : 'secondary'}
                    >
                      {problem.status === 'Proposed' ? 'In Valutazione' : problem.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Rich Description */}
                <div className="prose max-w-none mb-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                    {problem.description}
                  </div>
                </div>

                {/* Vote Milestones */}
                <VoteMilestones 
                  voteCount={voteLoading ? problem.vote_count : voteCount}
                />
              </CardContent>
            </Card>

            {/* Discussion Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Discussione</CardTitle>
                <CardDescription>
                  La sezione commenti sarà disponibile presto per favorire la discussione costruttiva.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>I commenti e le discussioni saranno abilitati nelle prossime versioni.</p>
                  <p className="text-sm">Nel frattempo, vota per mostrare il tuo interesse!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Problems - Temporarily disabled */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Problemi Correlati</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Funzionalità temporaneamente disabilitata</p>
              </CardContent>
            </Card>

            {/* Category Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  href={`/problems?category=${problem.category_id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 group-hover:text-primary-600">
                        Categoria
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Esplora altri problemi in questa categoria
                      </p>
                    </div>
                    <Tag className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Enhanced Social Sharing Widget - Temporarily disabled */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Condividi Problema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Funzionalità di condivisione temporaneamente disabilitata</p>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiche</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Voti totali</span>
                  <span className="font-semibold">{voteLoading ? problem.vote_count : voteCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Data creazione</span>
                  <span className="font-semibold">{new Date(problem.created_at).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stato</span>
                  <Badge variant="secondary">{problem.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </AuthenticatedLayout>
  );
}