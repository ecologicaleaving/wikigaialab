'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Crown, User, Settings } from 'lucide-react';

interface AdminStatusIndicatorProps {
  className?: string;
}

export const AdminStatusIndicator: React.FC<AdminStatusIndicatorProps> = ({ 
  className = '' 
}) => {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
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

  if (!isAuthenticated || loading) return null;

  // Show admin interface if user is admin
  if (isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Accesso Amministratore</h3>
            <p className="text-sm text-amber-600">Sei un amministratore di WikiGaiaLab</p>
          </div>
        </div>

        <div className="space-y-2">
          <a 
            href="/admin" 
            className="block w-full p-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-center font-medium"
          >
            🏛️ Dashboard Amministratore
          </a>
          
          <div className="grid grid-cols-2 gap-2">
            <a 
              href="/admin/categories" 
              className="p-2 bg-white border border-amber-200 rounded hover:bg-amber-50 transition-colors text-center text-sm"
            >
              📂 Categorie
            </a>
            <a 
              href="/admin/monitoring" 
              className="p-2 bg-white border border-amber-200 rounded hover:bg-amber-50 transition-colors text-center text-sm"
            >
              📊 Monitoring
            </a>
          </div>
        </div>

        <div className="mt-3 p-2 bg-amber-100 rounded text-xs text-amber-700">
          <strong>Admin:</strong> {user?.email}
        </div>
      </motion.div>
    );
  }

  // Show status and grant option if not admin but authenticated
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-medium text-blue-800">Status Account</h3>
          <p className="text-sm text-blue-600">Utente standard</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm bg-blue-50 p-3 rounded">
          <strong>Auth Status:</strong> {isAuthenticated ? '✅ Autenticato' : '❌ Non autenticato'}<br/>
          <strong>Admin Status:</strong> {isAdmin ? '✅ Admin' : '❌ Non admin'}<br/>
          <strong>Database Check:</strong> {adminCheckResult?.isAdmin ? '✅ Admin in DB' : '❌ Non admin in DB'}<br/>
          <strong>Email:</strong> {user?.email}
        </div>

        {adminCheckResult && !adminCheckResult.isAdmin && (
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/grant-admin', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                  alert('Privilegi admin assegnati! Ricaricando la pagina...');
                  window.location.reload();
                } else {
                  alert(`Errore: ${result.error}`);
                }
              } catch (error) {
                alert('Errore durante l\'assegnazione dei privilegi admin');
              }
            }}
            className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            🔑 Attiva Privilegi Admin
          </button>
        )}
      </div>
    </motion.div>
  );
};