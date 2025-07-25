# WikiGaiaLab - Specifica del Laboratorio Digitale
*L'officina di quartiere dove l'AI aiuta la comunità*

## Benvenuti nel Nostro Laboratorio

Questo documento descrive come trasformare WikiGaiaLab in un laboratorio digitale accogliente dove ogni vicino di casa può portare i propri problemi quotidiani e trovare aiuto dalla comunità. Come in un vero laboratorio artigiano, qui il maestro (l'AI) mette i suoi strumenti al servizio delle persone semplici, creando un ambiente dove tutti si sentono a casa.

### La Filosofia del Nostro Laboratorio

#### Chi Frequenta il Nostro Laboratorio

**La Mamma del Quartiere (Maria, 42 anni):** Organizza eventi per la scuola, coordina i gruppi WhatsApp del condominio, ha sempre mille cose da fare ma poca confidenza con la tecnologia. Viene nel laboratorio quando ha bisogno di aiuto per organizzare la festa di compleanno di suo figlio o creare un volantino per il mercatino.

**Il Pensionato Curioso (Giuseppe, 67 anni):** Ex operaio, ora dedica tempo al volontariato e ai suoi hobby. Sa usare il telefono ma non si fida dei "computer complicati". Nel laboratorio trova un ambiente familiare dove può chiedere aiuto per digitalizzare le foto del circolo o organizzare le attività dell'orto condiviso.

**La Studentessa Impegnata (Sofia, 23 anni):** Studia e lavora part-time, organizza eventi per l'associazione studentesca. È tecnologica ma non ha tempo per imparare strumenti complessi. Viene nel laboratorio per soluzioni rapide: creare sondaggi, gestire liste partecipanti, automatizzare cose noiose.

**Il Vicino di Casa Generoso (Marco, 35 anni):** Papà che lavora da casa, sempre disponibile ad aiutare i vicini. Non è un tecnico ma sa arrangiarsi. Nel laboratorio condivide i suoi piccoli problemi risolti e aiuta altri genitori con questioni simili.

**Il Maestro Artigiano (Sistema AI):** L'intelligenza artificiale del laboratorio, presentata come un vecchio artigiano saggio che conosce tutti i trucchi del mestiere. Non è un robot freddo, ma un mentore paziente che guida ogni persona verso la soluzione giusta per lei.

#### Come Vogliamo che si Sentano i Nostri Ospiti

- **"Mi sento a casa":** Chi entra per la prima volta capisce subito che questo è un posto sicuro dove può chiedere aiuto senza giudizi
- **"Posso farcela anch'io":** Anche chi non è pratico di tecnologia riesce a esprimere il suo sostegno con un semplice gesto
- **"Finalmente qualcuno mi capisce":** Raccontare il proprio problema quotidiano è semplice come parlare con un vicino di casa
- **"Ecco cosa ci guadagno":** È chiaro che aiutando gli altri, ricevo aiuto anch'io - come in una vera comunità di quartiere
- **"Tutti sono benvenuti":** L'ambiente è inclusivo e parla la lingua del cuore, accessibile a ogni tipo di persona

#### I Principi del Nostro Laboratorio

1. **Calore Artigianale** - Ogni schermata accoglie come l'ingresso di un laboratorio familiare, dove ogni dettaglio è pensato per far sentire a proprio agio
2. **Gesti che Parlano** - Ogni click, ogni tocco risponde immediatamente come quando il maestro artigiano annuisce alle tue parole
3. **Cuore di Quartiere** - I problemi quotidiani delle persone diventano il centro dell'esperienza, come le chiacchiere al banco del laboratorio
4. **Porte Sempre Aperte** - Nonna, studente, mamma, pensionato: tutti trovano il loro posto e il loro modo di partecipare
5. **Maestria Paziente** - Come un vero artigiano insegna gradualmente, così l'interfaccia svela le sue possibilità passo dopo passo

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 17/07/2025 | 1.0 | Initial UI/UX specification | Sally (UX Expert) |

## La Mappa del Nostro Laboratorio
*Come è organizzato il nostro spazio di lavoro comunitario*

### Gli Spazi del Laboratorio

```mermaid
graph TD
    A["🏠 L'Ingresso<br/>(Homepage)"] --> B["👤 Il Mio Angolo<br/>(Dashboard Personale)"]
    A --> C["💬 La Bacheca dei Problemi<br/>(Stanza delle Richieste)"]
    A --> D["🔧 Gli Strumenti del Maestro<br/>(Catalogo Soluzioni)"]
    A --> E["📋 Il Mio Quaderno<br/>(Profilo Personale)"]
    A --> F["🚪 Porta d'Ingresso<br/>(Registrazione)"]
    
    B --> B1["📊 I Miei Contributi"]
    B --> B2["📰 Ultime Novità"]
    B --> B3["⚡ Aiuto Veloce"]
    
    C --> C1["✍️ Racconta il Tuo Problema"]
    C --> C2["📖 Storia Completa"]
    C --> C3["🔍 Trova quello che Cerchi"]
    
    D --> D1["🛠️ Strumento Specifico"]
    D --> D2["⭐ Accesso Speciale"]
    D --> D3["📄 Crea Volantini"]
    
    E --> E1["❓ I Miei Problemi"]
    E --> E2["❤️ I Miei Sostegni"]
    E --> E3["🔧 I Miei Strumenti"]
    E --> E4["⚙️ Preferenze"]
    
    G["👨‍🔧 Banco del Maestro<br/>(Area Amministrativa)"] --> G1["📝 Cura dei Problemi"]
    G["👨‍🔧 Banco del Maestro<br/>(Area Amministrativa)"] --> G2["👥 Cura della Comunità"]
    G["👨‍🔧 Banco del Maestro<br/>(Area Amministrativa)"] --> G3["📈 Salute del Laboratorio"]
    G["👨‍🔧 Banco del Maestro<br/>(Area Amministrativa)"] --> G4["🔧 Strumenti del Mestiere"]
```

### Come ci si Muove nel Laboratorio

**Vedi documentazione completa**: [`docs/ui/navigation-menus.md`](./navigation-menus.md)

**Il Banco Principale (Header Navigation):**
- Navigazione primaria: "Il Mio Banco", "Problemi del Quartiere", "Porta Problema", "Attrezzi"
- Linguaggio del laboratorio: terminologia calda e accogliente
- Stati interattivi: hover con sfondo teal, active con bordo verde WikiGaia
- Responsive: menu orizzontale desktop, hamburger mobile

**Le Indicazioni del Maestro (Contextual Navigation):**
- Breadcrumb con linguaggio naturale: "Home > Problemi del Quartiere > Porta Problema"
- Tooltip descrittivi per ogni azione
- Badge informativi per novità e contatori

**Menu Utente e Azioni Secondarie:**
- Dropdown con "Il Mio Profilo", "Impostazioni", "Logout"
- Notifiche con indicatori visivi
- Accessibilità completa (ARIA, keyboard navigation)

## I Percorsi nel Laboratorio
*Come accompagniamo ogni persona nel suo viaggio*

### Percorso 1: Il Primo Giorno di Laboratorio

**Il Desiderio:** Capire se questo posto può davvero aiutarmi con i miei problemi quotidiani

**Come Arrivano:** Un vicino ne ha parlato, hanno visto un post sui social, o hanno sentito parlare al bar del quartiere

**Il Successo:** La persona si sente accolta, capisce come funziona e dà il suo primo sostegno a un problema che le sta a cuore

#### Il Viaggio Passo per Passo

```mermaid
graph TD
    A["🏠 Busso alla Porta<br/>(Arrivo sulla Homepage)"] --> B["🙋 'Ciao, posso entrare?'<br/>(Click Entra)"]
    B --> C["🔑 Mi Presento<br/>(Login con Google)"]
    C --> D["👀 Guardo in Giro<br/>(Vedo la Bacheca)"]
    D --> E["📚 Leggo le Storie<br/>(Scopro i Problemi)"]
    E --> F["❤️ 'Anch'io la penso così!'<br/>(Do il Mio Cuore)"]
    F --> G["✨ Il Maestro Sorride<br/>(Animazione di Ringraziamento)"]
    G --> H["📊 Vedo Crescere l'Interesse<br/>(Contatore che Sale)"]
    H --> I["🔍 'Cosa altro posso aiutare?'<br/>(Scopro Altri Problemi)"]
```

#### Quando le Cose Non Vanno Come Previsto:
- **Il Maestro non mi riconosce** (Login fallito) – "Ops, proviamo di nuovo insieme. Magari è solo la connessione che fa i capricci."
- **La bacheca è vuota** – "Benvenuto! Sei tra i primi ad arrivare. Che bello avere pionieri come te!"
- **Clicco due volte per l'emozione** – Il sistema capisce e non conta doppio: "Ho già sentito il tuo cuore!"
- **Internet va e viene** – "Sembra che ci siano problemi di connessione. Il maestro aspetta pazientemente."

**L'Anima del Momento:** Il primo sostegno deve essere magico, come quando da bambini ricevevi il primo "bravo" dal nonno

### Percorso 2: Racconto il Mio Problema

**Il Desiderio:** Ho un problema quotidiano e voglio vedere se anche altri lo sentono come me

**Come Inizia:** Vedo il pulsante "Racconta", dalla mia pagina personale, o perché un amico mi ha detto "dovresti proprio proporlo lì"

**Il Successo:** Il mio problema è pubblicato, altri possono vederlo, e io posso seguire chi lo sostiene

#### Il Mio Viaggio per Raccontare

```mermaid
graph TD
    A["💬 'Ho un problema!'<br/>(Click Racconta)"] --> B["📋 Il Quaderno del Maestro<br/>(Pagina del Racconto)"]
    B --> C["✍️ Scrivo la Mia Storia<br/>(Compilo i Campi)"]
    C --> D["🟷️ 'Di che tipo è?'<br/>(Scelgo la Categoria)"]
    D --> E["👀 'Ecco come si vedrà'<br/>(Anteprima)"]
    E --> F["🚀 'Condividi con Tutti!'<br/>(Invio)"]
    F --> G["🔍 Il Maestro Controlla<br/>(Validazione)"]
    G --> H["🎉 'Benvenuto nella Bacheca!'<br/>(Pagina di Successo)"]
    H --> I["❤️ Il Primo Cuore<br/>(Voto Automatico)"]
    I --> J["📢 'Dillo agli Amici!'<br/>(Opzioni Condivisione)"]
```

#### Edge Cases & Error Handling:
- Validation errors � Inline messages with clear guidance
- Duplicate detection � Suggest similar problems
- Save draft � Auto-save with recovery option
- Category unclear � Help text with examples

**Notes:** Form should feel conversational, not bureaucratic

### Percorso 3: Uso gli Strumenti del Maestro

**Il Desiderio:** Voglio usare gli strumenti che il laboratorio ha creato per risolvere i problemi come il mio

**Come Inizia:** Vedo gli strumenti disponibili, ricevo una notifica che qualcosa è pronto, o li scopro nella mia pagina personale

**Il Successo:** Riesco ad usare lo strumento che mi serve, oppure capisco cosa devo fare per ottenerlo

#### Il Percorso verso gli Strumenti

```mermaid
graph TD
    A["🔧 'Questo mi serve!'<br/>(Click sullo Strumento)"] --> B["📋 Il Maestro Controlla<br/>(Verifica Partecipazione)"]
    B --> C{"❤️ Hai Sostenuto<br/>questo Problema?"}
    C -->|"Sì!"| D["🎉 Strumento Completo<br/>(Accesso Pieno)"]
    C -->|"Non Ancora"| E["👀 Assaggio Gratuito<br/>(Anteprima)"]
    E --> F["🌫️ Velo Misterioso<br/>(Funzioni Nascoste)"]
    F --> G["💫 'Vuoi Tutto?'<br/>(Proposta di Accesso)"]
    G --> H["💳 'Come Preferisci Pagare?'<br/>(Opzioni di Pagamento)"]
    H --> I["🛍️ Cassa Sicura<br/>(Pagamento Stripe)"]
    I --> J["🗝 Strumento Sbloccato<br/>(Accesso Garantito)"]
```

#### Edge Cases & Error Handling:
- Payment failure � Clear error with retry options
- Voting history unclear � Detailed explanation
- Premium preview � Engaging teasers without frustration
- Subscription management � Clear control panel

**Notes:** Premium gates should motivate, not frustrate

## Gli Schizzi del Laboratorio
*Come immaginamo ogni angolo del nostro spazio*

**I Disegni del Progetto:** Saranno creati con amore in Figma dopo che avremo tutti approvato questa visione

### Gli Spazi Principali del Laboratorio

#### 🏠 L'Ingresso del Laboratorio
**Cosa Vogliamo:** Che chi entra si senta subito a casa e capisca che qui può essere aiutato

**Gli Elementi del Benvenuto:**
- Un caloroso "Benvenuto nel laboratorio del quartiere" che spiega subito chi siamo
- Esempi di problemi reali con i cuoricini che si muovono, per mostrare la vita della comunità
- "Siamo già in 1.247 vicini che si aiutano" - numeri che danno fiducia
- Un invito chiaro: "Entra anche tu nella nostra famiglia"

**La Magia dell'Accoglienza:** I contatori dei sostegni si muovono dolcemente, come il respiro della comunità viva

#### 💬 La Bacheca dei Problemi
**Cosa Vogliamo:** Che tutti si sentano come quando guardano la bacheca del circolo o del condominio

**Gli Elementi della Condivisione:**
- Una barra di ricerca amichevole: "Cosa stai cercando?" con suggerimenti dolci
- Cartoncini dei problemi che sembrano post-it colorati, ognuno con il suo cuoricino
- Modi per ordinare: "I più sentiti", "Gli ultimi arrivati", "Per tipo di problema"
- Un bel pulsante rotondo che fluttua: "Racconta il tuo problema" 

**La Vita della Bacheca:** Le carte si muovono come foglie al vento, i cuori battono quando li tocchi, la lista cresce dolcemente mentre scorri

#### 📖 La Storia Completa del Problema
**Cosa Vogliamo:** Che leggere un problema sia come ascoltare un vicino che ti racconta le sue difficoltà

**Gli Elementi del Racconto:**
- La storia completa scritta come una lettera sincera, con spazi per respirare
- Un grosso cuore con "Anch'io la penso così" e quanti altri l'hanno già detto
- Bottoni per condividere: "Dillo agli amici", "Metti sul gruppo WhatsApp"
- "Altri problemi che potrebbero interessarti" come suggerimenti di un amico

**I Piccoli Gesti:** Quando condividi, appare un messaggio carino, il cuore si illumina con dolcezza, tutto si adatta al tuo telefono o computer

## Gli Strumenti del Laboratorio
*I piccoli oggetti che rendono magica ogni interazione*

**La Nostra Filosofia:** Ogni bottone, ogni carta, ogni elemento ha l'anima calda dell'artigianato italiano, costruiti con Tailwind CSS ma con il cuore del quartiere

### Gli Strumenti Fondamentali

#### ❤️ Il Cuore del Sostegno
**L'Anima:** Il gesto più importante del laboratorio - dire "anch'io la penso così" a un vicino

**Le Sue Forme:** Neutro (pronto ad amare), Pieno ("già dato!"), Riposante (non disponibile), Pensieroso (sta elaborando)

**I Suoi Momenti:** Tranquillo, Curioso (quando ci passi sopra), Attivo (quando lo tocchi), Stanco (quando non può rispondere)

**Come Usarlo:** Sempre dove lo cerchi, sempre nello stesso posto, sempre pronto a rispondere con un sorriso

#### 📜 La Cartolina del Problema
**L'Anima:** Come i bigliettini che si lasciano in bacheca, ognuno racconta una piccola storia

**Le Sue Forme:** Compatta (riassunto veloce), Espansa (storia completa), In Evidenza (problema del momento)

**I Suoi Momenti:** Normale (tranquilla), Curiosa (quando ci passi sopra), Che Pensa (sta caricando), Confusa (qualcosa non va)

**Come Usarla:** Spazi regolari come le righe del quaderno, gerarchia chiara come una lettera ben scritta, si adatta al tuo schermo come un abito su misura

#### 🚪 Il Cancelletto del Maestro
**L'Anima:** Come quando il maestro ti dice "questo strumento è per chi ha già imparato le basi" - con gentilezza, mai con cattiveria

**Le Sue Forme:** Dolce ("guarda cosa puoi fare"), Fermo ("prima impara questo"), Incoraggiante ("sei quasi pronto!")

**I Suoi Momenti:** Chiuso (ma con amore), Aperto (benvenuto!), Che pensa (sta controllando), Confuso (problema tecnico)

**Come Usarlo:** Spiega sempre il perchè, mai frustrante come un cartello "vietato", sempre con la promessa di un futuro insieme

## L'Identità del Nostro Laboratorio
*I colori, le forme e lo spirito del nostro angolo di quartiere*

### Chi Siamo Visivamente
**La Nostra Anima:** Il nostro design si ispira direttamente al logo WikiGaia, unendo la saggezza ecologica con l'innovazione digitale. I verdi del logo guidano tutta la nostra palette visiva, creando un'identità coesa e naturale.

### I Colori WikiGaia del Laboratorio

*Palette ispirata direttamente al logo WikiGaia per una perfetta integrazione visiva*

| Il Colore del Cuore | Codice | Ispirazione Logo | Quando lo Usiamo |
|---------------------|--------|------------------|------------------|
| **Verde WikiGaia Primario** | #00B894 | Colore principale del logo | Bottoni primari, cuori pieni, azioni principali |
| **Verde WikiGaia Scuro** | #00695C | Tono scuro del logo | Intestazioni, testi importanti, stati attivi |
| **Verde Natura** | #26A69A | Ispirato alle foglie del logo | Successi, crescita, feedback positivi |
| **Teal Collaborativo** | #4DB6AC | Variante media dell'ecosistema | Azioni secondarie, stati hover, elementi interattivi |
| **Verde Chiaro** | #80CBC4 | Tinta delicata | Sfondi sottili, stati disabilitati, elementi secondari |
| **Verde Ghiaccio** | #B2DFDB | Tono pastello | Sfondi di sezioni, aree di contenuto delicate |
| **Giallo Ecologico** | #FFB74D | Complementare naturale | Notifiche importanti, call-to-action secondarie |
| **Grigio WikiGaia** | #757575 | Dal testo del logo | Testi principali, elementi neutri |
| **Grigio Supporto** | #BDBDBD, #F8F9FA | Palette di supporto | Testi secondari, bordi, sfondi familiari |

### Le Scritture del Laboratorio

#### Le Nostre Calligrafie
- **Per Tutti i Giorni:** Inter (pulita, moderna, ama le lettere italiane con gli accenti)
- **Di Riserva:** Roboto (affidabile, sempre disponibile su Google)
- **Per i Codici:** JetBrains Mono (quando dobbiamo scrivere cose tecniche, ma con stile)

#### Le Grandezze delle Parole

| Tipo di Scrittura | Grandezza | Forza | Respiro tra le Righe |
|-------------------|-----------|-------|----------------------|
| Titolone | 2.5rem | 700 (molto forte) | 1.2 (compatto) |
| Sottotitolo | 2rem | 600 (forte) | 1.3 (respirato) |
| Titoletto | 1.5rem | 600 (forte) | 1.4 (comodo) |
| Testo Normale | 1rem | 400 (normale) | 1.6 (arioso) |
| Piccolo | 0.875rem | 400 (normale) | 1.5 (leggibile) |

### Logo WikiGaia - Linee Guida di Utilizzo

**Posizionamento Principale:**
- **Header:** Logo completo in alto a sinistra (dimensione: 180px larghezza max)
- **Footer:** Versione compatta con link al sito WikiGaia
- **Landing Page:** Logo hero nella sezione principale (dimensione: 240px larghezza max)
- **Documenti:** Versione piccola negli header dei documenti (120px larghezza max)

**Spazio di Rispetto:**
- Minimo 24px di margine intorno al logo su tutti i lati
- Non sovrapporre mai testo o elementi grafici
- Mantenere sempre lo sfondo neutro (bianco, grigio chiaro, verde ghiaccio)

**Utilizzi Corretti:**
- Logo completo per identificazione principale del brand
- Solo simbolo circolare per icone di app, favicon, avatar
- Versione monocromatica su sfondi scuri (bianco o verde chiaro)

**Utilizzi da Evitare:**
- Non modificare i colori originali
- Non ridimensionare sproporzionatamente
- Non utilizzare su sfondi che compromettono la leggibilità
- Non separare il simbolo dal wordmark senza motivo

### Sistema di Icone e Grafiche

**Vedi documentazione completa**: [`docs/ui/icons-and-graphics.md`](./icons-and-graphics.md)

**Librerie Principali:**
- **Lucide React** (primaria): Interfaccia e navigazione
- **Heroicons** (secondaria): Stati e notifiche
- **Phosphor Icons** (tematica): Ecologia e artigianato
- **Undraw** (illustrazioni): Hero sections e stati vuoti

**Dimensioni Standard:**
- Navigazione primaria: 24px (w-6 h-6)
- Azioni secondarie: 20px (w-5 h-5) 
- Stati e feedback: 16px (w-4 h-4)
- Decorative: 12px (w-3 h-3)

**Colori Icone (Palette WikiGaia):**
- Primarie: `text-teal-600` (#00B894)
- Secondarie: `text-teal-700` (#00695C)
- Natura: `text-emerald-600` (#26A69A)
- Neutrali: `text-gray-600` (#757575)

### Gli Spazi e l'Ordine
**Come Organizziamo:** 12 colonne come le case di una strada, con 24px di spazio tra una e l'altra

**Le Distanze:** Tutto è multiplo di 4px (4, 8, 12, 16, 24, 32, 48, 64, 96px) - come i mattoni di una casa ben costruita

## Un Laboratorio per Tutti
*Perché ogni persona deve sentirsi benvenuta*

### Il Nostro Impegno
**Lo Standard che Seguiamo:** WCAG AA - le linee guida internazionali per rendere il web accessibile a tutti

### Come Rendiamo il Laboratorio Accogliente per Tutti

**Per Chi Ha Difficoltà a Vedere:**
- I colori hanno sempre abbastanza contrasto per essere letti bene
- Quando focalizzi qualcosa, si vede chiaramente un bordo di 2px
- Il testo è sempre almeno di 16px e si può ingrandire fino al doppio

**Per Chi Usa la Tastiera o Assistenti Vocali:**
- Tutto si può raggiungere con la sola tastiera, come navigare con il telecomando
- Gli assistenti vocali capiscono tutto grazie alle etichette giuste
- I bottoni sul telefono sono sempre abbastanza grandi per un dito (44px)

**Per Chi Ha Bisogno di Chiarezza:**
- Ogni immagine ha una descrizione per chi non la può vedere
- I titoli sono ordinati logicamente, come i capitoli di un libro
- Ogni campo da compilare ha istruzioni chiare e messaggi di aiuto comprensibili

### Come Controlliamo che Funzioni Davvero
Proviamo tutto con la tastiera, ascoltiamo come suona con gli assistenti vocali, verifichiamo che i colori si leggano bene, testiamo sui telefoni - perché un laboratorio accogliente deve funzionare per tutti

## Il Laboratorio si Adatta a Ogni Strumento
*Dal telefono al computer, sempre a casa*

### I Nostri Formati

| Nome Affettuoso | Larghezza Minima | Larghezza Massima | Per Cosa lo Usiamo |
|-----------------|------------------|-------------------|---------------------|
| Telefonino | 320px | 767px | Smartphone di tutti i tipi |
| Tavoletta | 768px | 1023px | Tablet e computer piccoli |
| Scrivania | 1024px | 1439px | Computer di casa e ufficio |
| Schermone | 1440px | - | Monitor grandi e TV |

### Come il Laboratorio Cambia Forma

**L'Organizzazione degli Spazi:** Sul telefono tutto in fila indiana, sul computer più colonne affiancate, menu che si nascondono quando serve

**Come ci si Muove:** Sul telefono il menu a panino, sul computer una bella barra orizzontale, linguette sul telefono che diventano tendine sul computer

**Cosa Mostrare:** Sul telefono solo l'essenziale, sul computer anche i dettagli, come mettere in ordine una stanza piccola o grande

**Come si Tocca:** Sul telefono bottoni grandi per le dita, sul computer effetti quando ci passi sopra, gesti di scorrimento sul telefono, click del mouse sul computer

## La Vita e i Piccoli Gesti del Laboratorio
*Come ogni movimento racconta una storia*

### La Filosofia del Movimento
Ogni animazione deve sembrare naturale come un respiro, utile come un cenno della mano. I movimenti escono dolcemente, mai bruschi, sempre sotto i 300ms per i piccoli gesti.

### I Movimenti che Amiamo
- **Il Cuore che Batte:** Si ingrandisce e cambia colore quando lo tocchi (200ms, dolce)
- **La Cartolina Curiosa:** Si alza leggermente quando ci passi sopra (150ms, gentile)
- **I Numeri che Crescono:** Salgono con un piccolo rimbalzo di gioia (300ms, allegro)
- **Il Cambio di Pagina:** Una dissolvenza delicata come voltare pagina (200ms, morbido)
- **L'Attesa Paziente:** Un respiro tranquillo mentre carica (1000ms, rilassante)

## Il Laboratorio che Funziona Bene
*Perché nessuno deve aspettare troppo*

### I Nostri Obiettivi
- **Aprire la Porta:** Meno di 3 secondi anche con internet lento (3G)
- **Rispondere al Tocco:** Meno di 100ms per dire "ho sentito"
- **Muoversi Fluidamente:** 60 fotogrammi al secondo, sempre, come il cinema

### Come Facciamo
Immagini leggere in formato WebP, animazioni in CSS (più fluide), caricamento graduale delle cartoline, catalogo che appare man mano, JavaScript ridotto all'essenziale per votare.

## I Prossimi Passi del Nostro Viaggio

### Cosa Facciamo Ora
1. Condividiamo questa visione con tutta la famiglia per raccogliere idee e approvazione
2. Disegniamo tutto nei dettagli su Figma, come gli schizzi diventano progetti
3. Prepariamo le istruzioni precise per chi costruirà materialmente il laboratorio
4. Facciamo provare i percorsi alle persone vere per vedere se funzionano
5. Mettiamo a punto tutti i dettagli per l'accessibilità con chi programma

### La Lista della Spesa Completata
- [x] Tutti i percorsi del laboratorio descritti
- [x] Inventario completo degli strumenti
- [x] Requisiti per accogliere tutti definiti
- [x] Strategia per ogni tipo di schermo chiara
- [x] Identità del laboratorio incorporata
- [x] Obiettivi di prestazione stabiliti

## Il Registro del Laboratorio

_Qui terremo traccia di tutti i controlli e miglioramenti che faremo al nostro laboratorio digitale_

---

*Questa specifica trasforma WikiGaiaLab da piattaforma tecnologica a laboratorio di quartiere, dove l'AI diventa il maestro artigiano che aiuta la gente comune a risolvere i problemi di tutti i giorni. Ogni persona, dal nonno alla mamma, dal pensionato allo studente, trova qui il suo posto in una comunità che si aiuta reciprocamente.*

**Cuore della Trasformazione:**
- Da "utenti" a "vicini di casa"
- Da "funzionalità" a "strumenti del maestro"
- Da "interfaccia" a "laboratorio accogliente"
- Da "processo" a "viaggio guidato"
- Da "sistema" a "comunità che si aiuta"

*Benvenuti nel laboratorio digitale di WikiGaiaLab - dove la tecnologia ha l'anima del quartiere italiano.*