#!/usr/bin/env node

/**
 * WikiGaiaLab Development Environment Setup - Supabase Cloud
 * Setup per sviluppo con database Supabase online (no Docker)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

console.log('🚀 WikiGaiaLab Setup con Supabase Cloud\n');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function checkPrerequisites() {
  log('blue', '📋 Controllo prerequisiti...');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      log('red', `❌ Node.js versione ${nodeVersion} troppo vecchia. Installa Node.js 18 o superiore.`);
      process.exit(1);
    }
    log('green', `✅ Node.js ${nodeVersion}`);
    
    // Check pnpm
    try {
      const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      log('green', `✅ pnpm ${pnpmVersion}`);
    } catch (error) {
      log('yellow', '⚠️  pnpm non trovato. Installazione...');
      execSync('npm install -g pnpm', { stdio: 'inherit' });
      log('green', '✅ pnpm installato');
    }
    
  } catch (error) {
    log('red', `❌ Errore controllo prerequisiti: ${error.message}`);
    process.exit(1);
  }
}

function installDependencies() {
  log('blue', '📦 Installazione dipendenze progetto...');
  
  try {
    execSync('pnpm install', { stdio: 'inherit' });
    log('green', '✅ Dipendenze installate con successo');
  } catch (error) {
    log('red', `❌ Errore installazione dipendenze: ${error.message}`);
    process.exit(1);
  }
}

async function getSupabaseCredentials() {
  log('blue', '🔧 Configurazione credenziali Supabase...\n');
  
  log('cyan', '📝 Hai bisogno di creare un progetto Supabase:');
  console.log(`${colors.yellow}1. Vai su https://supabase.com${colors.reset}`);
  console.log(`${colors.yellow}2. Crea un account o accedi${colors.reset}`);
  console.log(`${colors.yellow}3. Crea un nuovo progetto${colors.reset}`);
  console.log(`${colors.yellow}4. Vai su Settings > API${colors.reset}`);
  console.log(`${colors.yellow}5. Copia le credenziali${colors.reset}\n`);
  
  const projectUrl = await askQuestion(`${colors.blue}🔗 Project URL (es. https://xyz.supabase.co): ${colors.reset}`);
  const anonKey = await askQuestion(`${colors.blue}🔑 Anon Key (eyJ...): ${colors.reset}`);
  const serviceKey = await askQuestion(`${colors.blue}🔐 Service Role Key (eyJ...): ${colors.reset}`);
  
  // Basic validation
  if (!projectUrl.includes('supabase.co')) {
    log('red', '❌ URL del progetto non valido. Dovrebbe essere simile a https://xyz.supabase.co');
    process.exit(1);
  }
  
  if (!anonKey.startsWith('eyJ')) {
    log('red', '❌ Anon Key non valida. Dovrebbe iniziare con "eyJ"');
    process.exit(1);
  }
  
  if (!serviceKey.startsWith('eyJ')) {
    log('red', '❌ Service Role Key non valida. Dovrebbe iniziare con "eyJ"');
    process.exit(1);
  }
  
  return { projectUrl, anonKey, serviceKey };
}

function createEnvironmentFile(credentials) {
  log('blue', '⚙️  Creazione file di configurazione...');
  
  const envContent = `# WikiGaiaLab Development Environment Configuration
# Setup con Supabase Cloud

# Database Configuration (Supabase Cloud)
DATABASE_URL="${credentials.projectUrl.replace('https://', 'postgresql://postgres:[YOUR-PASSWORD]@').replace('.supabase.co', '.pooler.supabase.com:5432/postgres')}"
NEXT_PUBLIC_SUPABASE_URL="${credentials.projectUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${credentials.anonKey}"
SUPABASE_SERVICE_KEY="${credentials.serviceKey}"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WikiGaiaLab"
NEXT_PUBLIC_APP_DESCRIPTION="Community-driven problem solving platform"
NODE_ENV="development"
DEBUG="false"

# Authentication (Google OAuth - opzionale)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-development-secret-min-32-chars"

# External APIs (Opzionale - per test)
# OPENAI_API_KEY="sk-test-key"
# ANTHROPIC_API_KEY="sk-ant-test-key"
# RESEND_API_KEY="re_test_key"

# Payment Processing (Opzionale - per test)
# STRIPE_PUBLIC_KEY="pk_test_..."
# STRIPE_SECRET_KEY="sk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_test_..."
`;

  fs.writeFileSync('.env.local', envContent);
  log('green', '✅ File ambiente creato (.env.local)');
}

async function setupDatabase() {
  log('blue', '🗃️  Setup schema database Supabase...');
  
  log('cyan', '\n📋 Per configurare il database:');
  console.log(`${colors.yellow}1. Vai al tuo progetto Supabase${colors.reset}`);
  console.log(`${colors.yellow}2. Vai su SQL Editor${colors.reset}`);
  console.log(`${colors.yellow}3. Esegui i seguenti file SQL in ordine:${colors.reset}`);
  console.log(`   - packages/database/src/migrations/001_initial_schema.sql`);
  console.log(`   - packages/database/src/migrations/002_triggers.sql`);
  console.log(`   - packages/database/src/migrations/003_rls_policies.sql`);
  console.log(`   - packages/database/src/migrations/004_seed_data.sql`);
  
  const proceed = await askQuestion(`\n${colors.blue}✅ Hai eseguito gli script SQL? (y/n): ${colors.reset}`);
  
  if (proceed.toLowerCase() !== 'y') {
    log('yellow', '⚠️  Ricordati di eseguire gli script SQL prima di usare l\'app');
  } else {
    log('green', '✅ Setup database completato');
  }
}

function runTests() {
  log('blue', '🧪 Esecuzione test iniziali...');
  
  try {
    // Type checking
    execSync('pnpm run type-check', { stdio: 'inherit' });
    log('green', '✅ Compilazione TypeScript riuscita');
    
    // Linting
    execSync('pnpm run lint', { stdio: 'inherit' });
    log('green', '✅ Linting superato');
    
  } catch (error) {
    log('yellow', `⚠️  Alcuni test falliti: ${error.message}`);
    log('yellow', 'Potrai risolvere questi problemi dopo');
  }
}

function printSuccessMessage(credentials) {
  log('green', '\n🎉 Ambiente di sviluppo configurato con successo!\n');
  
  console.log(`${colors.blue}📋 Prossimi Passi:${colors.reset}

${colors.green}1. Configura Google OAuth (opzionale):${colors.reset}
   - Vai su Google Cloud Console
   - Crea credenziali OAuth 2.0
   - Aggiungi a .env.local

${colors.green}2. Avvia il server di sviluppo:${colors.reset}
   pnpm dev

${colors.green}3. Apri il browser:${colors.reset}
   http://localhost:3000

${colors.blue}📚 Comandi Utili:${colors.reset}
   pnpm dev              # Avvia server di sviluppo
   pnpm test            # Esegui test
   pnpm run type-check  # Controllo TypeScript
   pnpm run lint        # Controllo codice

${colors.blue}🔧 URL di Sviluppo:${colors.reset}
   App:           http://localhost:3000
   Supabase:      ${credentials.projectUrl}
   Database:      Supabase Dashboard > Table Editor

${colors.blue}📁 File SQL da eseguire in Supabase:${colors.reset}
   1. packages/database/src/migrations/001_initial_schema.sql
   2. packages/database/src/migrations/002_triggers.sql  
   3. packages/database/src/migrations/003_rls_policies.sql
   4. packages/database/src/migrations/004_seed_data.sql

${colors.green}🚀 Buon sviluppo con WikiGaiaLab!${colors.reset}
`);
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    installDependencies();
    const credentials = await getSupabaseCredentials();
    createEnvironmentFile(credentials);
    await setupDatabase();
    runTests();
    printSuccessMessage(credentials);
  } catch (error) {
    log('red', `❌ Setup fallito: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('yellow', '\n⚠️  Setup interrotto.');
  rl.close();
  process.exit(1);
});

main();