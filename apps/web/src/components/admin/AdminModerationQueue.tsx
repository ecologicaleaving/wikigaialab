'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { FlagIcon, EyeIcon } from '@heroicons/react/24/outline';

interface QueueItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  proposer: { id: string; name: string; email: string };
  category: { id: string; name: string };
}

interface AdminModerationQueueProps {
  queue: QueueItem[];
  totalPending: number;
  isPreview?: boolean;
}

export function AdminModerationQueue({ queue, totalPending, isPreview = false }: AdminModerationQueueProps) {
  const title = isPreview ? 'Coda di Moderazione' : 'Problemi in Attesa di Moderazione';

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {title}
          </h3>
          
          <div className="flex items-center space-x-2">
            <FlagIcon className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              {totalPending} in attesa
            </span>
          </div>
        </div>

        {totalPending === 0 ? (
          <div className="text-center py-8">
            <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna moderazione necessaria</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tutti i problemi sono stati moderati.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Da <span className="font-medium">{item.proposer.name}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Categoria: <span className="font-medium">{item.category.name}</span>
                        </span>
                        <span>•</span>
                        <time dateTime={item.created_at}>
                          {formatDistanceToNow(new Date(item.created_at), { 
                            addSuffix: true,
                            locale: it 
                          })}
                        </time>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/admin/moderation?highlight=${item.id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Modera
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isPreview && queue.length < totalPending && (
              <div className="mt-6 text-center">
                <Link
                  href="/admin/moderation"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FlagIcon className="h-4 w-4 mr-2" />
                  Visualizza tutti i {totalPending} problemi
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}