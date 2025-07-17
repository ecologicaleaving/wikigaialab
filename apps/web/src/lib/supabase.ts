import { createClient } from '@supabase/supabase-js';
import { Database } from '@wikigaialab/database';

// Environment variables with proper validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client with proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'wikigaialab-web',
    },
  },
});

// Type exports for better TypeScript support
export type { Database } from '@wikigaialab/database';
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Utility types for insert and update operations
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Common table types
export type User = Tables<'users'>;
export type Problem = Tables<'problems'>;
export type Vote = Tables<'votes'>;
export type Category = Tables<'categories'>;

// Auth helper functions
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Database helper functions with proper error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>
) => {
  try {
    const result = await operation();
    if (result.error) {
      throw result.error;
    }
    return result.data;
  } catch (error) {
    throw error;
  }
};

// Connection health check
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    return { status: 'healthy', data };
  } catch (error) {
    return { status: 'unhealthy', error: error instanceof Error ? error : new Error('Unknown error') };
  }
};