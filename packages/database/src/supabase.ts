import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Enhanced TypeScript types for WikiGaiaLab database schema
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          auth_provider: string;
          created_at: string;
          last_login_at: string;
          total_votes_cast: number;
          total_problems_proposed: number;
          is_admin: boolean;
          stripe_customer_id: string | null;
          subscription_status: 'free' | 'active' | 'cancelled' | 'trialing';
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          created_at?: string;
          last_login_at?: string;
          total_votes_cast?: number;
          total_problems_proposed?: number;
          is_admin?: boolean;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'active' | 'cancelled' | 'trialing';
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          auth_provider?: string;
          created_at?: string;
          last_login_at?: string;
          total_votes_cast?: number;
          total_problems_proposed?: number;
          is_admin?: boolean;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'active' | 'cancelled' | 'trialing';
          updated_at?: string;
        };
      };
      problems: {
        Row: {
          id: string;
          proposer_id: string;
          title: string;
          description: string;
          category_id: string;
          status: 'Proposed' | 'In Development' | 'Completed';
          vote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposer_id: string;
          title: string;
          description: string;
          category_id: string;
          status?: 'Proposed' | 'In Development' | 'Completed';
          vote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposer_id?: string;
          title?: string;
          description?: string;
          category_id?: string;
          status?: 'Proposed' | 'In Development' | 'Completed';
          vote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          user_id: string;
          problem_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          problem_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          problem_id?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      apps: {
        Row: {
          id: string;
          problem_id: string;
          name: string;
          description: string | null;
          base_features: unknown; // JSONB
          premium_features: unknown; // JSONB
          access_model: 'freemium' | 'subscription' | 'one-time';
          slug: string;
          is_published: boolean;
          version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          name: string;
          description?: string | null;
          base_features?: unknown;
          premium_features?: unknown;
          access_model?: 'freemium' | 'subscription' | 'one-time';
          slug: string;
          is_published?: boolean;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          problem_id?: string;
          name?: string;
          description?: string | null;
          base_features?: unknown;
          premium_features?: unknown;
          access_model?: 'freemium' | 'subscription' | 'one-time';
          slug?: string;
          is_published?: boolean;
          version?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      problem_status: 'Proposed' | 'In Development' | 'Completed';
      subscription_status: 'free' | 'active' | 'cancelled' | 'trialing';
      access_model: 'freemium' | 'subscription' | 'one-time';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};