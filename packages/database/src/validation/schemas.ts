/**
 * Zod validation schemas for database entities
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { z } from 'zod';

// Common validation patterns
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().min(1).max(255);
const timestampSchema = z.string().datetime();
const nameSchema = z.string().min(2).max(100);
const descriptionSchema = z.string().min(10).max(1000);
const titleSchema = z.string().min(5).max(100);
const slugSchema = z.string().regex(/^[a-z0-9-]+$/);
const versionSchema = z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/);

// User validation schemas
export const userInsertSchema = z.object({
  id: uuidSchema.optional(),
  email: emailSchema,
  name: nameSchema.optional(),
  avatar_url: z.string().url().optional(),
  auth_provider: z.string().default('google'),
  created_at: timestampSchema.optional(),
  last_login_at: timestampSchema.optional(),
  total_votes_cast: z.number().int().min(0).default(0),
  total_problems_proposed: z.number().int().min(0).default(0),
  is_admin: z.boolean().default(false),
  stripe_customer_id: z.string().optional(),
  subscription_status: z.enum(['free', 'active', 'cancelled', 'trialing']).default('free'),
  updated_at: timestampSchema.optional(),
});

export const userUpdateSchema = z.object({
  email: emailSchema.optional(),
  name: nameSchema.optional(),
  avatar_url: z.string().url().optional(),
  auth_provider: z.string().optional(),
  last_login_at: timestampSchema.optional(),
  total_votes_cast: z.number().int().min(0).optional(),
  total_problems_proposed: z.number().int().min(0).optional(),
  is_admin: z.boolean().optional(),
  stripe_customer_id: z.string().optional(),
  subscription_status: z.enum(['free', 'active', 'cancelled', 'trialing']).optional(),
  updated_at: timestampSchema.optional(),
});

// Problem validation schemas
export const problemInsertSchema = z.object({
  id: uuidSchema.optional(),
  proposer_id: uuidSchema,
  title: titleSchema,
  description: descriptionSchema,
  category_id: uuidSchema,
  status: z.enum(['Proposed', 'In Development', 'Completed']).default('Proposed'),
  vote_count: z.number().int().min(0).default(1),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

export const problemUpdateSchema = z.object({
  proposer_id: uuidSchema.optional(),
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  category_id: uuidSchema.optional(),
  status: z.enum(['Proposed', 'In Development', 'Completed']).optional(),
  vote_count: z.number().int().min(0).optional(),
  updated_at: timestampSchema.optional(),
});

// Vote validation schemas
export const voteInsertSchema = z.object({
  user_id: uuidSchema,
  problem_id: uuidSchema,
  created_at: timestampSchema.optional(),
});

// Category validation schemas
export const categoryInsertSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  order_index: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  updated_at: timestampSchema.optional(),
});

// App validation schemas
export const appInsertSchema = z.object({
  id: uuidSchema.optional(),
  problem_id: uuidSchema,
  name: nameSchema,
  description: z.string().max(1000).optional(),
  base_features: z.array(z.string()).default([]),
  premium_features: z.array(z.string()).default([]),
  access_model: z.enum(['freemium', 'subscription', 'one-time']).default('freemium'),
  slug: slugSchema,
  is_published: z.boolean().default(false),
  version: versionSchema.default('1.0.0'),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
});

export const appUpdateSchema = z.object({
  problem_id: uuidSchema.optional(),
  name: nameSchema.optional(),
  description: z.string().max(1000).optional(),
  base_features: z.array(z.string()).optional(),
  premium_features: z.array(z.string()).optional(),
  access_model: z.enum(['freemium', 'subscription', 'one-time']).optional(),
  slug: slugSchema.optional(),
  is_published: z.boolean().optional(),
  version: versionSchema.optional(),
  updated_at: timestampSchema.optional(),
});

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const problemFiltersSchema = z.object({
  category: uuidSchema.optional(),
  status: z.enum(['Proposed', 'In Development', 'Completed']).optional(),
  search: z.string().max(100).optional(),
  proposer: uuidSchema.optional(),
  minVotes: z.number().int().min(0).optional(),
  maxVotes: z.number().int().min(0).optional(),
  dateFrom: timestampSchema.optional(),
  dateTo: timestampSchema.optional(),
});

export const problemSortSchema = z.object({
  field: z.enum(['created_at', 'updated_at', 'vote_count', 'title']).default('created_at'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(50).default(20),
});

// API response validation schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  count: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

// Validation error schema
export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

// Voting operation schemas
export const voteOperationSchema = z.object({
  userId: uuidSchema,
  problemId: uuidSchema,
});

export const votingResultSchema = z.object({
  success: z.boolean(),
  newVoteCount: z.number().int().min(0),
  hasVoted: z.boolean(),
  error: z.string().optional(),
});

// App feature schemas
export const appFeatureSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  isPremium: z.boolean(),
});

export const appFeaturesSchema = z.object({
  base: z.array(appFeatureSchema),
  premium: z.array(appFeatureSchema),
});

// Real-time event schemas
export const realtimeEventSchema = z.object({
  eventType: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  table: z.string(),
  old: z.unknown().optional(),
  new: z.unknown().optional(),
  timestamp: timestampSchema,
});

// Database operation result schema
export const databaseOperationResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  affectedRows: z.number().int().optional(),
});

// Export validation schemas (types are in ../types.ts to avoid duplication)
export type ValidationUserInsert = z.infer<typeof userInsertSchema>;
export type ValidationUserUpdate = z.infer<typeof userUpdateSchema>;
export type ValidationProblemInsert = z.infer<typeof problemInsertSchema>;
export type ValidationProblemUpdate = z.infer<typeof problemUpdateSchema>;
export type ValidationVoteInsert = z.infer<typeof voteInsertSchema>;
export type ValidationCategoryInsert = z.infer<typeof categoryInsertSchema>;
export type ValidationCategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type ValidationAppInsert = z.infer<typeof appInsertSchema>;
export type ValidationAppUpdate = z.infer<typeof appUpdateSchema>;
export type ValidationPaginationParams = z.infer<typeof paginationSchema>;
export type ValidationProblemFilters = z.infer<typeof problemFiltersSchema>;
export type ValidationProblemSort = z.infer<typeof problemSortSchema>;
export type ValidationSearchQuery = z.infer<typeof searchQuerySchema>;
export type ValidationVoteOperation = z.infer<typeof voteOperationSchema>;
export type ValidationVotingResult = z.infer<typeof votingResultSchema>;
export type ValidationAppFeature = z.infer<typeof appFeatureSchema>;
export type ValidationAppFeatures = z.infer<typeof appFeaturesSchema>;
export type ValidationRealtimeEvent = z.infer<typeof realtimeEventSchema>;
export type ValidationDatabaseOperationResult = z.infer<typeof databaseOperationResultSchema>;