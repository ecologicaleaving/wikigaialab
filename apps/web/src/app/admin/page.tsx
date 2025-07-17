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
      name: 'Problemi Totali',
      value: data.stats.totalProblems,
      icon: ChartBarIcon,
      change: data.trends.problemsGrowth,
      changeType: 'increase' as const,
    },
    {
      name: 'In Moderazione',
      value: data.stats.pendingModeration,
      icon: FlagIcon,
      change: null,
      changeType: 'neutral' as const,
    },
    {
      name: 'In Evidenza',
      value: data.stats.featuredProblems,
      icon: RectangleStackIcon,
      change: null,
      changeType: 'neutral' as const,
    },
    {
      name: 'Voti Totali',
      value: data.stats.totalVotes,
      icon: HeartIcon,
      change: data.trends.votesGrowth,
      changeType: 'increase' as const,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="mt-2 text-sm text-gray-700">
          Panoramica generale della piattaforma WikiGaiaLab
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

      {/* Additional Stats */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Categorie Attive
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data.stats.totalCategories}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Media Voti
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data.stats.averageVotes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RectangleStackIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Collezioni
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
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