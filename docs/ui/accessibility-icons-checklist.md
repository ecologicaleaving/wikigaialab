# Checklist Accessibilità Icone - WikiGaiaLab

## Stato Attuale delle Icone nel Progetto

### File Analizzati
- `components/landing/ArtisanalHeroSection.tsx`
- `components/problems/ArtisanalProblemsView.tsx` 
- `components/forms/ArtisanalStoryForm.tsx`
- `components/ui/vote-button.tsx`
- `components/layout/Header.tsx`

## Verifiche di Accessibilità

### ✅ Buone Pratiche Implementate

1. **Icone con Contesto**:
   ```tsx
   // ✅ Corretto - Icona con testo
   <Plus className="w-5 h-5 mr-2" />
   <span>Porta il Tuo Problema</span>
   ```

2. **Dimensioni Appropriate**:
   ```tsx
   // ✅ Corretto - Dimensioni accessibili (min 16px)
   <Heart className="w-4 h-4" />  // 16px
   <Search className="w-5 h-5" /> // 20px
   <Users className="w-6 h-6" />  // 24px
   ```

### ⚠️ Miglioramenti Necessari

1. **Aggiungere aria-label per icone standalone**:
   ```tsx
   // ❌ Attuale
   <Heart className="w-4 h-4 text-teal-600" />
   
   // ✅ Migliorato  
   <Heart className="w-4 h-4 text-teal-600" aria-label="Vota questo problema" />
   ```

2. **Icone decorative devono avere aria-hidden**:
   ```tsx
   // ❌ Attuale
   <div className="text-4xl mb-4">🛠️</div>
   
   // ✅ Migliorato
   <div className="text-4xl mb-4" aria-hidden="true">🛠️</div>
   ```

3. **Bottoni con solo icone necessitano aria-label**:
   ```tsx
   // ❌ Problematico
   <button>
     <X className="w-4 h-4" />
   </button>
   
   // ✅ Corretto
   <button aria-label="Chiudi modale">
     <X className="w-4 h-4" aria-hidden="true" />
   </button>
   ```

## Piano di Implementazione

### Fase 1: Audit Completo ⏳
- [ ] Catalogare tutte le icone utilizzate
- [ ] Verificare contesto d'uso (decorativa/informativa/interattiva)
- [ ] Identificare icone senza supporto accessibilità

### Fase 2: Correzioni Immediate 🔴
**Priorità Alta - Da sistemare subito:**

1. **Vote Button Component**:
   ```tsx
   // In vote-button.tsx - Aggiungere:
   <Heart 
     className={heartClasses} 
     aria-label={hasVoted ? "Hai già votato" : "Vota questo problema"}
   />
   ```

2. **Navigation Icons**:
   ```tsx
   // In Header.tsx - Per icone di navigazione:
   <Search 
     className="w-5 h-5" 
     aria-label="Cerca problemi"
   />
   ```

3. **Form Icons**:
   ```tsx
   // In ArtisanalStoryForm.tsx - Stati di validazione:
   <CheckCircle 
     className="w-4 h-4" 
     aria-label="Campo compilato correttamente"
   />
   <AlertCircle 
     className="w-4 h-4" 
     aria-label="Errore nel campo"
   />
   ```

### Fase 3: Standardizzazione 🟡
**Priorità Media - Implementare componente unificato:**

```tsx
// components/ui/AccessibleIcon.tsx
interface AccessibleIconProps {
  icon: LucideIcon;
  label?: string;           // Per icone informative
  decorative?: boolean;     // Per icone decorative
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon: IconComponent,
  label,
  decorative = false,
  size = 'md',
  color = 'text-gray-600',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const props = decorative 
    ? { 'aria-hidden': true }
    : { 'aria-label': label };

  return (
    <IconComponent
      className={`${sizeClasses[size]} ${color} ${className}`}
      {...props}
    />
  );
};

// Utilizzo:
// <AccessibleIcon icon={Heart} label="Vota problema" size="md" />
// <AccessibleIcon icon={Sparkles} decorative={true} />
```

### Fase 4: Testing e Validazione 🟢
**Priorità Bassa - Test automatizzati:**

```typescript
// tests/accessibility/icons.test.tsx
describe('Icon Accessibility', () => {
  test('tutte le icone interattive hanno aria-label', () => {
    // Test automatico per verificare accessibilità
  });
  
  test('icone decorative hanno aria-hidden', () => {
    // Test per icone puramente decorative
  });
  
  test('contrasto colori rispetta WCAG AA', () => {
    // Test contrasto per tutti i colori icone
  });
});
```

## Linee Guida per Sviluppatori

### When to Use aria-label ✅
- Icone standalone senza testo di accompagnamento
- Bottoni che contengono solo icone
- Icone che comunicano stato o informazione importante

### When to Use aria-hidden ✅  
- Icone puramente decorative
- Icone accompagnate da testo descrittivo
- Icone in badges o elementi già ben descritti

### When to Use Both ❌
Mai usare insieme `aria-label` e `aria-hidden="true"`

## Checklist Pre-Deploy

Prima di ogni rilascio, verificare:

- [ ] Tutte le icone interattive hanno `aria-label` appropriato
- [ ] Icone decorative hanno `aria-hidden="true"`
- [ ] Nessuna icona essenziale è solo visiva (sempre testo alternativo)
- [ ] Contrasto colori testato (min 3:1 per icone, 4.5:1 per testo)
- [ ] Test con screen reader effettuato
- [ ] Test con high contrast mode
- [ ] Dimensioni minime rispettate (16px min per touch)

## Risorse per Test

### Tools Raccomandati
- **axe DevTools**: Browser extension per audit automatici
- **WAVE**: Web accessibility evaluation tool  
- **Colour Contrast Analyser**: Per test contrasto
- **NVDA/JAWS**: Screen reader per test reali

### Test Manuali
1. Navigazione solo da tastiera
2. Test con screen reader attivo
3. Modalità high contrast del OS
4. Zoom browser al 200%
5. Touch test su dispositivo mobile

---

*Questa checklist garantisce che tutte le icone nel nostro Laboratorio Artigiano Digitale siano accessibili a tutti gli utenti, indipendentemente dalle loro capacità.*