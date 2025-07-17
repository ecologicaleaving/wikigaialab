-- WikiGaiaLab Database Schema v1.0
-- Migration 006: Enhanced Seed Data for Content Management
-- Epic 3, Story 3.3: Pre-population with diverse, high-quality problems
-- Author: Claude (Dev Agent)
-- Date: 2025-07-17

BEGIN;

-- First, enhance existing categories with icons, colors, and keywords
UPDATE categories SET 
    icon_name = 'laptop',
    color_hex = '#3B82F6',
    keywords = ARRAY['AI', 'app', 'software', 'digital', 'automazione', 'tech', 'sviluppo', 'programmazione', 'innovazione', 'startup']
WHERE name = 'Tecnologia';

UPDATE categories SET 
    icon_name = 'leaf',
    color_hex = '#10B981',
    keywords = ARRAY['sostenibile', 'green', 'rifiuti', 'energia', 'clima', 'ambiente', 'ecologia', 'rinnovabile', 'inquinamento', 'natura']
WHERE name = 'Ambiente';

UPDATE categories SET 
    icon_name = 'users',
    color_hex = '#F59E0B',
    keywords = ARRAY['comunità', 'volontariato', 'sociale', 'charity', 'solidarietà', 'integrazione', 'inclusione', 'cittadinanza', 'partecipazione']
WHERE name = 'Sociale';

UPDATE categories SET 
    icon_name = 'trending-up',
    color_hex = '#EF4444',
    keywords = ARRAY['business', 'finanza', 'startup', 'mercato', 'impresa', 'economia', 'investimenti', 'lavoro', 'commercio', 'sviluppo']
WHERE name = 'Economia';

UPDATE categories SET 
    icon_name = 'heart',
    color_hex = '#8B5CF6',
    keywords = ARRAY['salute', 'fitness', 'medicina', 'benessere', 'sport', 'nutrizione', 'prevenzione', 'cura', 'mentale', 'fisico']
WHERE name = 'Salute';

-- Temporarily disable auto-vote trigger for seeding
ALTER TABLE problems DISABLE TRIGGER IF EXISTS trigger_auto_vote_on_problem_creation;

-- Get category IDs for use in problem insertion
DO $$
DECLARE
    tech_id UUID;
    env_id UUID;
    social_id UUID;
    econ_id UUID;
    health_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO tech_id FROM categories WHERE name = 'Tecnologia';
    SELECT id INTO env_id FROM categories WHERE name = 'Ambiente';
    SELECT id INTO social_id FROM categories WHERE name = 'Sociale';
    SELECT id INTO econ_id FROM categories WHERE name = 'Economia';
    SELECT id INTO health_id FROM categories WHERE name = 'Salute';
    
    -- Create an admin user for seeding if doesn't exist
    INSERT INTO users (id, email, name, is_admin, created_at, last_login_at)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin@wikigaialab.com',
        'WikiGaiaLab Admin',
        true,
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '1 day'
    ) ON CONFLICT (id) DO NOTHING;
    
    admin_user_id := '00000000-0000-0000-0000-000000000001';

    -- Insert diverse, high-quality problems across categories
    
    -- TECNOLOGIA PROBLEMS (7 problems)
    INSERT INTO problems (proposer_id, title, description, category_id, status, vote_count, moderation_status, moderated_by, moderated_at, created_at, updated_at, is_featured) VALUES
    (admin_user_id, 'Piattaforma AI per assistenza coding personalizzata', 'Sviluppare un assistente AI che comprende il contesto del progetto e fornisce suggerimenti di codice personalizzati, debugging intelligente e documentazione automatica per sviluppatori italiani.', tech_id, 'Proposed', 42, 'approved', admin_user_id, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', true),
    (admin_user_id, 'App mobile per gestione smart home unificata', 'Creare un''app che integra tutti i dispositivi IoT domestici in un''unica interfaccia intuitiva, con automazioni intelligenti e controllo vocale in italiano.', tech_id, 'Proposed', 38, 'approved', admin_user_id, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', false),
    (admin_user_id, 'Sistema di backup incrementale per PMI', 'Soluzione di backup automatizzata e sicura per piccole-medie imprese, con crittografia end-to-end e recupero rapido dei dati in caso di emergenza.', tech_id, 'Proposed', 31, 'approved', admin_user_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', false),
    (admin_user_id, 'Marketplace per plugin WordPress italiani', 'Piattaforma dedicata a plugin WordPress sviluppati in Italia, con documentazione in italiano, supporto locale e integrazione con servizi italiani.', tech_id, 'Proposed', 28, 'approved', admin_user_id, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', false),
    (admin_user_id, 'Tool di analisi performance web real-time', 'Strumento per monitorare prestazioni siti web in tempo reale, con metriche Core Web Vitals, suggerimenti di ottimizzazione e report automatici.', tech_id, 'Proposed', 25, 'approved', admin_user_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', false),
    (admin_user_id, 'Piattaforma di testing automatizzato per API', 'Sistema per automatizzare i test di API REST e GraphQL, con generazione automatica di test case e integrazione CI/CD per team di sviluppo.', tech_id, 'Proposed', 22, 'approved', admin_user_id, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', false),
    (admin_user_id, 'App di gestione progetti per freelancer', 'Applicazione completa per freelancer e piccoli team: gestione clienti, timetracking, fatturazione, portfolio e comunicazione, tutto in un''unica piattaforma.', tech_id, 'Proposed', 19, 'approved', admin_user_id, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', false);

    -- AMBIENTE PROBLEMS (6 problems)
    INSERT INTO problems (proposer_id, title, description, category_id, status, vote_count, moderation_status, moderated_by, moderated_at, created_at, updated_at, is_featured) VALUES
    (admin_user_id, 'Sistema di monitoraggio qualità aria urbana', 'Rete di sensori IoT per monitorare inquinamento atmosferico in tempo reale, con app cittadini per dati localizzati e alert per zone critiche.', env_id, 'Proposed', 45, 'approved', admin_user_id, NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', true),
    (admin_user_id, 'App per ottimizzazione raccolta differenziata', 'Applicazione che aiuta cittadini a differenziare correttamente i rifiuti, con scanner di prodotti, calendario raccolta e gamification per incentivare buone pratiche.', env_id, 'Proposed', 39, 'approved', admin_user_id, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', false),
    (admin_user_id, 'Piattaforma sharing per attrezzi da giardino', 'Community app per condividere attrezzi da giardinaggio tra vicini, riducendo sprechi e costi, con sistema di recensioni e prenotazioni.', env_id, 'Proposed', 33, 'approved', admin_user_id, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', false),
    (admin_user_id, 'Calcolatore impronta carbonica personalizzato', 'Tool per calcolare e ridurre l''impronta carbonica personale, con suggerimenti pratici, tracking progressi e sfide eco-friendly.', env_id, 'Proposed', 30, 'approved', admin_user_id, NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', false),
    (admin_user_id, 'Sistema gestione energia smart per condomini', 'Piattaforma per monitorare e ottimizzare consumi energetici condominiali, con pannelli solari condivisi e ripartizione automatica dei costi.', env_id, 'Proposed', 27, 'approved', admin_user_id, NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', false),
    (admin_user_id, 'Marketplace per prodotti sostenibili locali', 'E-commerce dedicato a prodotti eco-sostenibili di produttori locali, con certificazioni ambientali e tracciabilità della filiera.', env_id, 'Proposed', 24, 'approved', admin_user_id, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', false);

    -- SOCIALE PROBLEMS (6 problems)
    INSERT INTO problems (proposer_id, title, description, category_id, status, vote_count, moderation_status, moderated_by, moderated_at, created_at, updated_at, is_featured) VALUES
    (admin_user_id, 'Piattaforma coordinamento volontariato locale', 'App per connettere volontari con associazioni locali, gestire eventi, tracciare ore di volontariato e creare community di cittadini attivi.', social_id, 'Proposed', 41, 'approved', admin_user_id, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', true),
    (admin_user_id, 'Sistema segnalazioni problemi urbani', 'Piattaforma cittadina per segnalare buche, illuminazione rotta, rifiuti abbandonati, con geolocalizzazione e tracking risoluzione da parte del comune.', social_id, 'Proposed', 37, 'approved', admin_user_id, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', false),
    (admin_user_id, 'App di supporto per anziani in quartiere', 'Rete di vicinato per assistere anziani: spesa, commissioni, compagnia, con sistema di sicurezza e coinvolgimento famiglie.', social_id, 'Proposed', 34, 'approved', admin_user_id, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', false),
    (admin_user_id, 'Piattaforma eventi culturali partecipati', 'Sistema per organizzare eventi culturali dal basso: concerti, mostre, letture, con crowdfunding e gestione spazi pubblici.', social_id, 'Proposed', 29, 'approved', admin_user_id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', false),
    (admin_user_id, 'Network di scambio competenze tra cittadini', 'Piattaforma per scambiare competenze e servizi senza denaro: lezioni, riparazioni, consulenze, basata su sistema di crediti e fiducia.', social_id, 'Proposed', 26, 'approved', admin_user_id, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', false),
    (admin_user_id, 'App aggregazione gruppi di acquisto solidale', 'Sistema per organizzare GAS (Gruppi di Acquisto Solidale) con gestione ordini, produttori locali e distribuzione equa.', social_id, 'Proposed', 21, 'approved', admin_user_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', false);

    -- ECONOMIA PROBLEMS (5 problems)
    INSERT INTO problems (proposer_id, title, description, category_id, status, vote_count, moderation_status, moderated_by, moderated_at, created_at, updated_at, is_featured) VALUES
    (admin_user_id, 'Piattaforma crowdfunding per startup italiane', 'Sistema di finanziamento collettivo dedicato a startup innovative italiane, con due diligence, mentorship e supporto post-finanziamento.', econ_id, 'Proposed', 36, 'approved', admin_user_id, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days', false),
    (admin_user_id, 'Marketplace servizi professionali locali', 'Piattaforma per professionisti locali (idraulici, elettricisti, consulenti) con recensioni verificate, preventivi e gestione appuntamenti.', econ_id, 'Proposed', 32, 'approved', admin_user_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', false),
    (admin_user_id, 'Sistema gestione finanziaria per microimprese', 'Software semplificato per gestione contabile, fatturazione, scadenze e cash flow per microimprese e artigiani, con integrazione banche italiane.', econ_id, 'Proposed', 28, 'approved', admin_user_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', false),
    (admin_user_id, 'App educazione finanziaria per giovani', 'Piattaforma gamificata per insegnare gestione denaro, investimenti base e pianificazione finanziaria a studenti e giovani lavoratori.', econ_id, 'Proposed', 23, 'approved', admin_user_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', false),
    (admin_user_id, 'Network coworking dinamico per nomadi digitali', 'Sistema per prenotare spazi coworking in diverse città italiane, con community, eventi networking e servizi integrati.', econ_id, 'Proposed', 20, 'approved', admin_user_id, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', false);

    -- SALUTE PROBLEMS (6 problems)
    INSERT INTO problems (proposer_id, title, description, category_id, status, vote_count, moderation_status, moderated_by, moderated_at, created_at, updated_at, is_featured) VALUES
    (admin_user_id, 'App wellness aziendale con AI coaching', 'Piattaforma per benessere dipendenti con AI coach personalizzato, tracking salute, sfide team e integrazione con sistemi HR aziendali.', health_id, 'Proposed', 43, 'approved', admin_user_id, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', true),
    (admin_user_id, 'Sistema promemoria farmaci per anziani', 'App con dispenser smart per ricordare assunzione farmaci, monitorare aderenza terapeutica e allertare familiari in caso di problemi.', health_id, 'Proposed', 35, 'approved', admin_user_id, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', false),
    (admin_user_id, 'Piattaforma telemedicina per zone rurali', 'Sistema di consulti medici a distanza per aree con carenza di medici, con diagnostica di base e coordinamento con ospedali.', health_id, 'Proposed', 31, 'approved', admin_user_id, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', false),
    (admin_user_id, 'App tracking salute mentale e meditazione', 'Piattaforma per monitorare benessere psicologico con meditazioni guidate, journal emotivo e supporto community.', health_id, 'Proposed', 27, 'approved', admin_user_id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', false),
    (admin_user_id, 'Sistema prenotazione sport e fitness locale', 'App per prenotare campi sportivi, corsi fitness, personal trainer nella propria zona, con pagamenti integrati e community sportiva.', health_id, 'Proposed', 24, 'approved', admin_user_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', false),
    (admin_user_id, 'Piattaforma nutrizionale con chef locali', 'Sistema per piani alimentari personalizzati con chef e nutrizionisti locali, ingredienti km0 e delivery pasti sani.', health_id, 'Proposed', 18, 'approved', admin_user_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', false);

END $$;

-- Create some featured content collections
INSERT INTO content_collections (name, description, created_by, is_active) VALUES
('Problemi in Evidenza', 'Selezione curata dei problemi più innovativi e impattanti della piattaforma', '00000000-0000-0000-0000-000000000001', true),
('Startup del Mese', 'Problemi con potenziale di diventare startup di successo', '00000000-0000-0000-0000-000000000001', true),
('Soluzioni Verdi', 'Raccolta di problemi focalizzati sulla sostenibilità ambientale', '00000000-0000-0000-0000-000000000001', true);

-- Add featured problems to collections
INSERT INTO collection_problems (collection_id, problem_id, added_by, display_order)
SELECT 
    cc.id,
    p.id,
    '00000000-0000-0000-0000-000000000001',
    ROW_NUMBER() OVER (PARTITION BY cc.id ORDER BY p.vote_count DESC)
FROM content_collections cc
CROSS JOIN problems p
WHERE cc.name = 'Problemi in Evidenza' 
AND p.is_featured = true;

-- Re-enable auto-vote trigger
ALTER TABLE problems ENABLE TRIGGER IF EXISTS trigger_auto_vote_on_problem_creation;

-- Update category problem counts
UPDATE categories SET problems_count = (
    SELECT COUNT(*) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);

-- Update category last_used_at
UPDATE categories SET last_used_at = (
    SELECT MAX(created_at) FROM problems 
    WHERE problems.category_id = categories.id 
    AND problems.moderation_status = 'approved'
);

-- Initialize category analytics with historical data
INSERT INTO category_analytics (category_id, date, problems_added, total_votes, engagement_score)
SELECT 
    c.id,
    CURRENT_DATE - INTERVAL '7 days',
    COUNT(p.id),
    COALESCE(SUM(p.vote_count), 0),
    CASE 
        WHEN COUNT(p.id) > 0 THEN ROUND((COALESCE(SUM(p.vote_count), 0)::DECIMAL / COUNT(p.id)), 2)
        ELSE 0
    END
FROM categories c
LEFT JOIN problems p ON p.category_id = c.id 
    AND p.created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND p.moderation_status = 'approved'
GROUP BY c.id;

COMMIT;