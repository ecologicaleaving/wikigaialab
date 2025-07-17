'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function TestNotificationsPage() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Devi essere autenticato per accedere a questa pagina.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Accesso riservato agli amministratori.</p>
      </div>
    );
  }

  const testVoteMilestone = async (problemId: string, milestone: number) => {
    setTesting(true);
    try {
      const response = await fetch('/api/notifications/vote-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          newVoteCount: milestone,
          oldVoteCount: milestone - 1
        })
      });

      const result = await response.json();
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'vote_milestone',
        milestone,
        problemId,
        result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const testAdminAlert = async (problemId: string) => {
    setTesting(true);
    try {
      const response = await fetch('/api/notifications/vote-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          newVoteCount: 100,
          oldVoteCount: 99
        })
      });

      const result = await response.json();
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'admin_alert',
        problemId,
        result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setTesting(false);
    }
  };

  const checkNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/send-pending', {
        method: 'GET'
      });
      const result = await response.json();
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'check_service',
        result
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Test Notification System
          </h1>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Usa questa pagina per testare il sistema di notifiche. Assicurati di aver:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Inserito i template email nel database</li>
              <li>Configurato RESEND_API_KEY nell'ambiente (opzionale per test)</li>
              <li>Controllato i logs nel terminale</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Test Vote Milestones</h3>
              <div className="space-y-2">
                <button
                  onClick={() => testVoteMilestone('test-problem-id', 50)}
                  disabled={testing}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Test 50 votes milestone
                </button>
                <button
                  onClick={() => testVoteMilestone('test-problem-id', 75)}
                  disabled={testing}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Test 75 votes milestone
                </button>
                <button
                  onClick={() => testVoteMilestone('test-problem-id', 100)}
                  disabled={testing}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                >
                  Test 100 votes milestone
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Test Admin Alerts</h3>
              <div className="space-y-2">
                <button
                  onClick={() => testAdminAlert('test-problem-id')}
                  disabled={testing}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Test Admin Alert (100 votes)
                </button>
                <button
                  onClick={checkNotifications}
                  disabled={testing}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  Check Service Status
                </button>
              </div>
            </div>
          </div>

          {testing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-700 text-sm">⏳ Testing in progress...</p>
            </div>
          )}

          <div>
            <h3 className="font-medium text-gray-900 mb-3">Test Results</h3>
            <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">No tests run yet...</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="mb-2">
                    <span className="text-gray-400">[{result.timestamp}]</span>{' '}
                    <span className="text-yellow-400">{result.type}:</span>{' '}
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(result.result || result.error, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setResults([])}
              className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">🔍 What to Check:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Console logs in your terminal for notification processing</li>
              <li>• Database tables: notifications, vote_milestones, user_notification_preferences</li>
              <li>• Email delivery in Resend dashboard (if configured)</li>
              <li>• Network tab for API call responses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}