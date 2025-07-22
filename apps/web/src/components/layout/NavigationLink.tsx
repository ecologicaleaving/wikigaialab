'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationLinkProps } from '@/types/navigation';

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  href,
  children,
  icon: Icon,
  badge,
  active,
  onClick,
  className = ''
}) => {
  const pathname = usePathname();
  const isActive = active || pathname === href;

  const baseClasses = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeClasses = isActive 
    ? "bg-primary-100 text-primary-900" 
    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={16} className="flex-shrink-0" />}
      <span>{children}</span>
      {badge !== undefined && (
        <span 
          className={`ml-2 text-white text-xs rounded-full h-5 px-2 flex items-center justify-center flex-shrink-0 ${
            typeof badge === 'object' ? badge.color : 'bg-red-500'
          }`}
        >
          {typeof badge === 'object' ? badge.text : (badge > 99 ? '99+' : badge)}
        </span>
      )}
    </Link>
  );
};

export const MobileNavigationLink: React.FC<NavigationLinkProps> = ({
  href,
  children,
  icon: Icon,
  badge,
  active,
  onClick,
  className = ''
}) => {
  const pathname = usePathname();
  const isActive = active || pathname === href;

  const baseClasses = "flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors duration-200 w-full";
  const activeClasses = isActive 
    ? "bg-primary-50 text-primary-900 border-l-4 border-primary-500" 
    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses} ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon size={20} className="flex-shrink-0" />}
      <span className="flex-1">{children}</span>
      {badge !== undefined && (
        <span 
          className={`text-white text-xs rounded-full h-5 px-2 flex items-center justify-center flex-shrink-0 ${
            typeof badge === 'object' ? badge.color : 'bg-red-500'
          }`}
        >
          {typeof badge === 'object' ? badge.text : (badge > 99 ? '99+' : badge)}
        </span>
      )}
    </Link>
  );
};