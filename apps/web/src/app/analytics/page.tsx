'use client';

import React from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { PremiumAnalyticsDashboard } from '../../components/premium/PremiumAnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <PremiumAnalyticsDashboard />
    </ProtectedRoute>
  );
}