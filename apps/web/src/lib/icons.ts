// Central icon library following WikiGaia documentation
// Primary: Lucide React
export { 
  Heart,          // Voti e supporto
  Users,          // Comunità
  Lightbulb,      // Problemi e idee
  Settings,       // Configurazioni
  Search,         // Ricerca
  Plus,           // Aggiungere contenuto
  MessageCircle,  // Comunicazione
  Wrench,         // Strumenti del laboratorio
  Home,           // Navigazione
  User,           // Profili
  BarChart3,      // Analytics
  CheckCircle,    // Success states
  AlertCircle,    // Warning states
  Info,           // Information
  X,              // Close actions
  BookOpen,       // Stories/Documentation
  DollarSign,     // Economy category
  Zap,            // Energy category
  Laptop,         // Technology category
  Bell,           // Notifications
  Menu,           // Mobile menu
  ChevronRight,   // Navigation arrows
  ArrowRight,     // Action arrows
  TrendingUp,     // Trending content
  Calendar,       // Date/time
  Clock,          // Recent activity
  Star,           // Favorites/ratings
  Download,       // Downloads
  Filter,         // Filtering
  Eye,            // View actions
  Edit,           // Edit actions
  Trash2,         // Delete actions
  Share2,         // Social sharing
  ExternalLink,   // External links
  ChevronDown,    // Dropdowns
  Check,          // Checkmarks
  Leaf,           // Nature/ecology
} from 'lucide-react';

// Secondary: Heroicons (complementary)
export { 
  SparklesIcon,     // Celebrazioni
  GlobeAltIcon,     // Aspetti globali/ecologici
  CogIcon,          // Configurazioni avanzate
  ShieldCheckIcon   // Sicurezza e privacy
} from '@heroicons/react/24/outline';

// Note: Using Lucide React icons for ecological themes until phosphor-react is installed
// These approximate the ecological/artisan themes from the documentation
export const Plant = Leaf;           // Using Leaf for plant growth
export const Recycle = ArrowRight;   // Temporary until proper recycle icon
export const HandHeart = Heart;      // Using Heart for solidarity  
export const TreeEvergreen = Leaf;   // Using Leaf for ecology
export const Hammer = Wrench;        // Using Wrench for artisan tools
export const Gears = Settings;       // Using Settings for mechanics
export const Bicycle = ArrowRight;   // Temporary until proper bicycle icon

// Icon mapping for semantic usage
export const iconMap = {
  navigation: {
    home: Home,
    problems: Lightbulb,
    community: Users,
    tools: Wrench,
    profile: User,
    dashboard: BarChart3,
    apps: Laptop
  },
  actions: {
    vote: Heart,
    add: Plus,
    search: Search,
    settings: Settings,
    edit: Edit,
    delete: Trash2,
    share: Share2,
    view: Eye,
    close: X
  },
  states: {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
    celebration: SparklesIcon,
    loading: Settings // Can be animated
  },
  categories: {
    economy: DollarSign,
    environment: TreeEvergreen,
    energy: Zap,
    mobility: Bicycle,
    social: HandHeart,
    technology: Laptop
  },
  ecology: {
    plant: Plant,
    recycle: Recycle,
    nature: TreeEvergreen,
    world: GlobeAltIcon,
    sustainability: Leaf
  },
  ui: {
    menu: Menu,
    bell: Bell,
    chevronRight: ChevronRight,
    chevronDown: ChevronDown,
    arrowRight: ArrowRight,
    externalLink: ExternalLink,
    star: Star,
    trending: TrendingUp,
    calendar: Calendar,
    clock: Clock,
    filter: Filter,
    download: Download
  }
};

// Type exports for better TypeScript support
export type IconName = keyof typeof iconMap.navigation | 
                      keyof typeof iconMap.actions | 
                      keyof typeof iconMap.states | 
                      keyof typeof iconMap.categories |
                      keyof typeof iconMap.ecology |
                      keyof typeof iconMap.ui;