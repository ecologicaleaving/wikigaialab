# Icone e Grafiche per WikiGaiaLab

## Filosofia Visiva del Laboratorio

Il nostro Laboratorio Artigiano Digitale richiede elementi grafici che riflettano:
- **Calore umano** e accoglienza del laboratorio artigiano
- **Valori ecologici** di WikiGaia (sostenibilità, natura, crescita)
- **Semplicità** e comprensibilità per tutti gli utenti
- **Coerenza** con la palette verde/teal del brand

## Librerie di Icone Principali

### 1. Lucide React (Primaria) ⭐
**Utilizzo**: Icone di interfaccia principale
**Installazione**: `npm install lucide-react`
**Perché la scegliamo**:
- ✅ Stile pulito e moderno che si adatta al nostro design
- ✅ Ottima copertura per UI/UX (navigazione, azioni, stati)
- ✅ Ottimizzata per React e TypeScript
- ✅ Consistente con il design system Tailwind
- ✅ Open source e ben mantenuta

**Icone Chiave per WikiGaiaLab**:
```tsx
import { 
  Heart,          // Voti e supporto
  Users,          // Comunità
  Lightbulb,      // Problemi e idee
  Settings,       // Configurazioni
  Search,         // Ricerca
  Plus,           // Aggiungere contenuto
  MessageCircle,  // Comunicazione
  Leaf,           // Elementi ecologici
  Wrench,         // Strumenti del laboratorio
  Home,           // Navigazione
  User,           // Profili
  BarChart3       // Analytics
} from 'lucide-react';
```

### 2. Heroicons (Secondaria)
**Utilizzo**: Icone complementari e stati avanzati
**Installazione**: `npm install @heroicons/react`
**Perché la includiamo**:
- ✅ Perfetta integrazione con Tailwind CSS
- ✅ Versioni outline e solid per diversi contesti
- ✅ Creata dal team di Tailwind (coerenza garantita)
- ✅ Ottima per icone di stato e notifiche

**Icone Specifiche**:
```tsx
import { 
  SparklesIcon,     // Celebrazioni
  GlobeAltIcon,     // Aspetti globali/ecologici
  CogIcon,          // Configurazioni avanzate
  ShieldCheckIcon   // Sicurezza e privacy
} from '@heroicons/react/24/outline';
```

### 3. Phosphor Icons (Specializzata)
**Utilizzo**: Icone tematiche per ecologia e artigianato
**Installazione**: `npm install phosphor-react`
**Perché la aggiungiamo**:
- ✅ Ricca di icone naturali/ecologiche perfette per WikiGaia
- ✅ Stile friendly e approachable
- ✅ Ottima per rappresentare concetti di sostenibilità

**Icone Tematiche**:
```tsx
import { 
  Plant,          // Crescita e natura
  Recycle,        // Sostenibilità
  HandHeart,      // Solidarietà
  TreeEvergreen,  // Ecologia
  Hammer,         // Artigianato
  Gears           // Meccanica del laboratorio
} from 'phosphor-react';
```

## Librerie di Illustrazioni e Grafiche

### 1. Undraw (Illustrazioni Primarie) ⭐
**Utilizzo**: Illustrazioni per onboarding, stati vuoti, hero sections
**Fonte**: https://undraw.co/
**Licenza**: MIT (uso libero)
**Perché la scegliamo**:
- ✅ Stile coerente e professionale
- ✅ Personalizzabile con i nostri colori WikiGaia
- ✅ Ampia gamma di situazioni (collaborazione, tecnologia, crescita)
- ✅ SVG ottimizzati e responsive

**Illustrazioni Chiave**:
- `community.svg` - Per sezioni di comunità
- `collaboration.svg` - Per il lavoro di gruppo
- `problem_solving.svg` - Per la risoluzione problemi
- `growth.svg` - Per progress e successi
- `nature.svg` - Per aspetti ecologici

### 2. Storyset by Freepik (Situazioni Complesse)
**Utilizzo**: Illustrazioni animate per spiegazioni complesse
**Fonte**: https://storyset.com/
**Licenza**: Freepik (attribuzione richiesta)
**Perché la includiamo**:
- ✅ Animazioni CSS/Lottie integrate
- ✅ Perfette per tutorial e guide
- ✅ Stile moderno e colorato
- ✅ Personalizzabili

### 3. Tabler Icons (Icone Tecniche)
**Utilizzo**: Icone per funzionalità avanzate e admin
**Installazione**: `npm install @tabler/icons-react`
**Perché la aggiungiamo**:
- ✅ Ampia libreria (4000+ icone)
- ✅ Perfette per dashboard admin
- ✅ Stile tecnico ma pulito
- ✅ Ottima copertura per funzionalità complesse

## Organizzazione e Struttura

### Gerarchia delle Icone

**Livello 1 - Navigazione Primaria**:
```tsx
// Uso Lucide React - 24px
<Home className="w-6 h-6 text-teal-600" />
<Users className="w-6 h-6 text-teal-600" />
<Search className="w-6 h-6 text-teal-600" />
```

**Livello 2 - Azioni Secondarie**:
```tsx
// Uso Lucide React - 20px
<Plus className="w-5 h-5 text-teal-500" />
<Settings className="w-5 h-5 text-gray-600" />
```

**Livello 3 - Stati e Feedback**:
```tsx
// Uso Heroicons - 16px
<SparklesIcon className="w-4 h-4 text-yellow-500" />
<ShieldCheckIcon className="w-4 h-4 text-green-500" />
```

### Sistema di Colori per Icone

**Seguendo la Palette WikiGaia**:
```css
/* Icone Primarie */
.icon-primary { color: #00B894; }      /* Verde WikiGaia */
.icon-secondary { color: #00695C; }    /* Verde Scuro */
.icon-nature { color: #26A69A; }       /* Verde Natura */
.icon-neutral { color: #757575; }      /* Grigio WikiGaia */

/* Stati */
.icon-success { color: #26A69A; }      /* Verde Natura */
.icon-warning { color: #FFB74D; }      /* Giallo Complementare */
.icon-error { color: #E57373; }        /* Rosso Soft */
.icon-disabled { color: #BDBDBD; }     /* Grigio Disabilitato */
```

## Implementazione Tecnica

### Componente Icona Unificato

```tsx
// components/ui/Icon.tsx
import { LucideIcon } from 'lucide-react';
import { ComponentType, SVGProps } from 'react';

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type IconColor = 'primary' | 'secondary' | 'nature' | 'neutral' | 'success' | 'warning' | 'error';

interface IconProps {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  size?: IconSize;
  color?: IconColor;
  className?: string;
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
  className = '' 
}) => {
  const sizeClass = iconSizes[size];
  const colorClass = iconColors[color];
  
  return (
    <IconComponent 
      className={`${sizeClass} ${colorClass} ${className}`}
    />
  );
};

// Utilizzo:
// <Icon icon={Heart} size="lg" color="primary" />
```

### Gestione delle Illustrazioni

```tsx
// components/ui/Illustration.tsx
interface IllustrationProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  primaryColor?: string; // Per personalizzazione colori
  className?: string;
}

export const Illustration: React.FC<IllustrationProps> = ({
  name,
  size = 'md',
  primaryColor = '#00B894', // Verde WikiGaia
  className = ''
}) => {
  const illustrationSizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48', 
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  return (
    <div className={`${illustrationSizes[size]} ${className}`}>
      <img 
        src={`/illustrations/${name}.svg`}
        alt={`Illustrazione ${name}`}
        style={{ '--primary-color': primaryColor } as any}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
```

## Linee Guida per l'Uso

### Icone nell'UI

**Do's ✅**:
- Usa icone riconoscibili e intuitive
- Mantieni coerenza di stile all'interno della stessa sezione
- Accompagna sempre con testo per accessibilità
- Usa la dimensione appropriata per il contesto
- Rispetta la gerarchia dei colori

**Don'ts ❌**:
- Non mescolare stili diversi nella stessa vista
- Non usare icone troppo decorative per azioni critiche
- Non fare affidamento solo sulle icone per comunicare
- Non usare colori che compromettono l'accessibilità

### Illustrazioni nel Contenuto

**Quando Usarle**:
- Stati vuoti ("Nessun problema ancora caricato")
- Onboarding e tutorial
- Errori 404 o problemi di connessione
- Sezioni hero di landing page
- Spiegazioni di concetti complessi

**Personalizzazione Colori**:
Tutte le illustrazioni devono essere personalizzate con la palette WikiGaia:
- Colore primario: #00B894
- Colore secondario: #00695C
- Accenti: #26A69A

## Implementazione nel Progetto

### Package.json Dependencies

```json
{
  "dependencies": {
    "lucide-react": "^0.294.0",
    "@heroicons/react": "^2.0.18",
    "phosphor-react": "^1.4.1",
    "@tabler/icons-react": "^2.44.0"
  }
}
```

### File di Configurazione Icone

```typescript
// lib/icons.ts
export { 
  Heart, Users, Lightbulb, Settings, Search, Plus, 
  MessageCircle, Leaf, Wrench, Home, User, BarChart3,
  CheckCircle, AlertCircle, Info, X
} from 'lucide-react';

export { 
  SparklesIcon, GlobeAltIcon, CogIcon, ShieldCheckIcon 
} from '@heroicons/react/24/outline';

export { 
  Plant, Recycle, HandHeart, TreeEvergreen, Hammer, Gears 
} from 'phosphor-react';

// Mappa icone per contesti
export const iconMap = {
  navigation: {
    home: Home,
    problems: Lightbulb,
    community: Users,
    tools: Wrench,
    profile: User
  },
  actions: {
    vote: Heart,
    add: Plus,
    search: Search,
    settings: Settings,
    edit: Settings
  },
  states: {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    close: X,
    celebration: SparklesIcon
  },
  ecology: {
    plant: Plant,
    recycle: Recycle,
    nature: TreeEvergreen,
    world: GlobeAltIcon
  }
};
```

## Accessibilità e Semantic

### Requisiti ARIA

```tsx
// Icone decorative
<Heart className="w-4 h-4" aria-hidden="true" />

// Icone informative
<Heart className="w-4 h-4" aria-label="Vota questo problema" />

// Icone con azione
<button aria-label="Aggiungi un nuovo problema">
  <Plus className="w-5 h-5" aria-hidden="true" />
</button>
```

### Test di Accessibilità

**Verifiche Obbligatorie**:
- [ ] Tutte le icone interattive hanno aria-label
- [ ] Icone decorative hanno aria-hidden="true"
- [ ] Contrasto colori rispetta WCAG AA (4.5:1)
- [ ] Icone riconoscibili anche in modalità high contrast
- [ ] Dimensioni minime rispettate (16px per mobile)

## Struttura File

```
/public/
  /illustrations/
    community.svg
    collaboration.svg
    problem-solving.svg
    growth.svg
    nature.svg
    empty-state.svg
    error-404.svg
    
/src/components/ui/
  Icon.tsx
  Illustration.tsx
  
/src/lib/
  icons.ts
  
/docs/ui/
  icons-and-graphics.md  (questo documento)
```

---

*Questa documentazione garantisce un uso coerente, accessibile e semanticamente corretto di tutte le risorse grafiche nel nostro Laboratorio Artigiano Digitale WikiGaia.*