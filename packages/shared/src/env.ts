import { z } from 'zod';

// Environment validation schema with proper optional handling
const envSchema = z.object({
  // Database (required)
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required').optional(),

  // Authentication (optional in development)
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google client ID is required').optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google client secret is required').optional(),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL').optional(),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters').optional(),

  // Payments (optional in development)
  STRIPE_PUBLIC_KEY: z.string().startsWith('pk_', 'Invalid Stripe public key').optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret').optional(),

  // AI Services (optional in development)
  OPENAI_API_KEY: z.string().startsWith('sk-', 'Invalid OpenAI API key').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'Invalid Anthropic API key').optional(),

  // Email (optional in development)
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key').optional(),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'App name is required').default('WikiGaiaLab'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('Community-driven problem solving platform'),

  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  DEBUG: z.string().optional().transform((val) => val === 'true'),
});

// Runtime environment validation
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: (err as any).input
      }));
      
      return {
        success: false,
        data: null,
        error: {
          type: 'validation',
          issues: formattedErrors
        }
      };
    }
    
    return {
      success: false,
      data: null,
      error: {
        type: 'unknown',
        message: 'Unknown environment validation error'
      }
    };
  }
}

// Export validated environment variables
export const env = validateEnv();

// Environment validation error handler
export function handleEnvError(error: any) {
  console.error('🚨 Environment validation failed:');
  
  if (error.type === 'validation') {
    error.issues.forEach((issue: any) => {
      console.error(`  - ${issue.field}: ${issue.message}`);
    });
    
    console.error('\n💡 Please check your .env.local file and ensure all required variables are set.');
    console.error('📝 Refer to .env.local.example for the expected format.');
  } else {
    console.error(`  - ${error.message}`);
  }
  
  process.exit(1);
}

// Validate environment on module load (only in Node.js environment)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined' && !env.success) {
  handleEnvError(env.error);
}

// Export type for TypeScript
export type Env = z.infer<typeof envSchema>;

// Client-side safe environment variables
export const clientEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NODE_ENV: process.env.NODE_ENV,
};