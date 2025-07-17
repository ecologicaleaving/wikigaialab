#!/usr/bin/env node

/**
 * WikiGaiaLab Security Audit Script
 * Performs comprehensive security checks on the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
    this.projectRoot = path.join(__dirname, '..');
  }

  log(type, category, message, details = null) {
    const entry = {
      type,
      category,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    switch (type) {
      case 'error':
        this.issues.push(entry);
        console.error(`❌ [${category}] ${message}`);
        if (details) console.error(`   ${details}`);
        break;
      case 'warning':
        this.warnings.push(entry);
        console.warn(`⚠️  [${category}] ${message}`);
        if (details) console.warn(`   ${details}`);
        break;
      case 'pass':
        this.passed.push(entry);
        console.log(`✅ [${category}] ${message}`);
        break;
      default:
        console.log(`ℹ️  [${category}] ${message}`);
    }
  }

  // Check for hardcoded secrets
  checkHardcodedSecrets() {
    console.log('\n🔍 Checking for hardcoded secrets...');
    
    const secretPatterns = [
      { name: 'API Keys', pattern: /['"](sk-[a-zA-Z0-9]{20,}|pk_[a-zA-Z0-9]{20,}|re_[a-zA-Z0-9]{20,})['"]/ },
      { name: 'JWT Secrets', pattern: /['"](ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]{10,}|ey[A-Za-z0-9_=]{10,})['"]/ },
      { name: 'Database URLs', pattern: /['"](postgres:\/\/|mongodb:\/\/|mysql:\/\/)[^'"]*['"]/ },
      { name: 'Generic Secrets', pattern: /['"](secret|password|token)['"]\s*:\s*['"][^'"]{10,}['"]/ },
      { name: 'Google Keys', pattern: /['"](AIza[0-9A-Za-z_-]{35})['"]/ },
    ];

    const filesToCheck = this.findFiles(['.ts', '.tsx', '.js', '.jsx'], ['node_modules', '.next', 'dist']);
    let secretsFound = false;

    filesToCheck.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      secretPatterns.forEach(({ name, pattern }) => {
        const matches = content.match(pattern);
        if (matches) {
          // Skip if it's in a comment or example
          const lines = content.split('\n');
          matches.forEach(match => {
            const lineIndex = lines.findIndex(line => line.includes(match));
            const line = lines[lineIndex];
            
            // Skip comments and examples
            if (!line.includes('//') && !line.includes('example') && !line.includes('placeholder')) {
              this.log('error', 'SECRETS', `Potential ${name} found in ${filePath}`, match);
              secretsFound = true;
            }
          });
        }
      });
    });

    if (!secretsFound) {
      this.log('pass', 'SECRETS', 'No hardcoded secrets detected');
    }
  }

  // Check environment configuration
  checkEnvironmentConfig() {
    console.log('\n🔍 Checking environment configuration...');
    
    const envExample = path.join(this.projectRoot, '.env.example');
    const envLocalExample = path.join(this.projectRoot, '.env.local.example');
    
    if (fs.existsSync(envExample)) {
      this.log('pass', 'ENV', 'Environment example file exists');
    } else {
      this.log('error', 'ENV', 'Missing .env.example file');
    }
    
    if (fs.existsSync(envLocalExample)) {
      this.log('pass', 'ENV', 'Local environment example file exists');
    } else {
      this.log('warning', 'ENV', 'Missing .env.local.example file');
    }

    // Check if .env files are in .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      if (gitignoreContent.includes('.env.local') || gitignoreContent.includes('.env')) {
        this.log('pass', 'ENV', 'Environment files are properly gitignored');
      } else {
        this.log('error', 'ENV', 'Environment files should be added to .gitignore');
      }
    }
  }

  // Check dependency vulnerabilities
  checkDependencyVulnerabilities() {
    console.log('\n🔍 Checking dependency vulnerabilities...');
    
    try {
      // Check if package-lock.json or pnpm-lock.yaml exists
      const lockFiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
      const lockFile = lockFiles.find(file => 
        fs.existsSync(path.join(this.projectRoot, file))
      );
      
      if (lockFile) {
        this.log('pass', 'DEPS', `Lock file found: ${lockFile}`);
      } else {
        this.log('warning', 'DEPS', 'No lock file found - run npm/pnpm/yarn install');
      }

      // Run npm audit (if npm is available)
      try {
        const auditResult = execSync('npm audit --json', { 
          cwd: this.projectRoot,
          stdio: 'pipe',
          timeout: 30000 
        }).toString();
        
        const audit = JSON.parse(auditResult);
        
        if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
          const critical = Object.values(audit.vulnerabilities).filter(v => v.severity === 'critical').length;
          const high = Object.values(audit.vulnerabilities).filter(v => v.severity === 'high').length;
          const moderate = Object.values(audit.vulnerabilities).filter(v => v.severity === 'moderate').length;
          
          if (critical > 0) {
            this.log('error', 'DEPS', `${critical} critical vulnerability(s) found`);
          }
          if (high > 0) {
            this.log('error', 'DEPS', `${high} high severity vulnerability(s) found`);
          }
          if (moderate > 0) {
            this.log('warning', 'DEPS', `${moderate} moderate vulnerability(s) found`);
          }
        } else {
          this.log('pass', 'DEPS', 'No known vulnerabilities found');
        }
      } catch (error) {
        this.log('warning', 'DEPS', 'Could not run npm audit', error.message);
      }
    } catch (error) {
      this.log('warning', 'DEPS', 'Error checking dependencies', error.message);
    }
  }

  // Check API security
  checkApiSecurity() {
    console.log('\n🔍 Checking API security...');
    
    const apiFiles = this.findFiles(['.ts'], ['node_modules'], 'src/app/api');
    let securityIssues = false;

    apiFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for authentication
      if (!content.includes('auth') && !content.includes('session')) {
        this.log('warning', 'API', `No authentication found in ${filePath}`);
        securityIssues = true;
      }
      
      // Check for rate limiting
      if (!content.includes('rateLimit') && !content.includes('rate-limit')) {
        this.log('warning', 'API', `No rate limiting found in ${filePath}`);
        securityIssues = true;
      }
      
      // Check for input validation
      if (!content.includes('validate') && !content.includes('zod') && !content.includes('joi')) {
        this.log('warning', 'API', `No input validation found in ${filePath}`);
        securityIssues = true;
      }
      
      // Check for error handling
      if (!content.includes('try') && !content.includes('catch')) {
        this.log('warning', 'API', `No error handling found in ${filePath}`);
        securityIssues = true;
      }
    });

    if (!securityIssues) {
      this.log('pass', 'API', 'API security checks passed');
    }
  }

  // Check for console.log statements
  checkConsoleStatements() {
    console.log('\n🔍 Checking for console statements...');
    
    const files = this.findFiles(['.ts', '.tsx', '.js', '.jsx'], ['node_modules', '.next']);
    let consoleFound = false;

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
          // Skip if commented out
          if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            this.log('warning', 'CODE', `Console statement found in ${filePath}:${index + 1}`, line.trim());
            consoleFound = true;
          }
        }
      });
    });

    if (!consoleFound) {
      this.log('pass', 'CODE', 'No console statements found');
    }
  }

  // Check TypeScript configuration
  checkTypeScriptConfig() {
    console.log('\n🔍 Checking TypeScript configuration...');
    
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      this.log('pass', 'TS', 'TypeScript configuration found');
      
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      
      // Check strict mode
      if (tsconfig.compilerOptions?.strict) {
        this.log('pass', 'TS', 'TypeScript strict mode enabled');
      } else {
        this.log('warning', 'TS', 'TypeScript strict mode should be enabled');
      }
      
      // Check noImplicitAny
      if (tsconfig.compilerOptions?.noImplicitAny !== false) {
        this.log('pass', 'TS', 'noImplicitAny is properly configured');
      } else {
        this.log('warning', 'TS', 'noImplicitAny should not be disabled');
      }
    } else {
      this.log('error', 'TS', 'TypeScript configuration not found');
    }
  }

  // Check for TODO/FIXME comments
  checkTodoComments() {
    console.log('\n🔍 Checking for TODO/FIXME comments...');
    
    const files = this.findFiles(['.ts', '.tsx', '.js', '.jsx'], ['node_modules', '.next']);
    let todosFound = false;

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('TODO') || line.includes('FIXME') || line.includes('HACK')) {
          this.log('warning', 'CODE', `TODO/FIXME found in ${filePath}:${index + 1}`, line.trim());
          todosFound = true;
        }
      });
    });

    if (!todosFound) {
      this.log('pass', 'CODE', 'No TODO/FIXME comments found');
    }
  }

  // Helper method to find files
  findFiles(extensions, excludeDirs = [], searchDir = null) {
    const files = [];
    const startDir = searchDir ? path.join(this.projectRoot, searchDir) : this.projectRoot;
    
    if (!fs.existsSync(startDir)) {
      return files;
    }

    const walk = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        // Skip excluded directories
        if (excludeDirs.some(exclude => relativePath.includes(exclude))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    walk(startDir);
    return files;
  }

  // Generate report
  generateReport() {
    console.log('\n📊 Security Audit Report');
    console.log('========================');
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Issues: ${this.issues.length}`);
    
    if (this.issues.length === 0) {
      console.log('\n🎉 No critical security issues found!');
    } else {
      console.log('\n🚨 Critical issues that need immediate attention:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.category}] ${issue.message}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings to address:');
      this.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.category}] ${warning.message}`);
      });
      
      if (this.warnings.length > 10) {
        console.log(`... and ${this.warnings.length - 10} more warnings`);
      }
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.passed.length,
        warnings: this.warnings.length,
        issues: this.issues.length,
      },
      details: {
        passed: this.passed,
        warnings: this.warnings,
        issues: this.issues,
      },
    };

    const reportPath = path.join(this.projectRoot, 'security-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return this.issues.length === 0;
  }

  // Run all security checks
  async runAudit() {
    console.log('🔒 WikiGaiaLab Security Audit Starting...\n');
    
    this.checkHardcodedSecrets();
    this.checkEnvironmentConfig();
    this.checkDependencyVulnerabilities();
    this.checkApiSecurity();
    this.checkConsoleStatements();
    this.checkTypeScriptConfig();
    this.checkTodoComments();
    
    return this.generateReport();
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Security audit failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityAuditor;