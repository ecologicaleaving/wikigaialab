'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

interface BaseLayoutProps {
  children: React.ReactNode;
  variant?: 'landing' | 'authenticated' | 'admin';
  title?: string;
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  loading?: boolean;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  variant = 'authenticated',
  title,
  showBreadcrumbs = false,
  showSearch = false,
  showNotifications = false,
  showHeader = true,
  showFooter = true,
  loading = false
}) => {
  const { loading: authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-primary-600 text-white p-4 z-50"
      >
        Vai al contenuto principale
      </a>

      {showHeader && (
        <Header
          variant={variant}
          showBreadcrumbs={showBreadcrumbs}
          showSearch={showSearch}
          showNotifications={showNotifications}
        />
      )}
      
      <main id="main-content" className="flex-1">
        {title && (
          <div className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
        )}
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};