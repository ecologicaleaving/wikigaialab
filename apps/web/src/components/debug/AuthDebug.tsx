'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContextNextAuth';

export function AuthDebug() {
  const { user, loading, error, signOut } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>User:</strong> {user ? `${user.name} (${user.id})` : 'None'}
        </div>
        
        <div>
          <strong>Session:</strong> {user ? 'Active' : 'None'}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          {user && (
            <>
              <button
                onClick={signOut}
                className="block w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}