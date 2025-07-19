/**
 * REFACTORED: Optimized Environment Configuration
 * 
 * Performance improvements:
 * - Separated client vs server validation
 * - Removed complex fallback chains
 * - Simplified validation logic
 * - Faster startup through lazy loading
 */

import { z } from 'zod';

// Client-side only schema (available in browser)
const clientSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().default('WikiGaiaLab'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().default('G-XXXXXXXXXX'),
});

// Server-side only schema (only available on server)
const serverSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val) || 100).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val) || 900000).default('900000'),
  PREMIUM_ACCESS_VOTE_THRESHOLD: z.string().transform(val => parseInt(val) || 5).default('5'),
  CONTRIBUTOR_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 5).default('5'),
  ADVOCATE_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 15).default('15'),
  CHAMPION_LEVEL_VOTES: z.string().transform(val => parseInt(val) || 25).default('25'),
  PROBLEM_DEVELOPMENT_THRESHOLD: z.string().transform(val => parseInt(val) || 100).default('100'),
});

// Lazy validation - only run when needed
let clientConfig: z.infer<typeof clientSchema> | null = null;
let serverConfig: z.infer<typeof serverSchema> | null = null;

function validateClientConfig(): z.infer<typeof clientSchema> {
  if (clientConfig) return clientConfig;
  
  try {
    clientConfig = clientSchema.parse({
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    });
    return clientConfig;
  } catch (error) {
    if (typeof window !== 'undefined') {
      // In browser, only warn about missing client variables
      console.warn('⚠️ Client environment validation failed, using defaults. Check your .env.local file.');
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          console.warn(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
    }
    // Return safe defaults that won't break the app
    clientConfig = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'WikiGaiaLab',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    };
    return clientConfig;
  }
}

function validateServerConfig(): z.infer<typeof serverSchema> {
  if (serverConfig) return serverConfig;
  
  // Only validate server config on the server-side
  if (typeof window !== 'undefined') {
    // Return defaults for client-side access
    serverConfig = {
      DATABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      RATE_LIMIT_MAX_REQUESTS: 100,
      RATE_LIMIT_WINDOW_MS: 900000,
      PREMIUM_ACCESS_VOTE_THRESHOLD: 5,
      CONTRIBUTOR_LEVEL_VOTES: 5,
      ADVOCATE_LEVEL_VOTES: 15,
      CHAMPION_LEVEL_VOTES: 25,
      PROBLEM_DEVELOPMENT_THRESHOLD: 100,
    };
    return serverConfig;
  }
  
  try {
    serverConfig = serverSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
      PREMIUM_ACCESS_VOTE_THRESHOLD: process.env.PREMIUM_ACCESS_VOTE_THRESHOLD || '5',
      CONTRIBUTOR_LEVEL_VOTES: process.env.CONTRIBUTOR_LEVEL_VOTES || '5',
      ADVOCATE_LEVEL_VOTES: process.env.ADVOCATE_LEVEL_VOTES || '15',
      CHAMPION_LEVEL_VOTES: process.env.CHAMPION_LEVEL_VOTES || '25',
      PROBLEM_DEVELOPMENT_THRESHOLD: process.env.PROBLEM_DEVELOPMENT_THRESHOLD || '100',
    });
    return serverConfig;
  } catch (error) {
    console.warn('⚠️ Server environment validation failed, using defaults. Check your .env.local file.');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.warn(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    serverConfig = {
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      RATE_LIMIT_MAX_REQUESTS: 100,
      RATE_LIMIT_WINDOW_MS: 900000,
      PREMIUM_ACCESS_VOTE_THRESHOLD: 5,
      CONTRIBUTOR_LEVEL_VOTES: 5,
      ADVOCATE_LEVEL_VOTES: 15,
      CHAMPION_LEVEL_VOTES: 25,
      PROBLEM_DEVELOPMENT_THRESHOLD: 100,
    };
    return serverConfig;
  }
}

// Smart config getter - only validates what's needed
export const config = new Proxy({} as any, {
  get(target, prop) {
    const key = prop as string;
    
    // Client-side variables
    if (key.startsWith('NEXT_PUBLIC_') || key === 'NODE_ENV') {
      const clientConfig = validateClientConfig();
      return clientConfig[key as keyof typeof clientConfig];
    }
    
    // Server-side variables - provide defaults for client-side access
    if (typeof window === 'undefined') {
      const serverConfig = validateServerConfig();
      return serverConfig[key as keyof typeof serverConfig];
    } else {
      // Client-side access to server variables - return safe defaults
      const serverDefaults: Record<string, any> = {
        RATE_LIMIT_MAX_REQUESTS: 100,
        RATE_LIMIT_WINDOW_MS: 900000,
        PREMIUM_ACCESS_VOTE_THRESHOLD: 5,
        CONTRIBUTOR_LEVEL_VOTES: 5,
        ADVOCATE_LEVEL_VOTES: 15,
        CHAMPION_LEVEL_VOTES: 25,
        PROBLEM_DEVELOPMENT_THRESHOLD: 100,
      };
      
      if (serverDefaults[key] !== undefined) {
        return serverDefaults[key];
      }
    }
    
    // Fallback
    return process.env[key];
  }
});

// Backward compatibility exports
export const debugConfig = {
  DEBUG_MODE: config.DEBUG_MODE || false,
  DEBUG_API_CALLS: config.DEBUG_API_CALLS || false,
  DEBUG_DATABASE_QUERIES: config.DEBUG_DATABASE_QUERIES || false,
};

export const securityConfig = {
  RATE_LIMIT_MAX_REQUESTS: config.RATE_LIMIT_MAX_REQUESTS || 100,
  RATE_LIMIT_WINDOW_MS: config.RATE_LIMIT_WINDOW_MS || 900000,
  CORS_ORIGINS: config.CORS_ORIGINS || '',
};

export default config;