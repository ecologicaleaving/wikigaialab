'use client';

import { useState, useEffect } from 'react';
import { 
  BeakerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QualityMetrics {
  problem_id: string;
  quality_score: number;
  readability_score: number;
  engagement_score: number;
  completeness_score: number;
  uniqueness_score: number;
  spam_probability: number;
  calculated_at: string;
  problem: {
    id: string;
    title: string;
    status: string;
    moderation_status: string;
    created_at: string;
    vote_count: number;
    category: {
      name: string;
    };
  };
}

interface DuplicateGroup {
  group_id: number;
  problems: Array<{
    id: string;
    title: string;
    similarity_score: number;
  }>;
}

export default function QualityAnalysisPage() {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'low-quality'>('overview');
  const [minQuality, setMinQuality] = useState(0);
  const [maxQuality, setMaxQuality] = useState(100);

  useEffect(() => {
    fetchQualityMetrics();
  }, [minQuality, maxQuality]);

  const fetchQualityMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/content/quality?min_quality=${minQuality}&max_quality=${maxQuality}`);
      const result = await response.json();

      if (result.success) {
        setQualityMetrics(result.data);
      }
    } catch (error) {
      console.error('Error fetching quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBulkAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/admin/content/quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'bulk_analyze' }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchQualityMetrics(); // Refresh data
      }
    } catch (error) {
      console.error('Error running bulk analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const detectDuplicates = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/admin/content/quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'detect_duplicates' }),
      });

      const result = await response.json();
      if (result.success) {
        setDuplicateGroups(result.data.duplicate_groups);
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Calculate overview stats
  const totalProblems = qualityMetrics.length;
  const lowQualityCount = qualityMetrics.filter(m => m.quality_score < 40).length;
  const mediumQualityCount = qualityMetrics.filter(m => m.quality_score >= 40 && m.quality_score < 70).length; // eslint-disable-line @typescript-eslint/no-unused-vars
  const highQualityCount = qualityMetrics.filter(m => m.quality_score >= 70).length;
  const avgQualityScore = totalProblems > 0 
    ? qualityMetrics.reduce((sum, m) => sum + m.quality_score, 0) / totalProblems 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Quality Analysis</h1>
        <p className="mt-2 text-sm text-gray-700">
          Analyze content quality, detect duplicates, and maintain high standards across the platform.
        </p>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={runBulkAnalysis}
          disabled={analyzing}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <BeakerIcon className="h-4 w-4 mr-2" />
          {analyzing ? 'Analyzing...' : 'Run Bulk Analysis'}
        </button>

        <button
          onClick={detectDuplicates}
          disabled={analyzing}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
          Detect Duplicates
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Quality</dt>
                  <dd className="text-lg font-medium text-gray-900">{avgQualityScore.toFixed(1)}/100</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Quality</dt>
                  <dd className="text-lg font-medium text-gray-900">{lowQualityCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Quality</dt>
                  <dd className="text-lg font-medium text-gray-900">{highQualityCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MagnifyingGlassIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Duplicate Groups</dt>
                  <dd className="text-lg font-medium text-gray-900">{duplicateGroups.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Quality Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minQuality}
              onChange={(e) => setMinQuality(parseInt(e.target.value) || 0)}
              className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Quality Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={maxQuality}
              onChange={(e) => setMaxQuality(parseInt(e.target.value) || 100)}
              className="mt-1 block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Quality Overview' },
            { id: 'duplicates', name: `Duplicates (${duplicateGroups.length})` },
            { id: 'low-quality', name: `Low Quality (${lowQualityCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {qualityMetrics.map((metric) => (
              <li key={metric.problem_id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {metric.problem.title}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>Category: {metric.problem.category.name}</span>
                        <span>Votes: {metric.problem.vote_count}</span>
                        <span>Created: {new Date(metric.problem.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityScoreColor(metric.quality_score)}`}>
                        {metric.quality_score.toFixed(1)}/100
                      </span>
                      
                      <div className="flex space-x-2 text-xs text-gray-500">
                        <span>R: {metric.readability_score.toFixed(0)}</span>
                        <span>E: {metric.engagement_score.toFixed(0)}</span>
                        <span>C: {metric.completeness_score.toFixed(0)}</span>
                        <span>U: {metric.uniqueness_score.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No duplicates detected</h3>
              <p className="mt-1 text-sm text-gray-500">Run duplicate detection to find similar content.</p>
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <div key={group.group_id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Duplicate Group #{group.group_id} ({group.problems.length} problems)
                </h4>
                
                <div className="space-y-2">
                  {group.problems.map((problem) => (
                    <div key={problem.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{problem.title}</span>
                      <span className="text-sm text-orange-600 font-medium">
                        {Math.round(problem.similarity_score * 100)}% similar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'low-quality' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {qualityMetrics
              .filter(m => m.quality_score < 40)
              .map((metric) => (
                <li key={metric.problem_id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {metric.problem.title}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <span>Issues: Low completeness, poor readability, or low engagement</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          {metric.quality_score.toFixed(1)}/100
                        </span>
                        
                        {metric.spam_probability > 0.3 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Potential Spam
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}