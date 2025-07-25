# Sistema di Navigazione e Menu - WikiGaiaLab

## Filosofia della Navigazione

La navigazione del nostro **Laboratorio Artigiano Digitale** deve riflettere la logica di un vero laboratorio: ogni strumento ha il suo posto, ogni area ha una funzione chiara, e tutto è facilmente raggiungibile per chi lavora.

### Principi Guida
1. **Orientamento Spaziale**: Come in un laboratorio fisico, l'utente deve sempre sapere dove si trova
2. **Accessibilità degli Strumenti**: Le funzioni più usate sempre a portata di mano
3. **Linguaggio della Bottega**: Terminologia calda e accogliente, mai tecnica o fredda
4. **Gerarchia Naturale**: Dal generale al specifico, dal principale al secondario

## Struttura della Navigazione

### Navigazione Principale (Header)

#### Implementazione Attuale
```typescript
// Da: /apps/web/src/lib/navigation.ts
export const mainNavigationItems: NavigationItem[] = [
  { 
    id: 'home', 
    label: 'Laboratorio', 
    href: '/', 
    icon: Home,
    showWhenAuth: false
  },
  { 
    id: 'dashboard', 
    label: 'Il Mio Banco', 
    href: '/dashboard', 
    icon: BarChart3, 
    requiresAuth: true,
    priority: 1,
    description: 'Il vostro spazio nel laboratorio'
  },
  { 
    id: 'problems', 
    label: 'Problemi del Quartiere', 
    href: '/problems', 
    icon: Search, 
    requiresAuth: true,
    priority: 2,
    description: 'Aiuta a risolvere i problemi dei vicini'
  },
  { 
    id: 'create', 
    label: 'Porta Problema', 
    href: '/problems/new', 
    icon: Plus, 
    requiresAuth: true,
    priority: 3,
    description: 'Porta il tuo problema',
    badge: { text: '💭', color: 'bg-teal-500' }
  },
  { 
    id: 'apps', 
    label: 'Attrezzi', 
    href: '/apps', 
    icon: AppWindow, 
    requiresAuth: false,
    priority: 4,
    description: 'Gli strumenti creati insieme'
  }
];
```

#### Gerarchia Visual e Semantica

**Livello 1 - Identificazione (Brand)**:
```tsx
// Logo + Nome del laboratorio
<div className="flex items-center gap-3">
  <Image src="/images/wikigaialab-logo.svg" width={48} height={48} />
  <div>
    <h1 className="text-xl font-bold text-gray-900">WikiGaiaLab</h1>
    <p className="text-sm text-teal-600">Laboratorio Artigiano Digitale</p>
  </div>
</div>
```

**Livello 2 - Navigazione Primaria**:
```tsx
// Menu orizzontale desktop / hamburger mobile
<nav className="hidden md:flex items-center space-x-8">
  {navigationItems.map(item => (
    <NavigationLink 
      key={item.id}
      href={item.href}
      className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200"
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </NavigationLink>
  ))}
</nav>
```

**Livello 3 - Azioni Utente**:
```tsx
// Menu utente + azioni secondarie
<div className="flex items-center gap-4">
  {/* Notifiche */}
  <button className="relative p-2 text-gray-600 hover:text-teal-600">
    <Bell className="w-5 h-5" />
    {hasNotifications && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 rounded-full"></span>
    )}
  </button>
  
  {/* Menu utente */}
  <UserMenu user={user} />
</div>
```

### Navigazione Secondaria

#### Menu Utente (Dropdown)
```typescript
export const userMenuItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Il Mio Banco',
    href: '/dashboard',
    icon: Home,
    requiresAuth: true
  },
  {
    id: 'profile',
    label: 'Il Mio Profilo',
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
```

#### Menu di Contesto (Per Sezioni)
```typescript
// Menu specifici per ogni area del laboratorio
export const problemsMenuItems = [
  {
    id: 'all',
    label: 'Tutti i Problemi',
    href: '/problems',
    count: 'problems.length'
  },
  {
    id: 'trending',
    label: 'In Fermento',
    href: '/problems?filter=trending',
    badge: '🔥'
  },
  {
    id: 'my-votes',
    label: 'I Miei Voti',
    href: '/problems?filter=voted',
    requiresAuth: true
  }
];
```

## Stili e Stati dei Menu

### Palette Colori Navigazione
```css
:root {
  /* Stati base */
  --nav-text-default: #374151;        /* gray-700 */
  --nav-text-hover: #00695C;          /* teal-700 WikiGaia */
  --nav-text-active: #00B894;         /* teal-600 WikiGaia */
  --nav-bg-hover: #B2DFDB;            /* teal-100 */
  --nav-bg-active: #80CBC4;           /* teal-200 */
  
  /* Badge e notifiche */
  --nav-badge-primary: #00B894;       /* Verde WikiGaia */
  --nav-badge-warning: #FFB74D;       /* Giallo complementare */
  --nav-badge-error: #E57373;         /* Rosso soft */
}
```

### Stati Interattivi

#### Stati Base
```scss
.nav-item {
  // Stato di riposo
  @apply text-gray-700 bg-transparent;
  transition: all 200ms ease-out;
  
  // Hover - "L'attenzione si posa"
  &:hover {
    @apply text-teal-700 bg-teal-50;
    transform: translateY(-1px);
  }
  
  // Active - "Questo è dove sono"
  &.active {
    @apply text-teal-600 bg-teal-100;
    box-shadow: inset 3px 0 0 var(--nav-badge-primary);
  }
  
  // Focus - "Accessibilità garantita"
  &:focus {
    @apply outline-none ring-2 ring-teal-500 ring-offset-2;
  }
  
  // Disabled - "Non disponibile ora"
  &:disabled {
    @apply text-gray-400 cursor-not-allowed;
    opacity: 0.6;
  }
}
```

#### Animazioni Menu Mobile
```scss
// Hamburger Menu Transform
.hamburger-line {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  // Stato chiuso → aperto
  &.open {
    &:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    &:nth-child(2) { opacity: 0; }
    &:nth-child(3) { transform: rotate(-45deg) translate(7px, -6px); }
  }
}

// Menu slide in/out
.mobile-menu {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
  
  &.open {
    transform: translateX(0);
  }
}
```

### Responsive Behavior

#### Desktop (≥768px)
```tsx
// Menu orizzontale completo
<nav className="hidden md:flex items-center space-x-6">
  {mainNavigationItems.map(item => (
    <NavigationLink 
      key={item.id}
      item={item}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
    />
  ))}
</nav>
```

#### Tablet (768px - 1023px)
```tsx
// Menu compatto con icone + testo ridotto
<nav className="hidden sm:flex md:hidden items-center space-x-4">
  {mainNavigationItems.map(item => (
    <NavigationLink 
      key={item.id}
      item={item}
      className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs"
    >
      <item.icon className="w-5 h-5" />
      <span className="hidden lg:block">{item.label}</span>
    </NavigationLink>
  ))}
</nav>
```

#### Mobile (≤767px)
```tsx
// Hamburger menu + slide drawer
<div className="sm:hidden">
  <button 
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    className="p-2 text-gray-600 hover:text-teal-600"
    aria-label="Menu principale"
  >
    <Menu className="w-6 h-6" />
  </button>
  
  {/* Overlay + Drawer */}
  <MobileMenu 
    isOpen={mobileMenuOpen}
    onClose={() => setMobileMenuOpen(false)}
    items={mainNavigationItems}
  />
</div>
```

## Voice & Tone nei Menu

### Linguaggio dei Menu

#### Terminologia del Laboratorio
```typescript
// ✅ Linguaggio caldo e accogliente
const menuLabels = {
  // Invece di "Dashboard" → "Il Mio Banco"
  dashboard: "Il Mio Banco",
  
  // Invece di "Problems" → "Problemi del Quartiere"  
  problems: "Problemi del Quartiere",
  
  // Invece di "Create" → "Porta Problema"
  create: "Porta Problema",
  
  // Invece di "Apps" → "Attrezzi"
  apps: "Attrezzi",
  
  // Invece di "Profile" → "Il Mio Profilo"
  profile: "Il Mio Profilo"
};

// ✅ Descrizioni che invitano all'azione
const menuDescriptions = {
  dashboard: "Il vostro spazio nel laboratorio",
  problems: "Aiuta a risolvere i problemi dei vicini", 
  create: "Porta il tuo problema al laboratorio",
  apps: "Gli strumenti creati insieme dalla comunità"
};
```

#### Microcopy per Stati
```typescript
// Messaggi di stato e feedback
const menuMessages = {
  loading: "Preparando il laboratorio...",
  error: "Ops, qualcosa si è inceppato nel laboratorio",
  empty: "Il laboratorio è tranquillo ora",
  offline: "Laboratorio temporaneamente non raggiungibile",
  
  // Badge counts
  notifications: (count: number) => 
    count === 1 ? "1 novità" : `${count} novità`,
  
  // Tooltips
  tooltips: {
    home: "Torna alla bacheca principale",
    search: "Cerca tra i problemi della comunità",
    create: "Condividi un nuovo problema",
    profile: "Gestisci il tuo profilo e preferenze"
  }
};
```

### Hierarchy e Information Architecture

#### Breadcrumb Navigation
```typescript
// Generazione automatica breadcrumb con linguaggio naturale
export const breadcrumbLabels: Record<string, string> = {
  'problems': 'Problemi del Quartiere',
  'new': 'Porta Problema',
  'apps': 'Attrezzi del Laboratorio', 
  'profile': 'Il Mio Profilo',
  'votes': 'I Miei Voti',
  'admin': 'Gestione Laboratorio',
  'dashboard': 'Il Mio Banco',
  'settings': 'Impostazioni'
};

// Utilizzo:
// Home > Problemi del Quartiere > Porta Problema
// Home > Il Mio Profilo > I Miei Voti
```

### Accessibilità Menu

#### ARIA Labels e Semantic HTML
```tsx
// Menu principale con ruoli semantici corretti
<nav role="navigation" aria-label="Menu principale del laboratorio">
  <ul role="menubar" className="flex items-center space-x-6">
    {navigationItems.map(item => (
      <li key={item.id} role="none">
        <a 
          href={item.href}
          role="menuitem"
          aria-current={isActive ? "page" : undefined}
          aria-describedby={`${item.id}-description`}
          className="nav-item"
        >
          <item.icon aria-hidden="true" className="w-5 h-5" />
          <span>{item.label}</span>
        </a>
        
        {/* Descrizione nascosta per screen reader */}
        <span 
          id={`${item.id}-description`}
          className="sr-only"
        >
          {item.description}
        </span>
      </li>
    ))}
  </ul>
</nav>
```

#### Keyboard Navigation
```typescript
// Support completo navigazione da tastiera
const keyboardNavigation = {
  'ArrowRight': 'next-item',      // Item successivo
  'ArrowLeft': 'prev-item',       // Item precedente  
  'Enter': 'activate-item',       // Attiva item
  'Space': 'activate-item',       // Attiva item
  'Escape': 'close-menu',         // Chiudi menu mobile
  'Tab': 'natural-flow'           // Flusso naturale
};
```

## Implementazione Tecnica

### Componenti Chiave

#### NavigationLink Component
```tsx
// components/layout/NavigationLink.tsx
interface NavigationLinkProps {
  item: NavigationItem;
  isActive?: boolean;
  isMobile?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  item,
  isActive = false,
  isMobile = false,
  onClick,
  className = ''
}) => {
  const baseClasses = cn(
    "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200",
    isActive ? "text-teal-600 bg-teal-100" : "text-gray-700 hover:text-teal-600 hover:bg-teal-50",
    className
  );

  return (
    <Link 
      href={item.href} 
      className={baseClasses}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${item.label} - ${item.description}`}
    >
      <item.icon className="w-5 h-5" aria-hidden="true" />
      <span>{item.label}</span>
      
      {item.badge && (
        <span className={cn(
          "px-2 py-1 text-xs rounded-full",
          item.badge.color || "bg-teal-500 text-white"
        )}>
          {item.badge.text}
        </span>
      )}
    </Link>
  );
};
```

### Menu States Management
```typescript
// hooks/useNavigation.ts
export const useNavigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Filtra items basato su auth state
  const visibleItems = useMemo(() => 
    getNavigationItems(user, mainNavigationItems),
    [user]
  );
  
  // Auto-close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => setMobileMenuOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, []);
  
  return {
    mobileMenuOpen,
    setMobileMenuOpen,
    activeItem,
    setActiveItem,
    visibleItems
  };
};
```

## Testing e Quality Assurance

### Checklist Pre-Deploy Menu

#### ✅ Funzionalità
- [ ] Tutti i link funzionano correttamente
- [ ] Stati attivi mostrati correttamente  
- [ ] Menu mobile si apre/chiude senza errori
- [ ] Badge e contatori aggiornati in real-time
- [ ] Logout funziona da tutti i menu

#### ✅ Accessibilità  
- [ ] Navigazione completa da tastiera
- [ ] Screen reader legge correttamente tutti gli elementi
- [ ] Contrast ratio rispettato (min 4.5:1)
- [ ] Focus indicators visibili
- [ ] ARIA labels presenti e corretti

#### ✅ Responsive
- [ ] Menu desktop funziona correttamente
- [ ] Menu tablet ottimizzato
- [ ] Menu mobile scorrevole e usabile
- [ ] Touch targets min 44px su mobile
- [ ] Overflow handling corretto

#### ✅ Performance
- [ ] Animazioni fluide 60fps
- [ ] Lazy loading per menu complessi
- [ ] Nessun layout shift durante caricamento
- [ ] Bundle size ottimizzato

---

*Questa documentazione garantisce una navigazione coerente, accessibile e perfettamente integrata con l'identità del nostro Laboratorio Artigiano Digitale WikiGaia.*