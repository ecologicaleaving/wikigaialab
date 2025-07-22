'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContextNextAuth';

export function AuthDebug() {
  const { user, loading, error, session, signOut } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>User:</strong> {user ? `${user.name || user.email} (${user.id})` : 'None'}
        </div>
        
        <div>
          <strong>Session:</strong> {session ? 'Active' : 'None'}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>

        <div>
          <strong>Environment:</strong> {process.env.NODE_ENV}
        </div>

        <div>
          <strong>NextAuth URL:</strong> {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}
        </div>

        <div>
          <strong>Google Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Missing'}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}

        {session && (
          <div className="text-green-600">
            <strong>Session Expires:</strong> {new Date(session.expires).toLocaleString()}
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          {user && (
            <button
              onClick={signOut}
              className="block w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
          
          <button
            onClick={() => {
              console.log('🔍 Auth Debug State:', {
                user,
                session,
                loading,
                error,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent.slice(0, 50) + '...'
              });
            }}
            className="block w-full px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
          >
            Log Debug Info
          </button>
        </div>
      </div>
    </div>
  );
}