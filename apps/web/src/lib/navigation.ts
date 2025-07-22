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
  BarChart3,
  Plus,
  Search,
  Heart
} from 'lucide-react';

// Primary Navigation - Optimized UX hierarchy
export const mainNavigationItems: NavigationItem[] = [
  { 
    id: 'home', 
    label: 'Home', 
    href: '/', 
    icon: Home,
    showWhenAuth: false, // Hide when authenticated (redirect to dashboard)
  },
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: BarChart3, 
    requiresAuth: true,
    priority: 1 // Highest priority for authenticated users
  },
  { 
    id: 'problems', 
    label: 'Esplora', 
    href: '/problems', 
    icon: Search, 
    requiresAuth: true,
    priority: 2,
    description: 'Scopri e vota problemi'
  },
  { 
    id: 'create', 
    label: 'Proponi', 
    href: '/problems/new', 
    icon: Plus, 
    requiresAuth: true,
    priority: 3,
    description: 'Proponi un problema',
    badge: { text: 'CTA', color: 'bg-green-500' }
  },
  { 
    id: 'apps', 
    label: 'App', 
    href: '/apps', 
    icon: AppWindow, 
    requiresAuth: false,
    priority: 4,
    description: 'Scopri le app sviluppate'
  }
];

// Secondary Navigation Items (less prominent)
export const secondaryNavigationItems: NavigationItem[] = [
  { 
    id: 'profile', 
    label: 'Profilo', 
    href: '/profile', 
    icon: User, 
    requiresAuth: true 
  },
  { 
    id: 'favorites', 
    label: 'Voti', 
    href: '/profile?tab=votes', 
    icon: Heart, 
    requiresAuth: true 
  },
  { 
    id: 'admin', 
    label: 'Amministrazione', 
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
      { label: 'App', href: '/apps' },
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

// Utility navigation items 
export const utilityNavigationItems: NavigationItem[] = [
  { 
    id: 'settings', 
    label: 'Impostazioni', 
    href: '/settings', 
    icon: Settings,
    requiresAuth: true 
  },
  { 
    id: 'help', 
    label: 'Centro Aiuto', 
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

// Enhanced breadcrumb label mapping with contextual information
export const breadcrumbLabels: Record<string, string> = {
  'problems': 'Esplora Problemi',
  'new': 'Proponi Problema',
  'apps': 'App della Community',
  'profile': 'Il Mio Profilo',
  'votes': 'I Miei Voti',
  'admin': 'Amministrazione',
  'dashboard': 'Dashboard',
  'settings': 'Impostazioni',
  'help': 'Centro Aiuto',
  'privacy': 'Privacy Policy',
  'terms': 'Termini di Servizio',
  'guidelines': 'Linee Guida Community',
  'leaderboard': 'Classifica',
  'contact': 'Contattaci',
  'about': 'Chi Siamo',
  'docs': 'Documentazione',
  'api-docs': 'API Documentation',
  'blog': 'Blog WikiGaiaLab'
};

// Get filtered navigation items based on user auth status and UX context
export const getNavigationItems = (
  user: any | null,
  items: NavigationItem[] = mainNavigationItems
): NavigationItem[] => {
  return items
    .filter(item => {
      // Admin-only items
      if (item.adminOnly && !user?.is_admin) return false;
      
      // Auth-required items  
      if (item.requiresAuth && !user) return false;
      
      // Items to hide when authenticated (like Home)
      if (item.showWhenAuth === false && user) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by priority (lower number = higher priority)
      const priorityA = a.priority || 999;
      const priorityB = b.priority || 999;
      return priorityA - priorityB;
    });
};

// Get all navigation items (primary + secondary + utility) for mobile menu
export const getAllNavigationItems = (user: any | null): NavigationItem[] => {
  const primary = getNavigationItems(user, mainNavigationItems);
  const secondary = getNavigationItems(user, secondaryNavigationItems);
  const utility = getNavigationItems(user, utilityNavigationItems);
  
  return [...primary, ...secondary, ...utility];
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