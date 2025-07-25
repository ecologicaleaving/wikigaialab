'use client';

import { 
  ChartBarIcon, 
  FlagIcon, 
  RectangleStackIcon,
  UsersIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { AdminDashboardStats } from '@/components/admin/AdminDashboardStats';
import { AdminActivityFeed } from '@/components/admin/AdminActivityFeed';
import { AdminCategoryChart } from '@/components/admin/AdminCategoryChart';
import { AdminModerationQueue } from '@/components/admin/AdminModerationQueue';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

export default function AdminDashboard() {
  const { data, loading, error } = useAdminDashboard();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          <strong>Errore:</strong> {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nessun dato disponibile</p>
      </div>
    );
  }

  const quickStats = [
    {
      name: 'Problemi del Quartiere',
      value: data.stats.totalProblems,
      icon: ChartBarIcon,
      change: data.trends.problemsGrowth,
      changeType: 'increase' as const,
      color: 'teal',
    },
    {
      name: 'In Attesa del Maestro',
      value: data.stats.pendingModeration,
      icon: FlagIcon,
      change: null,
      changeType: 'neutral' as const,
      color: 'amber',
    },
    {
      name: 'Storie in Evidenza',
      value: data.stats.featuredProblems,
      icon: RectangleStackIcon,
      change: null,
      changeType: 'neutral' as const,
      color: 'emerald',
    },
    {
      name: 'Cuori Donati',
      value: data.stats.totalVotes,
      icon: HeartIcon,
      change: data.trends.votesGrowth,
      changeType: 'increase' as const,
      color: 'rose',
    },
  ];

  return (
    <div>
      {/* Header with WikiGaia Branding */}
      <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ChartBarIcon className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-800">Il Banco del Maestro</h1>
            <p className="text-teal-700 font-medium">WikiGaiaLab - Laboratorio Artigiano Digitale</p>
          </div>
        </div>
        <p className="text-teal-700">
          Da qui tieni d'occhio la salute del nostro laboratorio e aiuti la comunità a crescere. 
          Ogni numero racconta la storia del nostro quartiere digitale.
        </p>
      </div>

      {/* Quick Stats */}
      <AdminDashboardStats stats={quickStats} />

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Category Distribution */}
        <div className="lg:col-span-2">
          <AdminCategoryChart 
            categories={data.categoryDistribution}
            totalProblems={data.stats.totalProblems}
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <AdminActivityFeed 
            activities={data.recentActivity}
            recentCount={data.stats.recentActivity}
          />
        </div>
      </div>

      {/* Moderation Queue Preview */}
      <div className="mt-8">
        <AdminModerationQueue 
          queue={data.moderationQueue}
          totalPending={data.stats.pendingModeration}
          isPreview={true}
        />
      </div>

      {/* Additional Stats with Enhanced WikiGaia Styling */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-teal-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-teal-700 truncate">
                    Scaffali del Laboratorio
                  </dt>
                  <dd className="text-lg font-medium text-teal-800">
                    {data.stats.totalCategories}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-emerald-700 truncate">
                    Cuori per Storia
                  </dt>
                  <dd className="text-lg font-medium text-emerald-800">
                    {data.stats.averageVotes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <RectangleStackIcon className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-amber-700 truncate">
                    Raccolte Speciali
                  </dt>
                  <dd className="text-lg font-medium text-amber-800">
                    {data.stats.totalCollections}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}