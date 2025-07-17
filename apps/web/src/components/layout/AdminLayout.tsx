'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Flag,
  Database
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/users', label: 'Utenti', icon: Users },
  { href: '/admin/problems', label: 'Problemi', icon: FileText },
  { href: '/admin/reports', label: 'Segnalazioni', icon: Flag },
  { href: '/admin/database', label: 'Database', icon: Database },
  { href: '/admin/settings', label: 'Impostazioni', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title
}) => {
  const pathname = usePathname();

  const sidebarContent = (
    <nav className="space-y-1">
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
        <Shield className="text-primary-600" size={20} />
        <span className="font-semibold text-gray-900">Amministrazione</span>
      </div>
      {adminMenuItems.map(item => {
        const isActive = pathname === item.href || 
          (item.href !== '/admin' && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-100 text-primary-900'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AuthenticatedLayout
      title={title || 'Amministrazione'}
      showSidebar={true}
      sidebarContent={sidebarContent}
    >
      {children}
    </AuthenticatedLayout>
  );
};