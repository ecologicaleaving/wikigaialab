#!/usr/bin/env node

/**
 * Script to generate TypeScript types from Supabase Cloud database
 * Since we're using cloud setup, we need to generate types remotely
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function generateTypes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
  }

  console.log('🚀 Generating TypeScript types from Supabase Cloud...');

  try {
    // Extract project ID from URL
    const projectId = supabaseUrl.replace('https://', '').split('.')[0];
    console.log(`📡 Project ID: ${projectId}`);

    // Generate types using supabase CLI with project ID
    const command = `supabase gen types typescript --project-id ${projectId} --schema public`;
    console.log(`⚡ Running: ${command}`);

    const types = execSync(command, { 
      encoding: 'utf8',
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: supabaseServiceKey
      }
    });

    // Write types to file
    const typesPath = path.join(__dirname, '../packages/database/src/types/supabase.ts');
    fs.writeFileSync(typesPath, types);

    console.log('✅ TypeScript types generated successfully');
    console.log(`📄 Types written to: ${typesPath}`);

    // Show preview of new types
    console.log('\n📋 New types preview:');
    const preview = types.split('\n').slice(0, 20).join('\n');
    console.log(preview + '\n...');

  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    
    // Fallback: manually update types
    console.log('\n🔧 Fallback: Creating manual type extensions...');
    await createManualTypes();
  }
}

async function createManualTypes() {
  const typesExtensionPath = path.join(__dirname, '../packages/database/src/types/content-management.ts');
  
  const manualTypes = `// Content Management Types Extension for Epic 3 Story 3.3
// Manual types for new schema additions

export interface ContentManagementTables {
  content_collections: {
    Row: {
      id: string;
      name: string;
      description: string | null;
      created_by: string;
      created_at: string;
      updated_at: string;
      is_active: boolean;
    };
    Insert: {
      id?: string;
      name: string;
      description?: string | null;
      created_by: string;
      created_at?: string;
      updated_at?: string;
      is_active?: boolean;
    };
    Update: {
      id?: string;
      name?: string;
      description?: string | null;
      created_by?: string;
      created_at?: string;
      updated_at?: string;
      is_active?: boolean;
    };
  };
  
  collection_problems: {
    Row: {
      collection_id: string;
      problem_id: string;
      added_at: string;
      added_by: string;
      display_order: number;
    };
    Insert: {
      collection_id: string;
      problem_id: string;
      added_at?: string;
      added_by: string;
      display_order?: number;
    };
    Update: {
      collection_id?: string;
      problem_id?: string;
      added_at?: string;
      added_by?: string;
      display_order?: number;
    };
  };
  
  category_analytics: {
    Row: {
      id: string;
      category_id: string;
      date: string;
      problems_added: number;
      total_votes: number;
      unique_voters: number;
      engagement_score: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      category_id: string;
      date: string;
      problems_added?: number;
      total_votes?: number;
      unique_voters?: number;
      engagement_score?: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      category_id?: string;
      date?: string;
      problems_added?: number;
      total_votes?: number;
      unique_voters?: number;
      engagement_score?: number;
      created_at?: string;
    };
  };
  
  admin_activity_log: {
    Row: {
      id: string;
      admin_id: string;
      action: string;
      resource_type: string;
      resource_id: string | null;
      details: any | null;
      ip_address: string | null;
      user_agent: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      admin_id: string;
      action: string;
      resource_type: string;
      resource_id?: string | null;
      details?: any | null;
      ip_address?: string | null;
      user_agent?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      admin_id?: string;
      action?: string;
      resource_type?: string;
      resource_id?: string | null;
      details?: any | null;
      ip_address?: string | null;
      user_agent?: string | null;
      created_at?: string;
    };
  };
}

// Enhanced existing table types with new columns
export interface EnhancedProblemRow {
  id: string;
  proposer_id: string;
  title: string;
  description: string;
  category_id: string;
  status: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
  // New content management fields
  moderation_status: string;
  moderation_notes: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  is_featured: boolean;
  featured_until: string | null;
}

export interface EnhancedCategoryRow {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New management fields
  icon_name: string;
  color_hex: string;
  keywords: string[] | null;
  problems_count: number;
  last_used_at: string | null;
}

// Admin types
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';
export type AdminAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'feature' | 'moderate';
export type ResourceType = 'problem' | 'category' | 'collection' | 'user';

// API response types
export interface ContentManagementStats {
  totalProblems: number;
  pendingModeration: number;
  featuredProblems: number;
  totalCategories: number;
  totalCollections: number;
  recentActivity: number;
}

export interface ModerationQueue {
  problems: EnhancedProblemRow[];
  totalCount: number;
  pendingCount: number;
}
`;

  fs.writeFileSync(typesExtensionPath, manualTypes);
  console.log(`✅ Manual types created at: ${typesExtensionPath}`);
}

// Execute type generation
generateTypes();