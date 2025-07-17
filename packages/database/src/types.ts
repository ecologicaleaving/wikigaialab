/**
 * Database types and interfaces for WikiGaiaLab
 * 
 * This file defines TypeScript types for database entities and operations.
 * These types provide better developer experience and type safety.
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import type { Database } from './supabase';

// Re-export table types for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Problem = Database['public']['Tables']['problems']['Row'];
export type ProblemInsert = Database['public']['Tables']['problems']['Insert'];
export type ProblemUpdate = Database['public']['Tables']['problems']['Update'];

export type Vote = Database['public']['Tables']['votes']['Row'];
export type VoteInsert = Database['public']['Tables']['votes']['Insert'];
export type VoteUpdate = Database['public']['Tables']['votes']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type App = Database['public']['Tables']['apps']['Row'];
export type AppInsert = Database['public']['Tables']['apps']['Insert'];
export type AppUpdate = Database['public']['Tables']['apps']['Update'];

// Enum types
export type ProblemStatus = Database['public']['Enums']['problem_status'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
export type AccessModel = Database['public']['Enums']['access_model'];

// Extended types for better usability
export interface UserProfile extends User {
  problems?: Problem[];
  votes?: Vote[];
  votedProblems?: Problem[];
}

export interface ProblemWithDetails extends Problem {
  proposer?: User;
  category?: Category;
  votes?: Vote[];
  voters?: User[];
  hasUserVoted?: boolean;
  apps?: App[];
}

export interface CategoryWithStats extends Category {
  problemCount?: number;
  problems?: Problem[];
}

export interface AppWithDetails extends App {
  problem?: Problem;
  baseFeatures?: string[];
  premiumFeatures?: string[];
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Query filter types
export interface ProblemFilters {
  category?: string;
  status?: ProblemStatus;
  search?: string;
  proposer?: string;
  minVotes?: number;
  maxVotes?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProblemSortOptions {
  field: 'created_at' | 'updated_at' | 'vote_count' | 'title';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// Voting types
export interface VotingResult {
  success: boolean;
  newVoteCount: number;
  hasVoted: boolean;
  error?: string;
}

// User statistics
export interface UserStats {
  totalVotesCast: number;
  totalProblemsProposed: number;
  joinedAt: string;
  lastActive: string;
  subscriptionStatus: SubscriptionStatus;
}

// App feature types (shared with validation)
export interface AppFeature {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
}

export interface AppFeatures {
  base: AppFeature[];
  premium: AppFeature[];
}

// Database operation types (shared with validation)
export interface DatabaseOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

// Real-time subscription types (shared with validation)
export interface RealtimeEvent<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  old?: T;
  new?: T;
  timestamp: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Search types
export interface SearchResult {
  problems: Problem[];
  users: User[];
  categories: Category[];
  apps: App[];
  totalResults: number;
}

// Export utility types
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;
export type TableRow<T extends TableName> = Tables[T]['Row'];
export type TableInsert<T extends TableName> = Tables[T]['Insert'];
export type TableUpdate<T extends TableName> = Tables[T]['Update'];