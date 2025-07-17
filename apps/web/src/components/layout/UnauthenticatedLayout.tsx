'use client';

import React from 'react';
import { BaseLayout } from './BaseLayout';

interface UnauthenticatedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showCTA?: boolean;
  containerClassName?: string;
}

export const UnauthenticatedLayout: React.FC<UnauthenticatedLayoutProps> = ({
  children,
  title,
  showCTA = true,
  containerClassName = ''
}) => {
  return (
    <BaseLayout
      variant="landing"
      title={title}
      showBreadcrumbs={false}
      showSearch={false}
      showNotifications={false}
    >
      <div className={`${containerClassName}`}>
        {children}
      </div>
    </BaseLayout>
  );
};