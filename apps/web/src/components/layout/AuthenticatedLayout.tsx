'use client';

import React from 'react';
import { BaseLayout } from './BaseLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  containerClassName?: string;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  children,
  title,
  showSidebar = false,
  sidebarContent,
  containerClassName = ''
}) => {
  return (
    <ProtectedRoute>
      <BaseLayout
        variant="authenticated"
        title={title}
        showBreadcrumbs={true}
        showSearch={true}
        showNotifications={true}
      >
        <div className={`container mx-auto px-4 py-6 ${containerClassName}`}>
          {showSidebar ? (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar */}
              <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-20">
                  {sidebarContent}
                </div>
              </aside>
              
              {/* Main Content */}
              <main className="flex-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {children}
                </div>
              </main>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {children}
            </div>
          )}
        </div>
      </BaseLayout>
    </ProtectedRoute>
  );
};