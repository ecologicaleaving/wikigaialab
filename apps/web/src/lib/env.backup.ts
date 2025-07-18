/**
 * Environment Configuration Utility
 * Centralizes environment variable handling with validation and type safety
 */

import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('WikiGaiaLab'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Authentication
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  MOCK_EMAIL_SERVICE: z.string().transform(val => val === 'true').default('false'),
  
  // Payments
  STRIPE_PUBLIC_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  MOCK_PAYMENT_SERVICE: z.string().transform(val => val === 'true').default('false'),
  
  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().default('G-XXXXXXXXXX'),
  SENTRY_DSN: z.string().url().optional(),
  
  // Feature Flags
  FEATURE_AI_INTEGRATION: z.string().transform(val => val === 'true').default('true'),
  FEATURE_PAYMENT_SYSTEM: z.string().transform(val => val === 'true').default('true'),
  FEATURE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  FEATURE_SOCIAL_SHARING: z.string().transform(val => val === 'true').default('true'),
  FEATURE_ADMIN_DASHBOARD: z.string().transform(val => val === 'true').default('true'),
  FEATURE_BETA_PROGRAMS: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val) || 100),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val) || 900000),
  CORS_ORIGINS: z.string().optional(),
  
  // Business Configuration
  PREMIUM_ACCESS_VOTE_THRESHOLD: z.string().transform(val => parseInt(val) || 5),
  CONTRIBUTOR_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 5),
  ADVOCATE_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 15),
  CHAMPION_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 25),
  PROBLEM_DEVELOPMENT_THRESHOLD: z.string().transform(val => parseInt(val) || 100),
  
  // Debug
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
  DEBUG_API_CALLS: z.string().transform(val => val === 'true').default('false'),
  DEBUG_DATABASE_QUERIES: z.string().transform(val => val === 'true').default('false'),
});

// Parse and validate environment variables
let env: z.infer<typeof envSchema>;

try {
  // Only validate the fields that are actually available in the current environment
  const availableEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) => value !== undefined)
  );
  
  env = envSchema.parse(availableEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Filter out missing server-side variables when running in browser
    const isBrowser = typeof window !== 'undefined';
    const serverOnlyVars = [
      'RATE_LIMIT_MAX_REQUESTS',
      'RATE_LIMIT_WINDOW_MS', 
      'PREMIUM_ACCESS_VOTE_THRESHOLD',
      'CONTRIBUTOR_LEVEL_VOTES',
      'ADVOCATE_LEVEL_VOTES',
      'CHAMPION_LEVEL_VOTES',
      'PROBLEM_DEVELOPMENT_THRESHOLD',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_CLIENT_SECRET',
      'NEXTAUTH_SECRET',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'RESEND_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'SENTRY_DSN'
    ];
    
    const filteredErrors = error.errors.filter(e => {
      const fieldName = e.path.join('.');
      return !isBrowser || !serverOnlyVars.includes(fieldName);
    });
    
    if (filteredErrors.length > 0) {
      console.error('❌ Environment validation failed:');
      console.error(filteredErrors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n'));
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed in production');
      } else {
        console.warn('⚠️  Continuing with default values in development');
      }
    }
    
    // Use defaults for development
    env = envSchema.parse({
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: 'WikiGaiaLab',
      NEXT_PUBLIC_SUPABASE_URL: 'https://jgivhyalioldfelngboi.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaXZoeWFsaW9sZGZlbG5nYm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY0NTIsImV4cCI6MjA2ODM0MjQ1Mn0.VKVoU56gdRccKj9NPFuRpLuwgRRUQ_HFe3QLzH5tFD0',
        RATE_LIMIT_MAX_REQUESTS: '100',
        RATE_LIMIT_WINDOW_MS: '900000',
        PREMIUM_ACCESS_VOTE_THRESHOLD: '5',
        CONTRIBUTOR_LEVEL_VOTES: '5',
        ADVOCATE_LEVEL_VOTES: '15',
        CHAMPION_LEVEL_VOTES: '25',
        PROBLEM_DEVELOPMENT_THRESHOLD: '100',
        MOCK_EMAIL_SERVICE: 'true',
        MOCK_PAYMENT_SERVICE: 'true'
      });
  } else {
    throw error;
  }
}

// Export typed environment object
export const config = env;

// Helper functions
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isStaging = config.NODE_ENV === 'staging';

// Feature flags
export const features = {
  aiIntegration: config.FEATURE_AI_INTEGRATION,
  paymentSystem: config.FEATURE_PAYMENT_SYSTEM,
  emailNotifications: config.FEATURE_EMAIL_NOTIFICATIONS,
  socialSharing: config.FEATURE_SOCIAL_SHARING,
  adminDashboard: config.FEATURE_ADMIN_DASHBOARD,
  betaPrograms: config.FEATURE_BETA_PROGRAMS,
} as const;

// Business configuration
export const businessConfig = {
  premiumAccess: {
    voteThreshold: config.PREMIUM_ACCESS_VOTE_THRESHOLD,
    levels: {
      contributor: config.CONTRIBUTOR_LEVEL_VOTES,
      advocate: config.ADVOCATE_LEVEL_VOTES,
      champion: config.CHAMPION_LEVEL_VOTES,
    },
  },
  problems: {
    developmentThreshold: config.PROBLEM_DEVELOPMENT_THRESHOLD,
  },
} as const;

// Security configuration
export const securityConfig = {
  rateLimit: {
    maxRequests: config.RATE_LIMIT_MAX_REQUESTS,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
  },
  cors: {
    origins: config.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'],
  },
} as const;

// Debug configuration
export const debugConfig = {
  enabled: config.DEBUG_MODE,
  apiCalls: config.DEBUG_API_CALLS,
  databaseQueries: config.DEBUG_DATABASE_QUERIES,
} as const;

// Service availability checks
export const serviceStatus = {
  supabase: !!(config.NEXT_PUBLIC_SUPABASE_URL && config.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  googleAuth: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET),
  openai: !!config.OPENAI_API_KEY,
  anthropic: !!config.ANTHROPIC_API_KEY,
  resend: !!config.RESEND_API_KEY,
  stripe: !!(config.STRIPE_PUBLIC_KEY && config.STRIPE_SECRET_KEY),
  analytics: config.NEXT_PUBLIC_GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX',
  sentry: !!config.SENTRY_DSN,
} as const;

// Mock service flags
export const mockServices = {
  email: config.MOCK_EMAIL_SERVICE,
  payment: config.MOCK_PAYMENT_SERVICE,
} as const;

// Environment validation helper
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required services for production
  if (isProduction) {
    if (!serviceStatus.supabase) {
      errors.push('Supabase configuration is required in production');
    }
    if (!serviceStatus.googleAuth && !mockServices.email) {
      errors.push('Google OAuth configuration is required in production');
    }
    if (!serviceStatus.resend && !mockServices.email) {
      errors.push('Email service configuration is required in production');
    }
    if (!serviceStatus.stripe && !mockServices.payment) {
      errors.push('Stripe configuration is required in production');
    }
    if (!serviceStatus.sentry) {
      errors.push('Sentry configuration is recommended in production');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Log environment status (development only)
if (isDevelopment && debugConfig.enabled) {
  console.log('🔧 Environment Configuration:');
  console.log(`  Mode: ${config.NODE_ENV}`);
  console.log(`  App URL: ${config.NEXT_PUBLIC_APP_URL}`);
  console.log('🔌 Service Status:');
  Object.entries(serviceStatus).forEach(([service, available]) => {
    console.log(`  ${service}: ${available ? '✅' : '❌'}`);
  });
  if (Object.values(mockServices).some(Boolean)) {
    console.log('🎭 Mock Services:');
    Object.entries(mockServices).forEach(([service, mocked]) => {
      if (mocked) console.log(`  ${service}: 🎭 mocked`);
    });
  }
  
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.warn('⚠️  Environment Issues:');
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
}