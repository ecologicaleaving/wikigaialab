'use client';

import { useState, useEffect } from 'react';
import { 
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SeedInfo {
  available_seed_categories: string[];
  seed_data: Array<{
    category: string;
    problem_count: number;
    sample_titles: string[];
  }>;
  current_problem_stats: Record<string, number>;
  total_seed_problems: number;
}

interface SeedResult {
  total_created: number;
  total_skipped: number;
  categories_seeded: number;
  results: Array<{
    category: string;
    created: number;
    skipped: number;
    problems: Array<{ id: string; title: string }>;
  }>;
}

export default function SeedDataPage() {
  const [seedInfo, setSeedInfo] = useState<SeedInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [forceReseed, setForceReseed] = useState(false);

  useEffect(() => {
    fetchSeedInfo();
  }, []);

  const fetchSeedInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content/seed');
      const result = await response.json();

      if (result.success) {
        setSeedInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching seed info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSeeding = async () => {
    if (!seedInfo) return;

    setSeeding(true);
    setSeedResult(null);

    try {
      const response = await fetch('/api/admin/content/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'seed_problems',
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          force_reseed: forceReseed,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSeedResult(result.data);
        await fetchSeedInfo(); // Refresh info
      } else {
        throw new Error(result.error || 'Seeding failed');
      }
    } catch (error) {
      console.error('Error seeding content:', error);
      alert('Seeding failed: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllCategories = () => {
    if (!seedInfo) return;
    setSelectedCategories(seedInfo.available_seed_categories);
  };

  const clearSelection = () => {
    setSelectedCategories([]);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!seedInfo) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load seed data</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Pre-population</h1>
        <p className="mt-2 text-sm text-gray-700">
          Seed the platform with high-quality problems across different categories to provide initial content for users.
        </p>
      </div>

      {/* Current Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Platform Stats</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(seedInfo.current_problem_stats).map(([category, count]) => (
            <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{category}</p>
              <p className="text-2xl font-bold text-indigo-600">{count}</p>
              <p className="text-xs text-gray-500">problems</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seed Data Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">Available Seed Data</h4>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">Total problems available for seeding: <strong>{seedInfo.total_seed_problems}</strong></p>
              <p>Categories available: {seedInfo.available_seed_categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Select Categories to Seed</h3>
          <div className="flex space-x-2">
            <button
              onClick={selectAllCategories}
              className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seedInfo.seed_data.map((categoryData) => (
            <div
              key={categoryData.category}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                selectedCategories.includes(categoryData.category)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => toggleCategory(categoryData.category)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 capitalize">
                  {categoryData.category.replace('-', ' ')}
                </h4>
                <span className="text-sm text-gray-500">
                  {categoryData.problem_count} problems
                </span>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Sample problems:</p>
                <ul className="space-y-1">
                  {categoryData.sample_titles.map((title, index) => (
                    <li key={index} className="text-xs truncate">• {title}</li>
                  ))}
                </ul>
              </div>

              {selectedCategories.includes(categoryData.category) && (
                <div className="mt-2 flex items-center text-indigo-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Selected for seeding</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seeding Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Seeding Options</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="force-reseed"
              name="force-reseed"
              type="checkbox"
              checked={forceReseed}
              onChange={(e) => setForceReseed(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="force-reseed" className="ml-2 block text-sm text-gray-900">
              Force re-seed (will create duplicates if problems already exist)
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={runSeeding}
              disabled={seeding || (selectedCategories.length === 0 && !forceReseed)}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seeding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Seeding...
                </>
              ) : (
                <>
                  <BeakerIcon className="h-4 w-4 mr-2" />
                  {selectedCategories.length > 0 
                    ? `Seed ${selectedCategories.length} Categories`
                    : 'Seed All Categories'
                  }
                </>
              )}
            </button>

            {selectedCategories.length > 0 && (
              <span className="text-sm text-gray-500">
                Will seed: {selectedCategories.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seeding Results */}
      {seedResult && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seeding Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Created</p>
                  <p className="text-lg font-bold text-green-900">{seedResult.total_created}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">Skipped</p>
                  <p className="text-lg font-bold text-yellow-900">{seedResult.total_skipped}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <BeakerIcon className="h-6 w-6 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Categories</p>
                  <p className="text-lg font-bold text-blue-900">{seedResult.categories_seeded}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Results */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Results by Category</h4>
            {seedResult.results.map((result) => (
              <div key={result.category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-medium text-gray-900 capitalize">
                    {result.category.replace('-', ' ')}
                  </h5>
                  <div className="text-sm text-gray-500">
                    Created: {result.created} | Skipped: {result.skipped}
                  </div>
                </div>

                {result.problems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Created problems:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {result.problems.slice(0, 5).map((problem) => (
                        <div key={problem.id} className="text-sm text-gray-700 py-1">
                          • {problem.title}
                        </div>
                      ))}
                      {result.problems.length > 5 && (
                        <div className="text-sm text-gray-500 py-1">
                          ... and {result.problems.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}