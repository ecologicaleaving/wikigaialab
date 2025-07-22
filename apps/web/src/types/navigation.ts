export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  badge?: {
    text: string;
    color: string;
  } | number;
  active?: boolean;
  children?: NavigationItem[];
  priority?: number;
  description?: string;
  showWhenAuth?: boolean;
}

export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  requiresAuth?: boolean;
}

export interface HeaderProps {
  variant: 'landing' | 'authenticated' | 'admin';
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavigationItem[];
  user: any | null;
}

export interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: {
    text: string;
    color: string;
  } | number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}