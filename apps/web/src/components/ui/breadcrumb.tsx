'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className = '',
}) => {
  return (
    <nav className={clsx('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            )}
            
            {item.current ? (
              <span 
                className="text-gray-900 font-medium truncate max-w-48"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href || '#'}
                className="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-32"
              >
                {index === 0 ? (
                  <div className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </div>
                ) : (
                  item.label
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};