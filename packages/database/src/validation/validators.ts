/**
 * Database validation utilities and helpers
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { z } from 'zod';
import { ValidationResult, ValidationError } from '../types';
import {
  userInsertSchema,
  userUpdateSchema,
  problemInsertSchema,
  problemUpdateSchema,
  voteInsertSchema,
  categoryInsertSchema,
  categoryUpdateSchema,
  appInsertSchema,
  appUpdateSchema,
  paginationSchema,
  problemFiltersSchema,
  problemSortSchema,
  searchQuerySchema,
  voteOperationSchema,
} from './schemas';

/**
 * Generic validation function that converts Zod errors to our ValidationError format
 */
function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult & { data?: T } {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: [],
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return {
        isValid: false,
        errors: validationErrors,
      };
    }

    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Unknown validation error',
        code: 'unknown',
      }],
    };
  }
}

/**
 * User validation functions
 */
export const validateUserInsert = (data: unknown) => 
  validateWithSchema(userInsertSchema, data);

export const validateUserUpdate = (data: unknown) => 
  validateWithSchema(userUpdateSchema, data);

/**
 * Problem validation functions
 */
export const validateProblemInsert = (data: unknown) => 
  validateWithSchema(problemInsertSchema, data);

export const validateProblemUpdate = (data: unknown) => 
  validateWithSchema(problemUpdateSchema, data);

/**
 * Vote validation functions
 */
export const validateVoteInsert = (data: unknown) => 
  validateWithSchema(voteInsertSchema, data);

export const validateVoteOperation = (data: unknown) => 
  validateWithSchema(voteOperationSchema, data);

/**
 * Category validation functions
 */
export const validateCategoryInsert = (data: unknown) => 
  validateWithSchema(categoryInsertSchema, data);

export const validateCategoryUpdate = (data: unknown) => 
  validateWithSchema(categoryUpdateSchema, data);

/**
 * App validation functions
 */
export const validateAppInsert = (data: unknown) => 
  validateWithSchema(appInsertSchema, data);

export const validateAppUpdate = (data: unknown) => 
  validateWithSchema(appUpdateSchema, data);

/**
 * Query parameter validation functions
 */
export const validatePagination = (data: unknown) => 
  validateWithSchema(paginationSchema, data);

export const validateProblemFilters = (data: unknown) => 
  validateWithSchema(problemFiltersSchema, data);

export const validateProblemSort = (data: unknown) => 
  validateWithSchema(problemSortSchema, data);

export const validateSearchQuery = (data: unknown) => 
  validateWithSchema(searchQuerySchema, data);

/**
 * Custom validation functions
 */

/**
 * Validate that a user can vote on a problem
 */
export const validateVotingEligibility = (
  userId: string,
  problemId: string,
  proposerId: string
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!userId || !z.string().uuid().safeParse(userId).success) {
    errors.push({
      field: 'userId',
      message: 'Invalid user ID',
      code: 'invalid_uuid',
    });
  }

  if (!problemId || !z.string().uuid().safeParse(problemId).success) {
    errors.push({
      field: 'problemId',
      message: 'Invalid problem ID',
      code: 'invalid_uuid',
    });
  }

  if (userId === proposerId) {
    errors.push({
      field: 'userId',
      message: 'Users cannot vote on their own problems',
      code: 'self_voting_not_allowed',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate problem status transition
 */
export const validateProblemStatusTransition = (
  currentStatus: string,
  newStatus: string,
  isAdmin: boolean = false
): ValidationResult => {
  const errors: ValidationError[] = [];

  const validStatuses = ['Proposed', 'In Development', 'Completed'];
  
  if (!validStatuses.includes(currentStatus)) {
    errors.push({
      field: 'currentStatus',
      message: 'Invalid current status',
      code: 'invalid_status',
    });
  }

  if (!validStatuses.includes(newStatus)) {
    errors.push({
      field: 'newStatus',
      message: 'Invalid new status',
      code: 'invalid_status',
    });
  }

  // Only admins can change status to/from 'In Development' or 'Completed'
  if (!isAdmin && (newStatus === 'In Development' || newStatus === 'Completed')) {
    errors.push({
      field: 'newStatus',
      message: 'Only admins can change status to In Development or Completed',
      code: 'admin_only_status',
    });
  }

  // Validate logical transitions
  if (currentStatus === 'Completed' && newStatus !== 'Completed') {
    errors.push({
      field: 'newStatus',
      message: 'Cannot change status from Completed to another status',
      code: 'invalid_transition',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate app slug uniqueness format
 */
export const validateAppSlug = (slug: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!slug || typeof slug !== 'string') {
    errors.push({
      field: 'slug',
      message: 'Slug is required and must be a string',
      code: 'required',
    });
    return { isValid: false, errors };
  }

  // Check format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push({
      field: 'slug',
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      code: 'invalid_format',
    });
  }

  // Check length
  if (slug.length < 2 || slug.length > 50) {
    errors.push({
      field: 'slug',
      message: 'Slug must be between 2 and 50 characters',
      code: 'invalid_length',
    });
  }

  // Check for reserved words
  const reservedWords = ['api', 'admin', 'www', 'app', 'apps', 'new', 'edit', 'delete'];
  if (reservedWords.includes(slug)) {
    errors.push({
      field: 'slug',
      message: 'Slug cannot be a reserved word',
      code: 'reserved_word',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate category ordering
 */
export const validateCategoryOrdering = (
  categoryOrders: { id: string; order_index: number }[]
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!Array.isArray(categoryOrders)) {
    errors.push({
      field: 'categoryOrders',
      message: 'Category orders must be an array',
      code: 'invalid_type',
    });
    return { isValid: false, errors };
  }

  const ids = new Set<string>();
  const orderIndices = new Set<number>();

  categoryOrders.forEach((item, index) => {
    // Validate ID format
    if (!z.string().uuid().safeParse(item.id).success) {
      errors.push({
        field: `categoryOrders[${index}].id`,
        message: 'Invalid category ID format',
        code: 'invalid_uuid',
      });
    }

    // Check for duplicate IDs
    if (ids.has(item.id)) {
      errors.push({
        field: `categoryOrders[${index}].id`,
        message: 'Duplicate category ID',
        code: 'duplicate_id',
      });
    }
    ids.add(item.id);

    // Validate order index
    if (!Number.isInteger(item.order_index) || item.order_index < 0) {
      errors.push({
        field: `categoryOrders[${index}].order_index`,
        message: 'Order index must be a non-negative integer',
        code: 'invalid_order_index',
      });
    }

    // Check for duplicate order indices
    if (orderIndices.has(item.order_index)) {
      errors.push({
        field: `categoryOrders[${index}].order_index`,
        message: 'Duplicate order index',
        code: 'duplicate_order_index',
      });
    }
    orderIndices.add(item.order_index);
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (
  page?: number,
  limit?: number
): ValidationResult & { data?: { page: number; limit: number } } => {
  const params = {
    page: page || 1,
    limit: limit || 10,
  };

  return validateWithSchema(paginationSchema, params);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!email || typeof email !== 'string') {
    errors.push({
      field: 'email',
      message: 'Email is required and must be a string',
      code: 'required',
    });
    return { isValid: false, errors };
  }

  if (!z.string().email().safeParse(email).success) {
    errors.push({
      field: 'email',
      message: 'Invalid email format',
      code: 'invalid_email',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid: string, fieldName: string = 'id'): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!uuid || typeof uuid !== 'string') {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required and must be a string`,
      code: 'required',
    });
    return { isValid: false, errors };
  }

  if (!z.string().uuid().safeParse(uuid).success) {
    errors.push({
      field: fieldName,
      message: `Invalid ${fieldName} format`,
      code: 'invalid_uuid',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Batch validate multiple items
 */
export const batchValidate = <T>(
  items: unknown[],
  validator: (item: unknown) => ValidationResult & { data?: T }
): ValidationResult & { data?: T[] } => {
  const errors: ValidationError[] = [];
  const validatedItems: T[] = [];

  items.forEach((item, index) => {
    const result = validator(item);
    
    if (!result.isValid) {
      // Prefix field names with array index
      const indexedErrors = result.errors.map(error => ({
        ...error,
        field: `[${index}].${error.field}`,
      }));
      errors.push(...indexedErrors);
    } else if (result.data) {
      validatedItems.push(result.data);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedItems : undefined,
  };
};