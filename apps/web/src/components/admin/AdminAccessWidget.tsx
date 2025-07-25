'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  Settings, 
  BarChart3, 
  Shield, 
  Users,
  ExternalLink,
  Crown,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface AdminAccessWidgetProps {
  className?: string;
}

export const AdminAccessWidget: React.FC<AdminAccessWidgetProps> = ({ 
  className = '' 
}) => {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [showGrantAdmin, setShowGrantAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [granting, setGranting] = useState(false);

  // Check admin status on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetch('/api/admin/grant-admin')
      .then(res => res.json())
      .then(data => {
        setAdminStatus(data);
        // Show grant button if user exists but is not admin
        if (data.success && !data.isAdmin) {
          setShowGrantAdmin(true);
        }
      })
      .catch(console.error);
  }, [isAuthenticated]);

  // Grant admin privileges
  const handleGrantAdmin = async () => {
    setGranting(true);
    try {
      const response = await fetch('/api/admin/grant-admin', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Privilegi admin assegnati! Ricarica la pagina per vedere le modifiche.');
        window.location.reload();
      } else {
        alert(`Errore: ${result.error}`);
      }
    } catch (error) {
      alert('Errore durante l\'assegnazione dei privilegi admin');
      console.error(error);
    } finally {
      setGranting(false);
    }
  };

  // Don't show if not authenticated
  if (!isAuthenticated) return null;

  // Admin access widget for existing admins
  if (isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Crown className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-800">
              Banco del Maestro
            </h3>
            <p className="text-sm text-amber-600">
              Accesso amministratore attivo
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/admin" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <div className="font-medium text-amber-800">Dashboard Admin</div>
                <div className="text-xs text-amber-600">Statistiche e gestione</div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500" />
            </motion.div>
          </Link>

          <Link href="/admin/categories" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <div className="font-medium text-amber-800">Gestione Categorie</div>
                <div className="text-xs text-amber-600">Organizza i contenuti</div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500" />
            </motion.div>
          </Link>

          <Link href="/admin/monitoring" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200"
            >
              <Shield className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <div className="font-medium text-amber-800">Monitoraggio</div>
                <div className="text-xs text-amber-600">Sistema e sicurezza</div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-500" />
            </motion.div>
          </Link>
        </div>

        <div className="mt-4 p-3 bg-amber-100 rounded-lg">
          <div className="text-xs text-amber-700">
            <strong>👑 Maestro:</strong> {user?.name || user?.email}
          </div>
        </div>
      </motion.div>
    );
  }

  // Grant admin widget for non-admin users (development/testing)
  if (showGrantAdmin && process.env.NODE_ENV === 'development') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Sviluppo: Accesso Admin
            </h3>
            <p className="text-sm text-blue-600">
              Attiva privilegi amministratore
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
            Il tuo account non ha ancora privilegi amministratore. 
            Puoi attivarli per accedere al pannello di controllo.
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGrantAdmin}
            disabled={granting}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all duration-200 ${
              granting 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {granting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Attivazione...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Attiva Privilegi Admin
              </>
            )}
          </motion.button>

          <div className="text-xs text-blue-600 text-center">
            ⚠️ Solo per ambiente di sviluppo
          </div>
        </div>
      </motion.div>
    );
  }

  // No widget for non-admin users in production
  return null;
};