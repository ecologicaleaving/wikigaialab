'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bug, Database, User, Crown, Eye, EyeOff } from 'lucide-react';

interface AuthDebugWidgetProps {
  className?: string;
}

export const AuthDebugWidget: React.FC<AuthDebugWidgetProps> = ({ 
  className = '' 
}) => {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [adminCheckResult, setAdminCheckResult] = useState<any>(null);

  // Check admin status via API
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/admin/grant-admin')
        .then(res => res.json())
        .then(data => setAdminCheckResult(data))
        .catch(console.error);
    }
  }, [isAuthenticated]);

  // Show in development or when debug param is present
  const isDebugMode = process.env.NODE_ENV === 'development' || 
                      (typeof window !== 'undefined' && window.location.search.includes('debug=auth'));
  
  if (!isDebugMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-800">Auth Debug</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-purple-100 rounded transition-colors"
        >
          {isExpanded ? (
            <EyeOff className="w-4 h-4 text-purple-600" />
          ) : (
            <Eye className="w-4 h-4 text-purple-600" />
          )}
        </button>
      </div>

      {/* Basic Status */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className={`p-2 rounded flex items-center gap-2 ${
          isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <User className="w-4 h-4" />
          {isAuthenticated ? 'Authenticated' : 'Not Auth'}
        </div>
        
        <div className={`p-2 rounded flex items-center gap-2 ${
          isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
        }`}>
          <Crown className="w-4 h-4" />
          {isAdmin ? 'Admin' : 'Regular User'}
        </div>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-3"
        >
          {/* useAuth Hook Data */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              useAuth Hook
            </h4>
            <div className="text-xs space-y-1">
              <div>Loading: <code className="bg-gray-100 px-1 rounded">{loading ? 'true' : 'false'}</code></div>
              <div>isAuthenticated: <code className="bg-gray-100 px-1 rounded">{isAuthenticated ? 'true' : 'false'}</code></div>
              <div>isAdmin: <code className="bg-gray-100 px-1 rounded">{isAdmin ? 'true' : 'false'}</code></div>
              <div>User ID: <code className="bg-gray-100 px-1 rounded">{user?.id || 'null'}</code></div>
              <div>User Email: <code className="bg-gray-100 px-1 rounded">{user?.email || 'null'}</code></div>
              <div>is_admin field: <code className="bg-gray-100 px-1 rounded">{user?.is_admin ? 'true' : 'false'}</code></div>
            </div>
          </div>

          {/* NextAuth Session */}
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-800 mb-2">NextAuth Session</h4>
            <div className="text-xs space-y-1">
              <div>Has Session: <code className="bg-gray-100 px-1 rounded">{session ? 'true' : 'false'}</code></div>
              <div>Session User ID: <code className="bg-gray-100 px-1 rounded">{session?.user?.id || 'null'}</code></div>
              <div>Session Email: <code className="bg-gray-100 px-1 rounded">{session?.user?.email || 'null'}</code></div>
            </div>
          </div>

          {/* Database Check */}
          {adminCheckResult && (
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Check
              </h4>
              <div className="text-xs space-y-1">
                <div>API Success: <code className="bg-gray-100 px-1 rounded">{adminCheckResult.success ? 'true' : 'false'}</code></div>
                <div>DB isAdmin: <code className="bg-gray-100 px-1 rounded">{adminCheckResult.isAdmin ? 'true' : 'false'}</code></div>
                {adminCheckResult.user && (
                  <>
                    <div>DB User ID: <code className="bg-gray-100 px-1 rounded">{adminCheckResult.user.id}</code></div>
                    <div>DB is_admin: <code className="bg-gray-100 px-1 rounded">{adminCheckResult.user.is_admin ? 'true' : 'false'}</code></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Admin Grant (Development Only) */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/grant-admin', { method: 'POST' });
                    const result = await response.json();
                    alert(result.success ? 'Admin granted! Refresh page.' : `Error: ${result.error}`);
                    if (result.success) window.location.reload();
                  } catch (error) {
                    alert('Error granting admin');
                  }
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Grant Admin Privileges
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};