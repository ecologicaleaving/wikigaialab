import { NavigationItem } from '@/types/navigation';
import { 
  Home, 
  Lightbulb, 
  AppWindow, 
  User, 
  Shield, 
  Settings,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';

export const mainNavigationItems: NavigationItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    href: '/', 
    icon: Home 
  },
  { 
    id: 'problems', 
    label: 'Problemi', 
    href: '/problems', 
    icon: Lightbulb, 
    requiresAuth: true 
  },
  { 
    id: 'apps', 
    label: 'Le Mie App', 
    href: '/apps', 
    icon: AppWindow, 
    requiresAuth: true 
  },
  { 
    id: 'profile', 
    label: 'Profilo', 
    href: '/profile', 
    icon: User, 
    requiresAuth: true 
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    href: '/admin', 
    icon: Shield, 
    adminOnly: true 
  }
];

export const userMenuItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true
  },
  {
    id: 'profile',
    label: 'Profilo',
    href: '/profile',
    icon: User,
    requiresAuth: true
  },
  {
    id: 'settings',
    label: 'Impostazioni',
    href: '/settings',
    icon: Settings,
    requiresAuth: true
  }
];

export const footerNavigation = {
  community: {
    title: 'Community',
    links: [
      { label: 'Problemi', href: '/problems' },
      { label: 'App Sviluppate', href: '/apps' },
      { label: 'Classifica', href: '/leaderboard' },
      { label: 'Linee Guida', href: '/guidelines' }
    ]
  },
  support: {
    title: 'Supporto',
    links: [
      { label: 'Centro Aiuto', href: '/help' },
      { label: 'Contattaci', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Termini di Servizio', href: '/terms' }
    ]
  },
  resources: {
    title: 'Risorse',
    links: [
      { label: 'Documentazione', href: '/docs' },
      { label: 'API', href: '/api-docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Chi Siamo', href: '/about' }
    ]
  }
};

export const mobileMenuNavigation: NavigationItem[] = [
  ...mainNavigationItems.filter(item => !item.adminOnly),
  { 
    id: 'help', 
    label: 'Aiuto', 
    href: '/help', 
    icon: HelpCircle 
  },
  { 
    id: 'terms', 
    label: 'Termini', 
    href: '/terms', 
    icon: FileText 
  }
];

// Breadcrumb label mapping for dynamic routes
export const breadcrumbLabels: Record<string, string> = {
  'problems': 'Problemi',
  'apps': 'Le Mie App',
  'profile': 'Profilo',
  'admin': 'Amministrazione',
  'dashboard': 'Dashboard',
  'settings': 'Impostazioni',
  'help': 'Aiuto',
  'privacy': 'Privacy Policy',
  'terms': 'Termini di Servizio',
  'guidelines': 'Linee Guida',
  'leaderboard': 'Classifica',
  'contact': 'Contattaci',
  'about': 'Chi Siamo'
};

// Get filtered navigation items based on user auth status
export const getNavigationItems = (
  user: any | null,
  items: NavigationItem[] = mainNavigationItems
): NavigationItem[] => {
  return items.filter(item => {
    if (item.adminOnly && !user?.is_admin) return false;
    if (item.requiresAuth && !user) return false;
    return true;
  });
};

// Generate breadcrumb items from pathname
export const generateBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Home', href: '/' }];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ label, href });
  });

  return breadcrumbs;
};