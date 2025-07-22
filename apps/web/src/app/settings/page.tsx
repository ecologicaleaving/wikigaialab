'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout 
        title="Impostazioni"
        showBreadcrumbs={true}
        showNotifications={false}
      >
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Impostazioni Account
            </h2>
            <p className="text-gray-600 mb-4">
              Gestisci le tue preferenze e impostazioni dell'account.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                🚧 Questa pagina è in costruzione. Presto potrai gestire tutte le tue impostazioni da qui.
              </p>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}