# WikiGaia Logo - Linee Guida per l'Integrazione

## Il Logo WikiGaia nel Laboratorio Artigiano Digitale

Il logo WikiGaia è il cuore visivo del nostro laboratorio. La sua palette verde/teal naturale e il simbolo del mondo con la foglia rappresentano perfettamente i nostri valori di sostenibilità, crescita e partecipazione ecologica.

## Anatomia del Logo

### Elementi Principali
- **Simbolo Circolare**: Mondo stilizzato con continenti in verde scuro (#00695C)
- **Foglia Superiore**: Elemento naturale in verde vibrante (#00B894) 
- **Wordmark "wikigaia"**: Testo in grigio elegante (#757575)
- **Payoff "ecologia partecipata"**: Sottotitolo in teal (#26A69A)

### Palette Colori Estratta
- **Verde Primario**: #00B894 (elemento principale)
- **Verde Scuro**: #00695C (contrasti forti)
- **Verde Natura**: #26A69A (accenti ecologici)
- **Grigio Testo**: #757575 (leggibilità)

## Posizionamento e Dimensioni

### Header del Sito (Implementazione Attuale)
```tsx
// components/layout/Header.tsx
<div className="flex items-center gap-3">
  <Image 
    src="/images/wikigaialab-logo.svg" 
    alt="WikiGaiaLab - Laboratorio Artigiano Digitale"
    width={48} 
    height={48} 
    className="rounded-lg"
  />
  <div>
    <h1 className="text-xl font-bold text-gray-900">WikiGaiaLab</h1>
    <p className="text-sm text-gray-600">Laboratorio Artigiano Digitale</p>
  </div>
</div>
```

### Landing Page Hero
- **Dimensione Consigliata**: 240px larghezza massima
- **Posizione**: Centro della sezione hero
- **Contesto**: Con headline "Laboratorio Artigiano Digitale"

### Footer
- **Dimensione**: 120px larghezza
- **Posizione**: Sezione "Chi Siamo" 
- **Link**: Collegamento al sito WikiGaia principale

### Favicon e Meta
- **Favicon**: Solo simbolo circolare 32x32px
- **App Icon**: Simbolo circolare 512x512px
- **Social Media**: Logo completo 1200x630px

## Spazio di Rispetto

### Regola Generale
Il logo deve avere sempre uno spazio minimo libero intorno, calcolato come l'altezza della "i" minuscola del wordmark.

- **Spazio Minimo**: 24px su tutti i lati
- **Sfondo**: Sempre neutro (bianco, grigio chiarissimo #F8F9FA, o verde ghiaccio #B2DFDB)
- **Contrasto**: Garantire sempre leggibilità del grigio #757575

## Adattamenti per Tema Scuro

### Versione Invertita
Per sfondi scuri, utilizzare:
- **Simbolo**: Mantenere verde originale #00B894
- **Wordmark**: Cambiare in bianco #FFFFFF
- **Payoff**: Mantenere teal #26A69A

### Implementazione CSS
```css
.logo-dark-theme .wordmark {
  fill: #FFFFFF;
}
.logo-dark-theme .payoff {
  fill: #26A69A;
}
```

## Integrazioni Specifiche

### Componenti UI
Tutti i componenti devono utilizzare la palette estratta dal logo:

```css
:root {
  --wikigaia-primary: #00B894;
  --wikigaia-dark: #00695C;
  --wikigaia-nature: #26A69A;
  --wikigaia-light: #80CBC4;
  --wikigaia-ice: #B2DFDB;
  --wikigaia-text: #757575;
}
```

### Bottoni Primari
- **Background**: var(--wikigaia-primary) #00B894
- **Hover**: var(--wikigaia-dark) #00695C
- **Text**: Bianco #FFFFFF

### Accenti Ecologici
- **Successi**: var(--wikigaia-nature) #26A69A
- **Highlights**: var(--wikigaia-light) #80CBC4
- **Backgrounds**: var(--wikigaia-ice) #B2DFDB

## Utilizzi da Evitare

### ❌ Non Fare Mai
- Non modificare i colori originali del logo
- Non stirare o distorcere le proporzioni
- Non usare su sfondi che compromettono la leggibilità
- Non separare elementi senza necessità
- Non aggiungere effetti (ombra, gradiente, etc.)
- Non utilizzare versioni pixelate o di bassa qualità

### ⚠️ Attenzioni Speciali
- Su foto o sfondi complessi, sempre aggiungere un sottofondo bianco/grigio chiaro
- Verificare il contrasto prima di pubblicare
- Test su dispositivi mobili per leggibilità

## File e Risorse

### Formati Disponibili
- **SVG**: `/public/images/wikigaialab-logo.svg` (preferito per web)
- **PNG**: Alta risoluzione per stampa e social media
- **Favicon**: `/public/favicon.ico`

### Download
Il logo originale WikiGaia è disponibile all'indirizzo del progetto madre. Per utilizzi speciali, richiedere sempre l'autorizzazione e utilizzare i file originali.

## Checklist di Verifica

Prima di pubblicare qualsiasi design:

- [ ] Logo posizionato correttamente
- [ ] Spazio di rispetto rispettato (min 24px)
- [ ] Colori originali mantenuti
- [ ] Contrasto verificato (min 4.5:1 per il testo)
- [ ] Test su mobile completato
- [ ] Versione dark theme implementata se necessario
- [ ] Link a WikiGaia funzionante
- [ ] Alt text descrittivo presente

---

*Questo documento garantisce che l'identità visiva WikiGaia sia rispettata e valorizzata in ogni aspetto del nostro Laboratorio Artigiano Digitale, mantenendo coerenza e professionalità.*