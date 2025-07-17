#!/usr/bin/env node

/**
 * WikiGaiaLab Development Environment Setup - No Docker Version
 * For macOS systems that cannot run Docker Desktop
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 WikiGaiaLab Setup (No Docker) per macOS 12\n');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
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
    
    // Check Homebrew
    try {
      execSync('brew --version', { encoding: 'utf8' });
      log('green', '✅ Homebrew disponibile');
    } catch (error) {
      log('red', '❌ Homebrew non trovato. Installa da https://brew.sh');
      log('yellow', 'Esegui: /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
      process.exit(1);
    }
    
  } catch (error) {
    log('red', `❌ Errore controllo prerequisiti: ${error.message}`);
    process.exit(1);
  }
}

function installPostgreSQL() {
  log('blue', '🐘 Installazione PostgreSQL locale...');
  
  try {
    // Check if PostgreSQL is already installed
    try {
      const pgVersion = execSync('postgres --version', { encoding: 'utf8' });
      log('green', `✅ PostgreSQL già installato: ${pgVersion.trim()}`);
      return;
    } catch (error) {
      // PostgreSQL not installed, proceed with installation
    }
    
    log('yellow', 'Installazione PostgreSQL via Homebrew...');
    execSync('brew install postgresql@15', { stdio: 'inherit' });
    
    log('yellow', 'Avvio servizio PostgreSQL...');
    execSync('brew services start postgresql@15', { stdio: 'inherit' });
    
    // Add to PATH
    log('yellow', 'Configurazione PATH...');
    const shellProfile = process.env.SHELL?.includes('zsh') ? '~/.zshrc' : '~/.bash_profile';
    const pathCommand = 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"';
    
    try {
      execSync(`echo '${pathCommand}' >> ${shellProfile}`, { stdio: 'inherit' });
      log('green', `✅ PATH aggiornato in ${shellProfile}`);
    } catch (error) {
      log('yellow', `⚠️  Aggiungi manualmente al tuo ${shellProfile}: ${pathCommand}`);
    }
    
    log('green', '✅ PostgreSQL installato e avviato');
    
  } catch (error) {
    log('red', `❌ Errore installazione PostgreSQL: ${error.message}`);
    process.exit(1);
  }
}

function createDatabase() {
  log('blue', '🗄️  Creazione database WikiGaiaLab...');
  
  try {
    // Create database user and database
    execSync('createdb wikigaialab_dev', { stdio: 'pipe' });
    log('green', '✅ Database wikigaialab_dev creato');
  } catch (error) {
    if (error.message.includes('already exists')) {
      log('yellow', '⚠️  Database wikigaialab_dev già esistente');
    } else {
      log('red', `❌ Errore creazione database: ${error.message}`);
      log('yellow', 'Prova manualmente: createdb wikigaialab_dev');
    }
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

function createEnvironmentFile() {
  log('blue', '⚙️  Creazione file di configurazione...');
  
  const envContent = `# WikiGaiaLab Development Environment Configuration
# Setup senza Docker per macOS 12

# Database Configuration (PostgreSQL locale)
DATABASE_URL="postgresql://$(whoami)@localhost:5432/wikigaialab_dev"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:3001"
NEXT_PUBLIC_SUPABASE_ANON_KEY="fake-anon-key-for-local-dev"
SUPABASE_SERVICE_KEY="fake-service-key-for-local-dev"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="WikiGaiaLab"
NEXT_PUBLIC_APP_DESCRIPTION="Community-driven problem solving platform"
NODE_ENV="development"
DEBUG="false"

# Authentication (Opzionale - per test Google OAuth)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="your-development-secret-min-32-chars"

# External APIs (Opzionale - per test)
# OPENAI_API_KEY="sk-test-key"
# ANTHROPIC_API_KEY="sk-ant-test-key"
# RESEND_API_KEY="re_test_key"

# Note: Questo setup usa PostgreSQL locale invece di Supabase
# Alcune funzionalità di Supabase (auth, realtime) saranno simulate
`;

  fs.writeFileSync('.env.local', envContent);
  log('green', '✅ File ambiente creato (.env.local)');
}

function setupDatabase() {
  log('blue', '🗃️  Setup schema database...');
  
  try {
    // Apply database schema using our migration files
    const migrationFiles = [
      'packages/database/src/migrations/001_initial_schema.sql',
      'packages/database/src/migrations/002_triggers.sql',
      'packages/database/src/migrations/004_seed_data.sql'
    ];
    
    migrationFiles.forEach(file => {
      if (fs.existsSync(file)) {
        log('yellow', `Applicazione ${file}...`);
        const sql = fs.readFileSync(file, 'utf8');
        
        // Remove Supabase-specific commands that won't work with regular PostgreSQL
        const cleanedSql = sql
          .replace(/-- Enable RLS.*$/gm, '')
          .replace(/ALTER TABLE.*ENABLE ROW LEVEL SECURITY;/g, '')
          .replace(/CREATE POLICY.*$/gm, '')
          .replace(/GRANT.*TO authenticated.*$/gm, '')
          .replace(/GRANT.*TO anon.*$/gm, '');
        
        // Save cleaned SQL to temp file
        const tempFile = '/tmp/wikigaialab_migration.sql';
        fs.writeFileSync(tempFile, cleanedSql);
        
        // Apply migration
        execSync(`psql wikigaialab_dev -f ${tempFile}`, { stdio: 'pipe' });
        
        // Clean up
        fs.unlinkSync(tempFile);
      }
    });
    
    log('green', '✅ Schema database applicato');
  } catch (error) {
    log('yellow', `⚠️  Errore setup database: ${error.message}`);
    log('yellow', 'Potrai configurarlo manualmente dopo');
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

function printSuccessMessage() {
  log('green', '\n🎉 Ambiente di sviluppo configurato con successo!\n');
  
  console.log(`${colors.blue}📋 Prossimi Passi:${colors.reset}

${colors.green}1. Avvia il server di sviluppo:${colors.reset}
   pnpm dev

${colors.green}2. Apri il browser:${colors.reset}
   http://localhost:3000

${colors.green}3. Database PostgreSQL locale:${colors.reset}
   psql wikigaialab_dev

${colors.blue}📚 Comandi Utili:${colors.reset}
   pnpm dev              # Avvia server di sviluppo
   pnpm test            # Esegui test
   pnpm run type-check  # Controllo TypeScript
   pnpm run lint        # Controllo codice
   psql wikigaialab_dev # Accedi al database

${colors.blue}🔧 URL di Sviluppo:${colors.reset}
   App:       http://localhost:3000
   Database:  postgresql://$(whoami)@localhost:5432/wikigaialab_dev

${colors.yellow}💡 Nota: Questo setup usa PostgreSQL locale invece di Supabase.
Alcune funzionalità avanzate di Supabase saranno simulate.${colors.reset}

${colors.green}🚀 Buon sviluppo con WikiGaiaLab!${colors.reset}
`);
}

// Main execution
async function main() {
  try {
    checkPrerequisites();
    installPostgreSQL();
    createDatabase();
    installDependencies();
    createEnvironmentFile();
    setupDatabase();
    runTests();
    printSuccessMessage();
  } catch (error) {
    log('red', `❌ Setup fallito: ${error.message}`);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('yellow', '\n⚠️  Setup interrotto. Potresti dover eseguire questo script di nuovo.');
  process.exit(1);
});

main();