# 🌐 Setup WikiGaiaLab con Supabase Cloud

**Perfetto per macOS 12 - Nessun Docker richiesto!**

## 🚀 Setup Rapido (10 minuti)

### 1. Esegui Setup Automatico
```bash
# Setup con Supabase online
pnpm run setup:cloud
```

Lo script ti guiderà attraverso:
- ✅ Controllo dipendenze
- ✅ Installazione pacchetti
- ✅ Configurazione credenziali Supabase
- ✅ Creazione file ambiente
- ✅ Test iniziali

### 2. Crea Progetto Supabase

**Vai su https://supabase.com e:**

1. **Registrati/Accedi** al tuo account Supabase
2. **Crea nuovo progetto**:
   - Nome: `WikiGaiaLab`
   - Database Password: (scegli una password sicura)
   - Regione: `Europe (eu-central-1)` (più vicina all'Italia)
3. **Aspetta** che il progetto sia pronto (2-3 minuti)

### 3. Ottieni Credenziali API

Nel tuo progetto Supabase:
1. Vai su **Settings** → **API**
2. Copia queste informazioni:
   - **Project URL**: `https://xyz.supabase.co`
   - **anon public key**: `eyJ...`
   - **service_role key**: `eyJ...`

### 4. Configura Database

Nel dashboard Supabase:
1. Vai su **SQL Editor**
2. Esegui questi file **in ordine**:

**File 1:** `packages/database/src/migrations/001_initial_schema.sql`
```sql
-- Copia e incolla il contenuto del file nel SQL Editor
-- Questo crea le tabelle principali (users, problems, votes, categories, apps)
```

**File 2:** `packages/database/src/migrations/002_triggers.sql`
```sql
-- Copia e incolla il contenuto del file
-- Questo crea i trigger per l'aggiornamento automatico
```

**File 3:** `packages/database/src/migrations/003_rls_policies.sql`
```sql
-- Copia e incolla il contenuto del file
-- Questo crea le politiche di sicurezza
```

**File 4:** `packages/database/src/migrations/004_seed_data.sql`
```sql
-- Copia e incolla il contenuto del file
-- Questo aggiunge dati di esempio per i test
```

### 5. Avvia l'App
```bash
# Avvia il server di sviluppo
pnpm dev
```

**🎉 Apri http://localhost:3000 - WikiGaiaLab è pronto!**

---

## 🔧 Configurazione Manuale (se preferisci)

### Crea .env.local Manualmente
```env
# Database Configuration (Supabase Cloud)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_KEY="eyJ..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WikiGaiaLab"
NODE_ENV="development"
```

### Test Connessione Database
```bash
# Verifica che tutto funzioni
pnpm run test:env
```

---

## 🎯 Funzionalità Disponibili

### ✅ Cosa Funziona Subito
- 🏠 **Landing page** ottimizzata
- 🔐 **Autenticazione** (dopo config Google OAuth)
- 📱 **Design responsive** per mobile
- 🗄️ **Database completo** con tutti i dati
- 🧪 **Suite di test** completa
- 📊 **Analytics** e tracking conversioni

### 🔒 Autenticazione Google (Opzionale)

Per abilitare il login con Google:

1. **Google Cloud Console**:
   - Vai su https://console.cloud.google.com
   - Crea progetto o seleziona esistente
   - Abilita Google+ API
   - Crea credenziali OAuth 2.0:
     - Tipo: Applicazione web
     - URI redirect autorizzati: `http://localhost:3000/auth/callback`

2. **Aggiungi a .env.local**:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-min-32-characters"
```

3. **Configura in Supabase**:
   - Vai su Authentication → Providers
   - Abilita Google
   - Inserisci Client ID e Secret

---

## 📊 Dashboard Supabase

### Gestione Database
- **Table Editor**: Visualizza e modifica i dati
- **Authentication**: Gestisci utenti registrati
- **Logs**: Monitora le query e errori
- **API**: Testa le chiamate API

### URL Importanti
- **App**: http://localhost:3000
- **Supabase Dashboard**: https://your-project.supabase.co
- **Database**: Accessibile tramite dashboard

---

## 🧪 Testing e Debug

### Comandi Utili
```bash
# Test ambiente
pnpm run test:env

# Test specifici
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Controllo codice
pnpm run type-check
pnpm run lint
```

### Debug Database
```bash
# Testa connessione database
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('users').select('*').limit(1).then(console.log);
"
```

---

## 🚨 Risoluzione Problemi

### Errori Comuni

**❌ "Invalid API key"**
```bash
# Verifica le credenziali in .env.local
# Controlla che URL e chiavi siano corretti
```

**❌ "Table does not exist"**
```bash
# Esegui di nuovo gli script SQL in Supabase
# Verifica che tutti e 4 i file siano stati eseguiti
```

**❌ "Auth error"**
```bash
# Verifica configurazione Google OAuth
# Controlla URI redirect in Google Console
```

### Ripristino Setup
```bash
# Ripeti setup completo
pnpm run setup:cloud

# O manualmente:
rm .env.local
pnpm install
# Riconfigura credenziali
```

---

## 🌟 Vantaggi Setup Cloud

### ✅ Pro:
- **Nessun Docker** richiesto
- **Database sempre online** e accessibile
- **Backup automatici** dei dati
- **Scalabilità** automatica
- **Dashboard visual** per gestione dati
- **Collaborazione** semplice con team

### ⚠️ Considera:
- Richiede connessione internet
- Uso limitato tier gratuito (generoso per sviluppo)
- Dati su server esterno (ma EU per GDPR)

---

**🎊 Il tuo ambiente WikiGaiaLab è pronto per lo sviluppo!**

**Next:** `pnpm dev` → http://localhost:3000