# WikiGaiaLab Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Creare un portfolio di applicazioni AI-powered per Ecologicaleaving dimostrando competenze tecniche innovative
- Costruire una community attiva attorno ad Ass.Gaia attraverso la partecipazione alla risoluzione di problemi comuni
- Validare idee di prodotto attraverso il voto democratico della community prima dello sviluppo
- Generare revenue attraverso un modello freemium sostenibile che premia la partecipazione attiva
- Posizionare il progetto come esperimento di innovazione sociale e tecnologia per il bene comune
- Creare contenuti e case study continui per marketing e brand awareness di entrambe le organizzazioni

### Background Context

WikiGaiaLab nasce dalla collaborazione tra Ass.Gaia (community sostenibile) ed Ecologicaleaving (azienda software) come esperimento di innovazione sociale. Il progetto affronta il problema dell'accessibilità degli strumenti digitali: molte persone hanno necessità quotidiane che potrebbero essere risolte con semplici applicazioni AI, ma non hanno le competenze tecniche per svilupparle. 

Il modello proposto democratizza lo sviluppo software attraverso un processo partecipativo dove la community identifica i problemi più sentiti attraverso il voto, garantendo che le risorse di sviluppo siano allocate su soluzioni con reale domanda di mercato. Questo approccio serve simultaneamente come validazione continua del mercato e come strumento di engagement della community.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 17/07/2025 | 1.0 | Creazione iniziale PRD | John (PM) |

## Requirements

### Functional

1. **FR1**: Il sistema deve permettere agli utenti di registrarsi e autenticarsi utilizzando Google OAuth tramite Supabase
2. **FR2**: Gli utenti autenticati possono proporre nuovi problemi attraverso un form che richiede titolo, descrizione dettagliata e categoria
3. **FR3**: Ogni problema proposto deve essere visualizzato come una card nella dashboard principale con contatore dei voti in tempo reale
4. **FR4**: Gli utenti autenticati possono votare una sola volta per ogni problema, con voto registrato nel database
5. **FR5**: Il sistema deve inviare notifiche email automatiche quando un problema raggiunge soglie significative (50, 75, 100 voti)
6. **FR6**: Quando un problema raggiunge 100 voti, il sistema deve notificare gli admin che possono cambiare lo stato da "Proposto" a "In Sviluppo"
7. **FR7**: Gli utenti possono condividere i problemi sui social media (Facebook, WhatsApp, Twitter) con link diretto alla proposta
8. **FR8**: Il sistema deve tracciare quali utenti hanno votato quali problemi per garantire accesso premium gratuito alle future soluzioni
9. **FR9**: Ogni app sviluppata deve avere una pagina dedicata con funzionalità base accessibili a tutti e premium per votanti/abbonati
10. **FR10**: Il sistema deve supportare pagamenti via Stripe per abbonamenti singola app, pass mensile o pass lifetime
11. **FR11**: Gli admin devono avere una dashboard con statistiche complete (utenti totali, problemi proposti, voti, revenue)
12. **FR12**: Gli admin possono modificare manualmente lo stato dei problemi e decidere di sviluppare problemi sotto i 100 voti
13. **FR13**: Il sistema deve permettere ricerca e filtraggio dei problemi per categoria, popolarità, data e stato
14. **FR14**: Ogni utente deve avere un profilo personale che mostra problemi proposti, votati e app accessibili
15. **FR15**: Il sistema deve supportare la pre-popolazione con problemi proposti dal team per evitare "cold start"
16. **FR16**: Gli admin possono creare e gestire categorie per organizzare i problemi proposti

### Non Functional

1. **NFR1**: Il sistema deve supportare almeno 10.000 utenti concorrenti senza degradazione delle performance
2. **NFR2**: Il tempo di caricamento della dashboard principale non deve superare i 3 secondi su connessione 3G
3. **NFR3**: L'interfaccia deve essere completamente responsive e utilizzabile su dispositivi mobile (iOS/Android)
4. **NFR4**: Il sistema deve essere conforme al GDPR per la gestione dei dati personali degli utenti europei
5. **NFR5**: Tutti i dati sensibili devono essere criptati in transito (HTTPS) e a riposo nel database
6. **NFR6**: Il sistema deve avere un uptime del 99.9% con strategia di disaster recovery
7. **NFR7**: L'architettura deve permettere l'aggiunta di nuove app senza modifiche al core system
8. **NFR8**: Il codebase deve seguire le best practices di Next.js con TypeScript per manutenibilità
9. **NFR9**: L'interfaccia deve essere in italiano come lingua principale (inglese pianificato per v2)
10. **NFR10**: Le API di AI (OpenAI/Anthropic) devono avere fallback e caching per controllare i costi

## User Interface Design Goals

### Overall UX Vision
Un'interfaccia pulita, moderna e accessibile che renda immediato proporre problemi e votare. L'esperienza deve essere così semplice che anche utenti non tecnici possano partecipare attivamente. Il design deve trasmettere innovazione sociale e collaborazione comunitaria.

### Key Interaction Paradigms
- **Card-based navigation**: Ogni problema è una card visuale con informazioni chiave immediatamente visibili
- **One-click actions**: Votare deve essere immediato, senza form o conferme multiple
- **Real-time updates**: Contatori voti e stati si aggiornano in tempo reale senza refresh
- **Mobile-first approach**: Tutte le interazioni primarie ottimizzate per touch su mobile
- **Social sharing integrato**: Condivisione nativa per massimizzare viralità

### Core Screens and Views
- **Homepage/Landing**: Presentazione del progetto e CTA per registrazione/login
- **Dashboard Utente**: Panoramica personalizzata con statistiche personali e gestione dati
- **Dashboard Problemi**: Vista principale con tutti i problemi in cards filtrabili
- **Dettaglio Problema**: Pagina dedicata con descrizione completa, commenti, statistiche
- **Proponi Problema**: Form guidato per proporre nuovi problemi
- **Profilo Utente**: I miei problemi, voti, app accessibili
- **Catalogo App**: Showcase delle soluzioni sviluppate con accesso base/premium
- **Admin Dashboard**: Statistiche, gestione problemi, moderazione
- **Pagina App**: Interfaccia specifica per ogni soluzione sviluppata

### Accessibility: WCAG AA
Il progetto deve essere accessibile secondo standard WCAG AA per includere il maggior numero di utenti possibile, coerentemente con la missione sociale.

### Branding
- Identità visiva che combini innovazione tecnologica (Ecologicaleaving) e sostenibilità sociale (Ass.Gaia)
- Palette colori naturali con accenti tech
- Typography moderna ma leggibile
- Iconografia friendly e immediata
- Logo WikiGaiaLab prominente

### Target Device and Platforms: Web Responsive
Applicazione web responsive che funzioni perfettamente su desktop, tablet e mobile. Priorità all'esperienza mobile per massimizzare partecipazione.

## Technical Assumptions

### Repository Structure: Monorepo
Un singolo repository conterrà il frontend Next.js, il backend Node.js, e tutte le app sviluppate come moduli separati.

### Service Architecture
Architettura modulare con core platform (voting, users, problems) e app come plugin indipendenti. Ogni app avrà il proprio namespace ma condividerà autenticazione e sistema di pagamenti.

### Testing Requirements
- Unit tests per logica di business critica (voting, payments)
- Integration tests per flussi utente principali
- E2E tests per happy path (proponi → vota → accedi app)
- Test manuali per nuove app prima del rilascio

### Additional Technical Assumptions and Requests
- **Frontend**: Next.js 14+ con App Router, TypeScript, Tailwind CSS
- **Backend**: Node.js con Express/Fastify per API REST
- **Database**: PostgreSQL su Supabase per dati relazionali
- **Auth**: Supabase Auth con Google OAuth
- **File Storage**: Supabase Storage per immagini/assets delle app
- **AI Integration**: OpenAI API con Vercel AI SDK per le app
- **Payments**: Stripe con webhook per gestione abbonamenti
- **Email**: Resend o SendGrid per notifiche automatiche
- **Deployment**: Vercel per frontend, Supabase per backend/DB
- **Monitoring**: Vercel Analytics + Sentry per error tracking
- **CI/CD**: GitHub Actions per test e deploy automatici
- **Development**: Sviluppo locale con database Supabase remoto dal day 1

## Epic List

### Epic 1: Foundation & Core Platform
Creare l'infrastruttura base del progetto con autenticazione, struttura dati e prima versione della dashboard per permettere registrazione utenti e visualizzazione problemi pre-popolati.

#### Story 1.7: User Dashboard

As a user,
I want to have a personal dashboard with my statistics and quick actions,
so that I can see my impact and manage my account easily.

#### Acceptance Criteria
1: Dashboard accessible after login showing personalized content
2: Statistics cards: problems proposed, total votes cast, apps unlocked
3: Recent activity feed: last votes, problem status changes
4: Quick actions: propose problem, browse problems, my apps
5: Personal data management section with edit capabilities
6: Notification preferences settings
7: Visual progress indicators for community participation
8: Mobile-optimized card layout

## Epic 2: Community Features - Propose & Vote
Implementare il cuore del sistema: proposta di nuovi problemi e meccanismo di voto, incluse notifiche e condivisione social per crescita virale.

### Epic 3: App Showcase & Access Control
Sviluppare il sistema per mostrare le app create, gestire accessi base/premium basati sui voti, e la prima app dimostrativa (Generatore Volantini).

### Epic 4: Monetization & Admin Tools
Integrare pagamenti Stripe per abbonamenti, dashboard amministrativa completa, e strumenti per gestione contenuti e moderazione.

## Epic 1: Foundation & Core Platform

**Goal**: Stabilire l'infrastruttura tecnica fondamentale di WikiGaiaLab con autenticazione utenti, database schema, e interfaccia base per visualizzare i primi problemi pre-popolati. Questa base permetterà di dimostrare immediatamente il concept e iniziare a raccogliere i primi utenti beta.

### Story 1.1: Project Setup & Configuration

As a developer,
I want to initialize the WikiGaiaLab monorepo with all necessary configurations,
so that the team can start development with a solid foundation.

#### Acceptance Criteria
1. Next.js project initialized with TypeScript and Tailwind CSS configured
2. Supabase project created with connection configured locally
3: ESLint and Prettier configured with team standards
4: Git repository initialized with proper .gitignore
5: Basic folder structure created following Next.js App Router conventions
6: Environment variables setup for local development (.env.local.example)
7: README.md with setup instructions for new developers
8: Package.json with all necessary scripts (dev, build, test, lint)

### Story 1.2: Database Schema Design

As a developer,
I want to create the initial database schema in Supabase,
so that we can store users, problems, votes, and apps data.

#### Acceptance Criteria
1: Users table created with Google OAuth fields and metadata
2: Problems table with all necessary fields (title, description, status, vote_count, etc.)
3: Votes table to track user-problem relationships
4: Categories table for organizing problems
5: Apps table for future developed solutions
6: Proper indexes added for performance on common queries
7: RLS (Row Level Security) policies configured for security
8: Database migrations saved and versioned

### Story 1.3: Authentication Implementation

As a user,
I want to register and login using my Google account,
so that I can participate in the WikiGaiaLab community.

#### Acceptance Criteria
1: Supabase Auth configured with Google OAuth provider
2: Login/Register page created with Google sign-in button
3: Successful auth redirects to dashboard
4: User session persisted across page refreshes
5: Logout functionality implemented
6: Auth context/hook created for accessing user throughout app
7: Protected routes setup (redirect to login if not authenticated)
8: Error handling for auth failures with user-friendly messages

### Story 1.4: Basic Layout & Navigation

As a user,
I want to navigate through the main sections of WikiGaiaLab,
so that I can access all available features.

#### Acceptance Criteria
1: Header component with WikiGaiaLab logo and navigation menu
2: Responsive mobile menu for small screens
3: Footer with links to Ass.Gaia and Ecologicaleaving
4: Navigation items: Home, Problemi, Le Mie App, Profilo (if logged in)
5: Active state styling for current page
6: User menu dropdown with logout option when authenticated
7: Consistent layout wrapper for all pages
8: Loading states for navigation transitions

### Story 1.5: Problems Dashboard - View Only

As a user,
I want to see all proposed problems in an organized dashboard,
so that I can discover what solutions the community needs.

#### Acceptance Criteria
1: Dashboard page showing all problems as visual cards
2: Each card displays: title, description preview, vote count, status
3: Problems fetched from Supabase with proper error handling
4: Loading skeleton while data is being fetched
5: Empty state when no problems exist
6: Responsive grid layout (1 col mobile, 2 tablet, 3+ desktop)
7: Real-time vote count updates using Supabase subscriptions
8: Status badges with different colors (Proposto, In Sviluppo, Completato)

### Story 1.6: Pre-populate Initial Problems

As an admin,
I want to add the first 3-5 example problems to the platform,
so that new users immediately understand the concept.

#### Acceptance Criteria
1: Admin script/seed file to insert example problems
2: At least 3 well-crafted problems in different categories
3: Each problem has realistic vote counts (30-80 votes)
4: Problems cover different use cases (personal, business, creative)
5: Proper Italian language for all content
6: Verification that problems display correctly in dashboard
7: Documentation on how to run seed script

## Epic 2: Community Features - Propose & Vote

**Goal**: Implementare le funzionalità core che permettono alla community di proporre nuovi problemi e votare quelli esistenti. Include il sistema di notifiche, condivisione social e tutte le interazioni che guidano l'engagement e la crescita virale della piattaforma.

### Story 2.1: Propose Problem Form

As a registered user,
I want to propose a new problem that needs solving,
so that the community can vote if they want this solution developed.

#### Acceptance Criteria
1: Dedicated page/modal for problem submission with form fields
2: Required fields: Title (max 100 chars), Description (max 1000 chars), Category
3: Optional fields: Example use case, target audience
4: Categories loaded dynamically from database
5: Client-side validation with helpful error messages
6: Submit button disabled while processing
7: Success message and redirect to new problem page after creation
8: New problems start with 1 vote (from the proposer)

### Story 2.2: Voting Mechanism

As a registered user,
I want to vote for problems that interest me,
so that I can help prioritize which solutions get developed.

#### Acceptance Criteria
1: Vote button prominently displayed on each problem card
2: Single click to vote (no confirmation needed)
3: Visual feedback on vote (animation, color change)
4: Vote count updates in real-time for all viewers
5: Voted problems show different state (filled heart/star icon)
6: Cannot vote twice on same problem (button disabled)
7: Vote tracked in database with user_id and timestamp
8: Optimistic UI update with rollback on error

### Story 2.3: Problem Detail Page

As a user,
I want to view complete details about a problem,
so that I can fully understand it before voting.

#### Acceptance Criteria
1: Dedicated route for each problem (/problems/[id])
2: Full description displayed with proper formatting
3: Vote count, proposer info, and submission date shown
4: List of categories/tags associated
5: Vote button with same functionality as dashboard
6: Share buttons for social media (Facebook, WhatsApp, Twitter)
7: SEO meta tags for social sharing preview
8: "Back to problems" navigation

### Story 2.4: Social Sharing Integration

As a user,
I want to share interesting problems on social media,
so that I can invite others to vote and grow the community.

#### Acceptance Criteria
1: Share buttons on problem cards and detail pages
2: Pre-filled text for each platform with problem title and link
3: WhatsApp share with custom message in Italian
4: Facebook share with OpenGraph tags properly set
5: Twitter/X share with hashtags #WikiGaiaLab
6: Copy link button for other sharing methods
7: Share tracking for analytics (optional)
8: Mobile-optimized sharing that opens native apps

### Story 2.5: Email Notifications System

As a user,
I want to receive notifications about problems I'm interested in,
so that I stay engaged with the platform.

#### Acceptance Criteria
1: Email notification when problem reaches 50, 75, 100 votes
2: Email to problem proposer for milestone notifications
3: Email when a voted problem changes status
4: Unsubscribe link in all emails (GDPR compliant)
5: Email templates in Italian with good design
6: Queue system to handle email sending asynchronously
7: Admin notification when problem reaches 100 votes
8: Test mode to prevent emails in development

### Story 2.6: User Profile & Activity

As a user,
I want to see my activity and contributions,
so that I can track my participation in WikiGaiaLab.

#### Acceptance Criteria
1: Profile page showing user information
2: List of problems proposed by user with status
3: List of problems voted with current vote counts
4: Statistics: total votes cast, problems proposed
5: Future section for "Le mie app" (placeholder)
6: Edit profile basic information
7: Privacy settings for public/private profile
8: Responsive layout for mobile viewing

### Story 2.7: Category Management for Admin

As an admin,
I want to manage problem categories,
so that problems are well organized and easy to discover.

#### Acceptance Criteria
1: Admin page to view all categories
2: Add new category with name and description
3: Edit existing categories
4: Soft delete categories (hide but keep data)
5: Reorder categories for display priority
6: Category usage count shown
7: Prevent deletion of categories in use
8: Basic admin auth check (user role)

## Epic 3: App Showcase & Access Control

**Goal**: Creare il sistema per mostrare le soluzioni sviluppate, gestire gli accessi differenziati base/premium basati sulla partecipazione al voto, e lanciare la prima app dimostrativa (Generatore Volantini) per validare l'intero flusso end-to-end.

### Story 3.1: App Catalog Page

As a user,
I want to browse all developed solutions,
so that I can find and use apps that solve my problems.

#### Acceptance Criteria
1: Dedicated page showing all published apps as cards
2: Each card shows: app name, description, problem solved, user count
3: "Premium" or "Free" badge based on user's access rights
4: Filter by category, access type, popularity
5: Search functionality by app name or description
6: Link to individual app page from each card
7: Coming soon section for problems in development
8: Responsive masonry/grid layout

### Story 3.2: App Access Control System

As a platform owner,
I want to control access to app features based on voting participation,
so that we reward community engagement.

#### Acceptance Criteria
1: Middleware to check user's voting history for each app
2: Users who voted get full premium access
3: Non-voters see limited/base features
4: Access rights cached for performance
5: Clear UI indicators for locked/unlocked features
6: "Unlock premium" CTA for non-voters (future payment)
7: Admin override to grant access manually
8: Access logs for analytics

### Story 3.3: Volantino Generator App - Core Structure

As a developer,
I want to create the foundation for the first demo app,
so that we can showcase the WikiGaiaLab concept.

#### Acceptance Criteria
1: Separate route/page for Volantino app (/apps/volantino)
2: App wrapped in access control middleware
3: Basic form with fields: event name, date, location, description
4: Preview pane showing live updates as user types
5: Responsive layout with form and preview side-by-side
6: Italian language for all UI elements
7: Save form state to localStorage to prevent data loss
8: Loading states for AI generation

### Story 3.4: Volantino Generator - AI Integration

As a user,
I want AI to generate a beautiful flyer design from my inputs,
so that I can create professional materials without design skills.

#### Acceptance Criteria
1: "Generate" button triggers AI flyer creation
2: API endpoint that calls OpenAI/Anthropic for design
3: AI generates: color scheme, layout, and formatted text
4: Progress indicator during generation (5-10 seconds)
5: Error handling with user-friendly messages
6: Multiple style options (birthday, business, party)
7: Result displayed in preview with high quality
8: Regenerate option if user wants alternatives

### Story 3.5: Volantino Generator - Export Features

As a user,
I want to download and share my generated flyer,
so that I can use it for my actual event.

#### Acceptance Criteria
1: Download as PNG image (high resolution)
2: Download as PDF for printing
3: Share directly to social media
4: Premium feature: editable template download
5: Premium feature: remove watermark
6: Base users get watermarked version only
7: Download tracking for analytics
8: Mobile-friendly download process

### Story 3.6: App Analytics Dashboard

As an app developer,
I want to see usage statistics for each app,
so that we can improve based on user behavior.

#### Acceptance Criteria
1: Admin view showing stats per app
2: Metrics: total users, daily active, feature usage
3: Conversion rate: viewers to users
4: Premium vs base usage breakdown
5: Export data as CSV for analysis
6: Time range selector (week, month, all-time)
7: Simple charts using Recharts or similar
8: Performance: queries optimized with indexes

## Epic 4: Monetization & Admin Tools

**Goal**: Implementare il sistema di monetizzazione attraverso Stripe per gestire abbonamenti premium, creare una dashboard amministrativa completa per monitorare la piattaforma, e fornire tutti gli strumenti necessari per la gestione operativa quotidiana di WikiGaiaLab.

### Story 4.1: Stripe Payment Integration

As a platform owner,
I want to integrate Stripe for payment processing,
so that users can subscribe to premium features.

#### Acceptance Criteria
1: Stripe account setup with products for: single app, monthly pass, lifetime pass
2: Payment page with Stripe Elements for secure card input
3: Webhook endpoint to handle Stripe events
4: Database tables for subscriptions and payment history
5: Test mode configuration for development
6: Error handling for failed payments
7: Italian language for payment forms
8: PCI compliance through Stripe hosted fields

### Story 4.2: Subscription Management

As a user,
I want to manage my premium subscriptions,
so that I can control my spending and access.

#### Acceptance Criteria
1: Subscription page in user profile
2: View active subscriptions with renewal dates
3: Cancel subscription (effective at period end)
4: Upgrade/downgrade between plans
5: Payment history with invoices
6: Reactivate cancelled subscriptions
7: Email confirmations for all subscription changes
8: Grace period handling for failed payments

### Story 4.3: Premium Access Gates

As a developer,
I want to implement premium feature gates across all apps,
so that monetization is consistently applied.

#### Acceptance Criteria
1: Reusable component for premium-only features
2: Blur/lock overlay for premium content
3: "Upgrade to Premium" CTA with pricing
4: Smooth transition when user upgrades
5: Check both voting history AND paid subscriptions
6: Premium badge on user profiles
7: API middleware for premium-only endpoints
8: Graceful degradation for base users

### Story 4.4: Admin Dashboard - Overview

As an admin,
I want a comprehensive dashboard to monitor platform health,
so that I can make informed decisions.

#### Acceptance Criteria
1: Admin route protected by role check
2: Key metrics cards: total users, active problems, revenue
3: Growth charts: users, votes, problems over time
4: Real-time updates for critical metrics
5: Quick actions: feature problem, send announcement
6: Mobile-responsive admin interface
7: Export functionality for all data
8: Performance: dashboard loads under 2 seconds

### Story 4.5: Admin - Problem Management

As an admin,
I want to moderate and manage problems,
so that quality and appropriateness are maintained.

#### Acceptance Criteria
1: Table view of all problems with filters
2: Bulk actions: approve, reject, merge duplicates
3: Edit problem details and categories
4: Force status change (e.g., start development early)
5: Pin important problems to homepage
6: View vote details and patterns (fraud detection)
7: Add admin notes to problems
8: Audit log of all admin actions

### Story 4.6: Admin - User Management

As an admin,
I want to manage users and their access,
so that I can support customers and enforce policies.

#### Acceptance Criteria
1: User search by email, name, or ID
2: View user profile with all activity
3: Grant/revoke premium access manually
4: Ban/suspend users for policy violations
5: Send direct emails to users
6: Bulk user actions (e.g., grant access to beta)
7: User segments for targeted communications
8: GDPR compliance: data export and deletion

### Story 4.7: Platform Configuration

As an admin,
I want to configure platform settings dynamically,
so that we can adapt without code deploys.

#### Acceptance Criteria
1: Settings page for platform configuration
2: Configure: vote threshold, email templates, feature flags
3: Maintenance mode toggle with custom message
4: API rate limits per user tier
5: Payment plan prices and features
6: Homepage featured problems selection
7: Social media links and metadata
8: Changes take effect immediately without restart

## Checklist Results Report

_Questa sezione sarà popolata dopo la revisione del PRD con l'utente_

## Next Steps

### UX Expert Prompt
"Ciao Sally, ho completato il PRD per WikiGaiaLab. Per favore crea una UI/UX specification che traduca questi requisiti in un design system coerente e interfacce intuitive, con particolare attenzione all'esperienza mobile e all'accessibilità."

### Architect Prompt
"Ciao Winston, ho completato il PRD per WikiGaiaLab. Per favore crea un'architettura tecnica che supporti questi requisiti usando lo stack Next.js, Node.js, PostgreSQL/Supabase, con particolare focus su modularità per le future app e scalabilità."