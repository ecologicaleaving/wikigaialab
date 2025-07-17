'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { EnhancedUserDashboard } from '../../components/dashboard/EnhancedUserDashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <EnhancedUserDashboard />
    </ProtectedRoute>
  );
}