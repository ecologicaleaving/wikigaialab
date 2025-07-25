'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  Settings, 
  BarChart3, 
  Shield, 
  ExternalLink,
  Crown,
  Zap,
  User
} from '../../lib/icons';
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
        className={`card bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Crown className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-800">
              Banco del Maestro
            </h3>
            <p className="text-sm text-primary-600">
              Accesso amministratore attivo
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/admin" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover flex items-center gap-3 p-3 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <div className="flex-1">
                <div className="font-medium text-primary-800">Dashboard Admin</div>
                <div className="text-xs text-primary-600">Statistiche e gestione</div>
              </div>
              <ExternalLink className="w-4 h-4 text-primary-500" />
            </motion.div>
          </Link>

          <Link href="/admin/categories" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover flex items-center gap-3 p-3 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-primary-600" />
              <div className="flex-1">
                <div className="font-medium text-primary-800">Gestione Categorie</div>
                <div className="text-xs text-primary-600">Organizza i contenuti</div>
              </div>
              <ExternalLink className="w-4 h-4 text-primary-500" />
            </motion.div>
          </Link>

          <Link href="/admin/monitoring" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card-hover flex items-center gap-3 p-3 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <Shield className="w-5 h-5 text-primary-600" />
              <div className="flex-1">
                <div className="font-medium text-primary-800">Monitoraggio</div>
                <div className="text-xs text-primary-600">Sistema e sicurezza</div>
              </div>
              <ExternalLink className="w-4 h-4 text-primary-500" />
            </motion.div>
          </Link>
        </div>

        <div className="mt-4 p-3 bg-primary-100 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-primary-700">
            <Crown className="w-4 h-4" />
            <strong>Maestro:</strong> 
            <span className="font-medium">{user?.name || user?.email}</span>
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
        className={`card bg-gradient-to-br from-secondary-50 to-accent-50 border-secondary-200 ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary-100 rounded-lg">
            <Zap className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-800">
              Sviluppo: Accesso Admin
            </h3>
            <p className="text-sm text-secondary-600">
              Attiva privilegi amministratore
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-secondary-700 bg-secondary-50 p-3 rounded-lg border border-secondary-200">
            Il tuo account non ha ancora privilegi amministratore. 
            Puoi attivarli per accedere al pannello di controllo.
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGrantAdmin}
            disabled={granting}
            className={`btn w-full ${
              granting 
                ? 'btn-outline cursor-not-allowed opacity-50'
                : 'btn-secondary'
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

          <div className="flex items-center justify-center gap-1 text-xs text-secondary-600">
            <Zap className="w-3 h-3" />
            Solo per ambiente di sviluppo
          </div>
        </div>
      </motion.div>
    );
  }

  // No widget for non-admin users in production
  return null;
};