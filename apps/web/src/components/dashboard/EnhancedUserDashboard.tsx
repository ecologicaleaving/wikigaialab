'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';
import { useVotingHistory } from '../../hooks/useVotingHistory';
import { useRecommendations } from '../../hooks/useRecommendations';
import { VotingHistoryCard } from '../analytics/VotingHistoryCard';
import { AccessStatusCard } from '../premium/AccessStatusCard';
import { QuickVotePrompt } from '../premium/UpgradePrompts';
import RecommendationWidget from '../recommendations/RecommendationWidget';
import RelatedProblemsWidget from '../recommendations/RelatedProblemsWidget';
import { ReferralWidget } from '../growth/ReferralWidget';
import { CampaignWidget } from '../growth/CampaignWidget';
import { LeaderboardWidget } from '../growth/LeaderboardWidget';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Award, 
  Star,
  Vote,
  BarChart3,
  AppWindow,
  Settings,
  History,
  Check,
  Lock,
  Heart,
  Lightbulb,
  BookOpen,
  UserPlus,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

// Enhanced loading skeleton for components with sophisticated animations
const ComponentSkeleton = () => (
  <motion.div 
    className="bg-gray-200 rounded-lg h-32 w-full relative overflow-hidden"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    />
  </motion.div>
);

// Enhanced laboratory heart beating animation with Framer Motion - "Il cuore batte una volta"
const HeartBeat = ({ className = "", children, onClick }: { 
  className?: string; 
  children?: React.ReactNode; 
  onClick?: () => void;
}) => {
  const [isBeating, setIsBeating] = useState(false);
  
  const handleClick = () => {
    if (onClick) {
      setIsBeating(true);
      setTimeout(() => setIsBeating(false), 600);
      onClick();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isBeating ? {
        scale: [1, 1.2, 1.1, 1.15, 1],
        transition: { 
          duration: 0.6,
          times: [0, 0.3, 0.5, 0.7, 1],
          ease: "easeInOut"
        }
      } : {}}
    >
      {children}
    </motion.button>
  );
};

// Enhanced numbers with sophisticated Framer Motion bounce - "Numeri che crescono con rimbalzo gioioso"
const AnimatedNumber = ({ value, duration = 500 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const startTime = Date.now();
      const startValue = displayValue;
      const difference = value - startValue;

      const updateValue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out with bounce
        const eased = 1 - Math.pow(1 - progress, 3);
        const newValue = Math.round(startValue + difference * eased);
        
        setDisplayValue(newValue);
        
        if (progress < 1) {
          requestAnimationFrame(updateValue);
        } else {
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(updateValue);
    }
  }, [value, displayValue, duration]);

  return (
    <motion.span
      animate={isAnimating ? {
        scale: [1, 1.15, 1],
        color: ['#374151', '#059669', '#374151']
      } : {}}
      transition={{ 
        duration: 0.4,
        type: "spring",
        stiffness: 300
      }}
    >
      {displayValue}
    </motion.span>
  );
};

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: DashboardTab[] = [
  { id: 'overview', name: 'Panoramica', icon: BarChart3 },
  { id: 'recommendations', name: 'Raccomandazioni', icon: Heart },
  { id: 'voting', name: 'Cronologia Voti', icon: Vote },
  { id: 'growth', name: 'Crescita Community', icon: UserPlus },
  { id: 'problems', name: 'I Miei Problemi', icon: Users },
  { id: 'apps', name: 'Le Mie App', icon: AppWindow },
  { id: 'settings', name: 'Impostazioni', icon: Settings }
];

export function EnhancedUserDashboard() {
  const { user } = useAuth();
  const { accessData, loading: accessLoading } = usePremiumAccess();
  const { stats, loading: statsLoading } = useVotingHistory();
  const {
    personalRecommendations,
    trendingProblems,
    isLoading: recommendationsLoading,
    refreshRecommendations
  } = useRecommendations({ limit: 8 });
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);

  // Handle navigation to problems with performance optimization
  const handleProblemClick = useCallback((problemId: string) => {
    window.location.href = `/problems/${problemId}`;
  }, []);

  // Handle tab switching with laboratory fluid transitions - "danza coordinata"
  const handleTabSwitch = useCallback((newTab: string) => {
    if (newTab !== activeTab && !isTabTransitioning) {
      setIsTabTransitioning(true);
      
      // Create coordinated dance effect - content fades out, then new content fades in
      setTimeout(() => {
        setActiveTab(newTab);
        setTimeout(() => {
          setIsTabTransitioning(false);
        }, 200); // Content fade-in duration
      }, 200); // Content fade-out duration
    }
  }, [activeTab, isTabTransitioning]);

  // Memoize display name for performance
  const displayName = useMemo(() => 
    user?.name || user?.email || 'Utente', 
    [user?.name, user?.email]
  );

  if (!user) return null;

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-gray-200" 
        role="banner"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.h1 
                  className="text-2xl font-bold text-gray-900"
                  whileHover={{ color: "#0f766e" }}
                  transition={{ duration: 0.2 }}
                >
                  Il Mio Angolo di Laboratorio
                </motion.h1>
                <motion.p 
                  className="text-teal-700"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  Ciao {displayName}, bentornato nel nostro laboratorio!
                </motion.p>
              </motion.div>
              
              {/* Enhanced Access Level Badge */}
              <AnimatePresence>
                {accessData && (
                  <motion.div 
                    className="flex items-center gap-4"
                    initial={{ x: 20, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 20, opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <motion.div 
                      className="text-right"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {accessData.currentLevel.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        <AnimatedNumber value={accessData.totalVotes} /> voti espressi
                      </p>
                    </motion.div>
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0 10px 25px rgba(20, 184, 166, 0.4)"
                      }}
                    >
                      <Star className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Enhanced Tab Navigation */}
          <motion.nav 
            className="border-b border-gray-200" 
            role="navigation" 
            aria-label="Dashboard tabs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="-mb-px flex space-x-8">
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleTabSwitch(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        const currentIndex = tabs.findIndex(t => t.id === tab.id);
                        const nextIndex = e.key === 'ArrowRight' 
                          ? (currentIndex + 1) % tabs.length
                          : (currentIndex - 1 + tabs.length) % tabs.length;
                        handleTabSwitch(tabs[nextIndex].id);
                      }
                    }}
                    className={`relative flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                      isActive
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + (index * 0.1), duration: 0.4 }}
                    whileHover={{ 
                      y: -2,
                      color: isActive ? "#0d9488" : "#0f766e"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      animate={isActive ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ 
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                    >
                      <tab.icon className="w-4 h-4" />
                    </motion.div>
                    <span>{tab.name}</span>
                    
                    {/* Active tab indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500"
                        layoutId="activeTab"
                        transition={{ 
                          type: "spring",
                          stiffness: 380,
                          damping: 30
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.nav>
        </div>
      </motion.header>

      {/* Content */}
      <motion.main 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" 
        role="main"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            tabIndex={0}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab 
                user={user}
                accessData={accessData}
                stats={stats}
                loading={accessLoading || statsLoading}
                setActiveTab={setActiveTab}
                personalRecommendations={personalRecommendations}
                onProblemClick={handleProblemClick}
              />
            )}
            
            {activeTab === 'recommendations' && (
              <RecommendationsTab 
                onProblemClick={handleProblemClick}
              />
            )}
            
            {activeTab === 'voting' && <VotingHistoryTab />}
            {activeTab === 'growth' && <GrowthTab user={user} />}
            {activeTab === 'problems' && <ProblemsTab />}
            {activeTab === 'apps' && <AppsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </motion.div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  user, 
  accessData, 
  stats, 
  loading,
  setActiveTab,
  personalRecommendations,
  onProblemClick
}: { 
  user: any;
  accessData: any;
  stats: any;
  loading: boolean;
  setActiveTab: (tab: string) => void;
  personalRecommendations: any[];
  onProblemClick: (problemId: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main Content - 8 columns on large screens */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="User statistics">
          <StatsCard
            title="Voti Totali"
            value={stats?.totalVotes || 0}
            icon={Vote}
            color="blue"
            subtitle="Tutti i tempi"
          />
          <StatsCard
            title="Voti Questa Settimana"
            value={stats?.votesThisWeek || 0}
            icon={TrendingUp}
            color="green"
            subtitle="Ultimi 7 giorni"
          />
          <StatsCard
            title="Serie di Voti"
            value={stats?.votingStreak || 0}
            icon={Award}
            color="purple"
            subtitle="Giorni consecutivi"
          />
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-lg border border-gray-200 p-6" aria-labelledby="recent-activity-heading">
          <h3 id="recent-activity-heading" className="text-lg font-semibold text-gray-900 mb-6">
            Attività Recente
          </h3>
          <RecentActivityList />
        </section>

        {/* Personal Recommendations Preview */}
        {personalRecommendations && personalRecommendations.length > 0 && (
          <section className="bg-white rounded-lg border border-gray-200 p-6" aria-labelledby="recommendations-heading">
            <div className="flex items-center justify-between mb-6">
              <h3 id="recommendations-heading" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HeartBeat className="p-1 rounded-full">
                  <Heart className="h-5 w-5 text-teal-600" aria-hidden="true" />
                </HeartBeat>
                Raccomandazioni per Te
              </h3>
              <button
                onClick={() => handleTabSwitch('recommendations')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded"
              >
                Vedi tutte
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalRecommendations.slice(0, 4).map((problem) => (
                <div
                  key={problem.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => onProblemClick(problem.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                      {problem.category?.name || 'Categoria'}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Heart className="h-3 w-3 mr-1" />
                      {problem.vote_count}
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                    {problem.title}
                  </h4>
                  {problem.reasoning && (
                    <p className="text-xs text-teal-600">
                      Consigliato per i tuoi interessi
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="bg-white rounded-lg border border-gray-200 p-6" aria-labelledby="quick-actions-heading">
          <h3 id="quick-actions-heading" className="text-lg font-semibold text-gray-900 mb-6">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Vota Problemi"
              description="Supporta le migliori proposte"
              href="/problems"
              icon={Vote}
              color="blue"
            />
            <ActionCard
              title="Raccomandazioni"
              description="Problemi per te"
              href="#"
              icon={Heart}
              color="purple"
              onClick={() => handleTabSwitch('recommendations')}
            />
            <ActionCard
              title="Proponi Soluzione"
              description="Condividi la tua idea"
              href="/problems/new"
              icon={Users}
              color="green"
            />
            <ActionCard
              title="Visualizza Cronologia"
              description="I tuoi voti e proposte"
              href="#"
              icon={History}
              color="orange"
              onClick={() => handleTabSwitch('voting')}
            />
          </div>
        </section>
      </div>

      {/* Sidebar - 4 columns on large screens */}
      <aside className="col-span-12 lg:col-span-4 space-y-4" role="complementary" aria-label="Dashboard sidebar">
        {/* Access Status */}
        <AccessStatusCard />
        
        {/* Quick Vote Prompt */}
        <QuickVotePrompt compact />
        
        {/* Referral Widget */}
        <ReferralWidget userId={user.id} compact={true} />
        
        {/* Leaderboard Preview */}
        <LeaderboardWidget userId={user.id} compact={true} showControls={false} />
        
        {/* Profile Stats */}
        <section className="bg-white rounded-lg border border-gray-200 p-6" aria-labelledby="profile-stats-heading">
          <h3 id="profile-stats-heading" className="text-lg font-semibold text-gray-900 mb-4">
            Le Tue Statistiche
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Membro da</span>
              <span className="font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Categorie votate</span>
              <span className="font-medium">{stats?.categoriesVoted || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Categoria preferita</span>
              <span className="font-medium">{stats?.favoriteCategory || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ultimo voto</span>
              <span className="font-medium">
                {stats?.lastVoteDate 
                  ? new Date(stats.lastVoteDate).toLocaleDateString('it-IT')
                  : 'Mai'
                }
              </span>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function RecommendationsTab({ onProblemClick }: { onProblemClick: (problemId: string) => void }) {
  return (
    <div className="space-y-8">
      {/* Personal Recommendations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <HeartBeat className="p-1 rounded-full">
            <Heart className="h-6 w-6 text-teal-600" />
          </HeartBeat>
          <h2 className="text-xl font-semibold text-gray-900">
            Raccomandazioni Personalizzate
          </h2>
        </div>
        <RecommendationWidget
          type="personal"
          title=""
          limit={12}
          showExplanations={true}
          onProblemClick={onProblemClick}
        />
      </div>

      {/* Trending Problems */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Problemi di Tendenza
          </h2>
        </div>
        <RecommendationWidget
          type="trending"
          title=""
          limit={8}
          showExplanations={false}
          onProblemClick={onProblemClick}
        />
      </div>

      {/* Recommendation Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Personalizza le Raccomandazioni
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diversità delle raccomandazioni
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Simili ai miei interessi</option>
              <option>Mix di contenuti</option>
              <option>Molto vario</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso dei problemi trending
            </label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option>Basso</option>
              <option>Medio</option>
              <option>Alto</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200">
            Salva Preferenze
          </button>
        </div>
      </div>
    </div>
  );
}

function VotingHistoryTab() {
  return (
    <div className="space-y-6">
      {/* Voting History with Analytics */}
      <VotingHistoryCard 
        showHeader={true}
        maxItems={20}
        className="bg-white"
      />
    </div>
  );
}

function GrowthTab({ user }: { user: any }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="h-6 w-6 text-teal-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Crescita Community
          </h2>
        </div>
        <p className="text-gray-600">
          Invita amici, partecipa alle sfide e scala le classifiche della community
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Referral System */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Sistema Inviti
            </h3>
            <ReferralWidget userId={user?.id} />
          </div>

          {/* Campaigns */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Campagne Attive
            </h3>
            <CampaignWidget userId={user?.id} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Leaderboards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Classifiche Community
            </h3>
            <LeaderboardWidget userId={user?.id} />
          </div>
        </div>
      </div>

      {/* Growth Tips */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg p-6 border border-teal-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-teal-600" />
          Consigli per la Crescita
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Porta Nuovi Utenti</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Condividi il tuo link di invito sui social</li>
              <li>• Invita amici interessati ai problemi della community</li>
              <li>• Spiega il valore di WikiGaiaLab</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Aumenta il Tuo Rank</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Vota regolarmente sui problemi</li>
              <li>• Proponi problemi di qualità</li>
              <li>• Partecipa alle campagne attive</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder functions for other tabs
function ProblemsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">I Miei Problemi</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

function AppsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Le Mie App</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni</h3>
      <p className="text-gray-500">Funzionalità in sviluppo...</p>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
}

function StatsCard({ title, value, icon: Icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-teal-50 text-teal-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-teal-50 text-teal-600',
    orange: 'bg-amber-50 text-amber-600',
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-teal-200 transition-all duration-300 group">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 group-hover:text-teal-600 transition-colors duration-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900" aria-label={`${title}: ${value} ${subtitle || ''}`}>
            <AnimatedNumber value={typeof value === 'number' ? value : parseInt(value.toString()) || 0} />
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
    </article>
  );
}

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function ActionCard({ title, description, href = '#', onClick, icon: Icon, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'bg-teal-500',
    green: 'bg-emerald-500',
    purple: 'bg-teal-500',
    orange: 'bg-amber-500',
  };

  const content = (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-lg hover:transform hover:translate-y-[-8px] transition-all duration-300 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors duration-300">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

function RecentActivityList() {
  // Placeholder for recent activity
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          Nessuna attività recente. Inizia votando o proponendo problemi!
        </p>
        <Link
          href="/problems"
          className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium transition-colors duration-200"
        >
          <Vote className="w-4 h-4" />
          Inizia a Votare
        </Link>
      </div>
    </div>
  );
}
