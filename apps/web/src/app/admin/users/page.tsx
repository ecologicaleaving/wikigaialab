'use client';

import React from 'react';
import { AdminOnlyRoute } from '../../../components/auth/ProtectedRoute';
import { AdminUserManagement } from '../../../components/admin/AdminUserManagement';

export default function UsersPage() {
  return (
    <AdminOnlyRoute>
      <AdminUserManagement />
    </AdminOnlyRoute>
  );
}