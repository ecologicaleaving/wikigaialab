'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface Activity {
  id: string;
  title: string;
  status: string;
  moderation_status: string;
  created_at: string;
  proposer: { id: string; name: string };
  category: { id: string; name: string };
}

interface AdminActivityFeedProps {
  activities: Activity[];
  recentCount: number;
}

const statusColors = {
  Proposed: 'bg-blue-100 text-blue-800',
  'In Development': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
};

const moderationColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  needs_changes: 'bg-orange-100 text-orange-800',
};

export function AdminActivityFeed({ activities, recentCount }: AdminActivityFeedProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Attività Recente
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">{recentCount}</span> problemi negli ultimi 7 giorni
          </p>
        </div>

        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activities.length === 0 ? (
              <li className="text-center py-4">
                <p className="text-sm text-gray-500">Nessuna attività recente</p>
              </li>
            ) : (
              activities.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          moderationColors[activity.moderation_status as keyof typeof moderationColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          <span className="text-xs font-medium">
                            {activity.moderation_status === 'pending' ? 'P' : 
                             activity.moderation_status === 'approved' ? 'A' :
                             activity.moderation_status === 'rejected' ? 'R' : 'C'}
                          </span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Da <span className="font-medium">{activity.proposer.name}</span> in{' '}
                            <span className="font-medium">{activity.category.name}</span>
                          </p>
                          <div className="mt-1 flex space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              moderationColors[activity.moderation_status as keyof typeof moderationColors] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.moderation_status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <time dateTime={activity.created_at}>
                            {formatDistanceToNow(new Date(activity.created_at), { 
                              addSuffix: true,
                              locale: it 
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {activities.length > 0 && (
          <div className="mt-6">
            <Link
              href="/admin/moderation"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Visualizza tutte le attività
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}