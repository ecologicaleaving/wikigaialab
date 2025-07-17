import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={clsx('rounded-lg border bg-white shadow-sm', className)}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={clsx('flex flex-col space-y-1.5 p-6', className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <h3 className={clsx('text-lg font-medium leading-none tracking-tight', className)}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <p className={clsx('text-sm text-gray-600', className)}>
      {children}
    </p>
  );
};

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={clsx('p-6 pt-0', className)}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={clsx('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  );
};