'use client';

import { useState } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  StarIcon, 
  FlagIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface ContentModerationCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    moderation_status: 'pending' | 'approved' | 'rejected';
    is_featured: boolean;
    quality_score: number;
    flag_count: number;
    created_at: string;
    proposer: {
      id: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
    };
  };
  onModerationAction: (problemId: string, action: string, reason?: string) => Promise<void>;
  isProcessing?: boolean;
}

export function ContentModerationCard({ 
  problem, 
  onModerationAction, 
  isProcessing = false 
}: ContentModerationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (['reject', 'flag'].includes(action) && !actionReason.trim()) {
      setShowReasonInput(true);
      setPendingAction(action);
      return;
    }

    try {
      await onModerationAction(problem.id, action, actionReason || undefined);
      setActionReason('');
      setShowReasonInput(false);
      setPendingAction(null);
    } catch (error) {
      console.error('Error performing moderation action:', error);
    }
  };

  const confirmActionWithReason = async () => {
    if (pendingAction && actionReason.trim()) {
      await handleAction(pendingAction);
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {problem.title}
            </h3>
            
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {problem.proposer.name}
              </div>
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {new Date(problem.created_at).toLocaleDateString()}
              </div>
              
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {problem.category.name}
              </span>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.moderation_status)}`}>
              {problem.moderation_status}
            </span>
            
            {problem.is_featured && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                <StarIcon className="h-3 w-3 mr-1" />
                Featured
              </span>
            )}
            
            {problem.flag_count > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
                <FlagIcon className="h-3 w-3 mr-1" />
                {problem.flag_count} flags
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className={`text-gray-700 ${showDetails ? '' : 'line-clamp-3'}`}>
          {problem.description}
        </p>
        
        {problem.description.length > 200 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showDetails ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Quality Score */}
        <div className="mt-3 flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Quality Score:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityScoreColor(problem.quality_score)}`}>
              {problem.quality_score.toFixed(1)}/100
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {problem.moderation_status === 'pending' && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          {showReasonInput ? (
            <div className="space-y-3">
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={`Reason for ${pendingAction}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  onClick={confirmActionWithReason}
                  disabled={!actionReason.trim() || isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Confirm {pendingAction}
                </button>
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setPendingAction(null);
                    setActionReason('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Approve
              </button>
              
              <button
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reject
              </button>
              
              <button
                onClick={() => handleAction('feature')}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <StarIcon className="h-4 w-4 mr-1" />
                Feature
              </button>
              
              <button
                onClick={() => handleAction('flag')}
                disabled={isProcessing}
                className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FlagIcon className="h-4 w-4 mr-1" />
                Flag
              </button>
            </div>
          )}
        </div>
      )}

      {/* Additional actions for approved content */}
      {problem.moderation_status === 'approved' && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction(problem.is_featured ? 'unfeature' : 'feature')}
              disabled={isProcessing}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                problem.is_featured
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <StarIcon className="h-4 w-4 mr-1" />
              {problem.is_featured ? 'Unfeature' : 'Feature'}
            </button>
            
            <button
              onClick={() => handleAction('hide')}
              disabled={isProcessing}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Hide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}