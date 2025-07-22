'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AuthenticatedLayout } from '../../components/layout';
import { EnhancedUserDashboard } from '../../components/dashboard/EnhancedUserDashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout 
        title="Dashboard"
        showBreadcrumbs={true}
        showNotifications={true}
      >
        <EnhancedUserDashboard />
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}