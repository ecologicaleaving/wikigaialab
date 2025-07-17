'use client';

import { 
  ChartBarIcon, 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface WorkflowStatsProps {
  stats: {
    totalProblems: number;
    byStatus: {
      'Proposed': number;
      'Under Review': number;
      'Priority Queue': number;
      'In Development': number;
      'Completed': number;
      'Rejected': number;
    };
    developmentQueue: {
      total: number;
      byPriority: {
        urgent: number;
        high: number;
        medium: number;
        low: number;
      };
    };
    recentChanges: number;
  };
}

export function AdminWorkflowStats({ stats }: WorkflowStatsProps) {
  const quickStats = [
    {
      name: 'Problemi Totali',
      value: stats.totalProblems,
      icon: ChartBarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'In Coda Sviluppo',
      value: stats.developmentQueue.total,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Completati',
      value: stats.byStatus['Completed'],
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Cambiamenti Recenti',
      value: stats.recentChanges,
      icon: XMarkIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {quickStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}