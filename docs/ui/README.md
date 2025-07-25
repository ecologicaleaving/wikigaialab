# Documentazione UI/UX - WikiGaiaLab Laboratorio Artigiano Digitale

## Indice della Documentazione

Questa cartella contiene tutta la documentazione per il design e l'esperienza utente del nostro Laboratorio Artigiano Digitale WikiGaia.

### 📚 Documenti Principali

#### 🎨 **Design System e Brand Identity**
- **[`identity.md`](./identity.md)** - Brand identity, microcopy e voice & tone
- **[`front_end_spec.md`](./front_end_spec.md)** - Specifica completa del front-end e design system
- **[`logo-guidelines.md`](./logo-guidelines.md)** - Linee guida per l'uso del logo WikiGaia

#### 🎯 **Interazioni e Comportamenti**
- **[`interactivity.md`](./interactivity.md)** - Specifica delle interazioni e animazioni
- **[`navigation-menus.md`](./navigation-menus.md)** - Sistema di navigazione e menu

#### 🎛️ **Risorse e Componenti**
- **[`icons-and-graphics.md`](./icons-and-graphics.md)** - Librerie di icone e grafiche
- **[`accessibility-icons-checklist.md`](./accessibility-icons-checklist.md)** - Checklist accessibilità icone

#### 📋 **Template di Riferimento**
- **[`identity_template.md`](./identity_template.md)** - Template per brand identity
- **[`interactivity_template.md`](./interactivity_template.md)** - Template per interazioni

---

## 🎯 Quick Reference

### Brand Identity WikiGaia
- **Colore Primario**: #00B894 (Verde WikiGaia)
- **Colore Secondario**: #00695C (Verde Scuro)
- **Accento**: #26A69A (Verde Natura)
- **Tone**: Caloroso + Ecologico-Artigianale
- **Voice**: Compagno di Laboratorio

### Navigazione Principale
- **Laboratorio** → Home page
- **Il Mio Banco** → Dashboard personale
- **Problemi del Quartiere** → Lista problemi
- **Porta Problema** → Crea nuovo problema
- **Attrezzi** → Applicazioni create

### Librerie Tecniche
- **Icone**: Lucide React (primaria), Heroicons (secondaria), Phosphor (natura)
- **Illustrazioni**: Undraw (personalizzabili), Storyset (animate)
- **Typography**: Inter (primaria), Roboto (fallback)
- **Framework**: Tailwind CSS con palette WikiGaia

### Accessibilità
- **Standard**: WCAG AA (4.5:1 contrast ratio)
- **Keyboard**: Navigazione completa da tastiera
- **Screen Reader**: ARIA labels completi
- **Touch**: Target min 44px su mobile

---

## 📖 Come Usare Questa Documentazione

### Per Designer
1. Inizia con [`identity.md`](./identity.md) per capire voice & tone
2. Consulta [`front_end_spec.md`](./front_end_spec.md) per il design system
3. Usa [`logo-guidelines.md`](./logo-guidelines.md) per implementazioni logo

### Per Sviluppatori
1. Leggi [`navigation-menus.md`](./navigation-menus.md) per implementare menu
2. Consulta [`icons-and-graphics.md`](./icons-and-graphics.md) per librerie
3. Usa [`accessibility-icons-checklist.md`](./accessibility-icons-checklist.md) per verifiche

### Per Product Manager
1. Leggi [`identity.md`](./identity.md) per messaging e tono
2. Consulta [`interactivity.md`](./interactivity.md) per UX patterns
3. Usa [`front_end_spec.md`](./front_end_spec.md) per specifiche complete

---

## 🔄 Workflow di Aggiornamento

### Quando Aggiornare
- ✅ Nuove funzionalità UI
- ✅ Cambi di brand identity
- ✅ Aggiornamenti accessibilità
- ✅ Nuove librerie o componenti
- ✅ Feedback utenti significativi

### Come Aggiornare
1. **Modifica il documento rilevante**
2. **Aggiorna la data di modifica**
3. **Testa l'implementazione**
4. **Aggiorna questo README se necessario**
5. **Comunica i cambi al team**

### Versioning
Ogni documento ha un proprio changelog interno. Per cambi major, aggiorna la versione nel frontmatter.

---

## 🎨 Design Tokens (Quick Ref)

```css
:root {
  /* WikiGaia Colors */
  --wikigaia-primary: #00B894;
  --wikigaia-dark: #00695C;
  --wikigaia-nature: #26A69A;
  --wikigaia-light: #80CBC4;
  --wikigaia-ice: #B2DFDB;
  --wikigaia-text: #757575;
  
  /* Spacing */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  
  /* Typography */
  --font-primary: 'Inter', system-ui, sans-serif;
  --font-fallback: 'Roboto', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 📞 Support e Feedback

Per domande sulla documentazione UI/UX:
1. Controlla se la risposta è già nei documenti linkati
2. Cerca nei template di riferimento
3. Crea un issue specificando quale documento e sezione

---

*Questa documentazione serve il nostro Laboratorio Artigiano Digitale WikiGaia - dove la tecnologia ha l'anima del quartiere italiano e i valori dell'ecologia partecipata.*

**Ultima modifica**: 25 Luglio 2025  
**Versione**: 2.0 (Post integrazione WikiGaia)