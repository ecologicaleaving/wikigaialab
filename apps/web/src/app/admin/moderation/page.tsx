'use client';

import React from 'react';
import { AdminOnlyRoute } from '../../../components/auth/ProtectedRoute';
import { AdminProblemModeration } from '../../../components/admin/AdminProblemModeration';

export default function ModerationPage() {
  return (
    <AdminOnlyRoute>
      <AdminProblemModeration />
    </AdminOnlyRoute>
  );
}