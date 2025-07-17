// Content Management Types Extension for Epic 3 Story 3.3
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
