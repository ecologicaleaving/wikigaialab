import { LucideIcon } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconColor = 'primary' | 'secondary' | 'nature' | 'neutral' | 'success' | 'warning' | 'error';

interface IconProps {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  size?: IconSize;
  color?: IconColor;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const iconSizes = {
  xs: 'w-3 h-3',    // 12px
  sm: 'w-4 h-4',    // 16px
  md: 'w-5 h-5',    // 20px
  lg: 'w-6 h-6',    // 24px
  xl: 'w-8 h-8'     // 32px
};

const iconColors = {
  primary: 'text-teal-600',      // #00B894
  secondary: 'text-teal-700',    // #00695C
  nature: 'text-emerald-600',    // #26A69A
  neutral: 'text-gray-600',      // #757575
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-400'
};

export const Icon: React.FC<IconProps> = ({ 
  icon: IconComponent, 
  size = 'md', 
  color = 'neutral',
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}) => {
  const sizeClass = iconSizes[size];
  const colorClass = iconColors[color];
  
  return (
    <IconComponent 
      className={`${sizeClass} ${colorClass} ${className}`}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
};

// Export for convenience
export default Icon;