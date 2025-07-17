import { supabase, checkDatabaseConnection } from '@/lib/supabase';

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  })),
}));

describe('Supabase Client', () => {
  beforeAll(() => {
    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should create supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should perform database health check', async () => {
    const result = await checkDatabaseConnection();
    expect(result).toBeDefined();
    expect(result.status).toBe('healthy');
  });

  it('should throw error when environment variables are missing', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    expect(() => {
      // This would trigger the module to re-evaluate
      jest.resetModules();
      require('@/lib/supabase');
    }).toThrow('Missing required environment variables');
    
    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });
});