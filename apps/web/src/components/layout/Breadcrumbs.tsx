'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { generateBreadcrumbs } from '@/lib/navigation';

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  return (
    <nav 
      className="flex items-center space-x-1 text-sm text-gray-500"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight size={16} className="mx-1 text-gray-400 flex-shrink-0" />
            )}
            {index === breadcrumbs.length - 1 ? (
              // Current page
              <span 
                className="text-gray-900 font-medium"
                aria-current="page"
              >
                {index === 0 && <Home size={14} className="inline mr-1" />}
                {crumb.label}
              </span>
            ) : (
              // Link to parent pages
              <Link
                href={crumb.href}
                className="hover:text-primary-600 transition-colors inline-flex items-center"
              >
                {index === 0 && <Home size={14} className="mr-1" />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};