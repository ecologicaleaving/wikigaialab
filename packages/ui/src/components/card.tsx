import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg border border-neutral-200 bg-white p-6 shadow-sm',
          hover && 'hover:shadow-md transition-shadow',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';