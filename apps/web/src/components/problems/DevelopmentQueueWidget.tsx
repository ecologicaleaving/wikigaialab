'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClockIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface QueueItem {
  id: string;
  problem_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  queue_position: number;
  status: 'queued' | 'in_progress' | 'completed' | 'blocked';
  estimated_hours?: number;
  problem: {
    id: string;
    title: string;
    vote_count: number;
    category: {
      id: string;
      name: string;
    };
  };
}

export function DevelopmentQueueWidget() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflow/development-queue?limit=10&status=queued');
      
      if (!response.ok) {
        throw new Error('Failed to fetch development queue');
      }
      
      const data = await response.json();
      setQueue(data.queue || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || queue.length === 0) {
    return null; // Don't show widget if there's an error or no queue items
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">
            In Sviluppo
          </h3>
        </div>
        <Link
          href="/admin/workflow"
          className="text-sm text-blue-600 hover:text-blue-500 flex items-center space-x-1"
        >
          <span>Vedi tutto</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {queue.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="flex-shrink-0 text-xs text-gray-500 font-mono">
                  #{item.queue_position}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.problem.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.problem.vote_count} voti
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.problem.category.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Link
              href={`/problems/${item.problem_id}`}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Visualizza problema"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
      
      {queue.length > 5 && (
        <div className="mt-4 text-center">
          <Link
            href="/admin/workflow"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Altri {queue.length - 5} problemi in coda...
          </Link>
        </div>
      )}
    </div>
  );
}