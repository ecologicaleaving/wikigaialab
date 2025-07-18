'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentPlusIcon,
  FlagIcon,
  StarIcon,
  ChartBarIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ContentStats {
  totalProblems: number;
  pendingModeration: number;
  featuredProblems: number;
  flaggedContent: number;
  todaySubmissions: number;
  qualityScore: number;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  moderation_status: 'pending' | 'approved' | 'rejected';
  quality_score: number;
  flag_count: number;
  is_featured: boolean;
  created_at: string;
  proposer: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export default function ContentManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'featured' | 'imports' | 'analytics'>('overview');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'flagged' | 'featured'>('all');

  useEffect(() => {
    if (user?.is_admin) {
      fetchContentData();
    }
  }, [user, activeTab, selectedFilter]);

  const fetchContentData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch('/api/admin/content/stats');
      const statsData = await statsResponse.json();

      // Fetch content based on active tab and filter
      const contentResponse = await fetch(`/api/admin/content/list?tab=${activeTab}&filter=${selectedFilter}`);
      const contentData = await contentResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (contentData.success) {
        setContent(contentData.data);
      }
    } catch (error) {
      console.error('Error fetching content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (problemId: string, action: 'approve' | 'reject' | 'feature' | 'unfeature') => {
    try {
      const response = await fetch(`/api/admin/content/problems/${problemId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchContentData(); // Refresh data
      }
    } catch (error) {
      console.error('Error performing moderation action:', error);
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'moderation', name: 'Moderation Queue', icon: FlagIcon },
    { id: 'featured', name: 'Featured Content', icon: StarIcon },
    { id: 'imports', name: 'Bulk Imports', icon: ArrowUpTrayIcon },
    { id: 'analytics', name: 'Analytics', icon: EyeIcon },
  ];

  const filters = [
    { id: 'all', name: 'All Content' },
    { id: 'pending', name: 'Pending Review' },
    { id: 'flagged', name: 'Flagged' },
    { id: 'featured', name: 'Featured' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage content quality, moderation, and featured content across WikiGaiaLab
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentPlusIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Problems</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalProblems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FlagIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingModeration}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Featured</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.featuredProblems}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Flagged</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.flaggedContent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Submissions</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.todaySubmissions}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Quality Score</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.qualityScore.toFixed(1)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id as any)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium
              ${selectedFilter === filter.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {content.map((item) => (
            <li key={item.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      
                      {/* Status badges */}
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${item.moderation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          item.moderation_status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }
                      `}>
                        {item.moderation_status}
                      </span>

                      {item.is_featured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <StarIcon className="h-3 w-3 mr-1" />
                          Featured
                        </span>
                      )}

                      {item.flag_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FlagIcon className="h-3 w-3 mr-1" />
                          {item.flag_count} flags
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <p>
                        By {item.proposer.name} in {item.category.name} • 
                        Quality: {item.quality_score.toFixed(1)}/100 • 
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2 ml-4">
                    {item.moderation_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleModerationAction(item.id, 'approve')}
                          className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleModerationAction(item.id, 'reject')}
                          className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleModerationAction(item.id, item.is_featured ? 'unfeature' : 'feature')}
                      className={`
                        inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium
                        ${item.is_featured 
                          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200' 
                          : 'text-white bg-yellow-600 hover:bg-yellow-700'
                        }
                      `}
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {content.length === 0 && (
          <div className="text-center py-12">
            <DocumentPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedFilter === 'all' 
                ? 'No content available in this section.'
                : `No content matches the "${selectedFilter}" filter.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}