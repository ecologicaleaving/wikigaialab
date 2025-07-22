/**
 * Problem Creation Validation Schema
 * 
 * A+ Security Implementation - Input validation and sanitization
 * @author BMad Orchestrator Security Team
 * @date 2025-07-22
 */

import { z } from 'zod';
import * as DOMPurify from 'isomorphic-dompurify';

// Custom validation for sanitized text
const sanitizedText = (minLength: number, maxLength: number) =>
  z.string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must not exceed ${maxLength} characters`)
    .trim()
    .refine(
      (val) => {
        const sanitized = DOMPurify.sanitize(val, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        });
        return sanitized === val;
      },
      'Contains invalid or potentially dangerous characters'
    )
    .refine(
      (val) => !/<script|javascript:|data:|vbscript:|on\w+=/i.test(val),
      'Contains potentially malicious content'
    );

// UUID validation with strict format
const strictUUID = z.string()
  .uuid('Invalid UUID format')
  .refine(
    (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val),
    'UUID does not match required v4 format'
  );

export const createProblemSchema = z.object({
  title: sanitizedText(5, 200)
    .refine(
      (val) => !/^\s*$/.test(val),
      'Title cannot be only whitespace'
    ),
  description: sanitizedText(20, 2000)
    .refine(
      (val) => !/^\s*$/.test(val),
      'Description cannot be only whitespace'
    ),
  category_id: strictUUID
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
  errorMessage?: string;
}

// Safe validation wrapper
export function validateProblemInput(input: unknown): ValidationResult<CreateProblemInput> {
  try {
    const result = createProblemSchema.safeParse(input);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        errors: result.error,
        errorMessage: result.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join('; ')
      };
    }
  } catch (error) {
    return {
      success: false,
      errorMessage: 'Validation failed due to unexpected error'
    };
  }
}