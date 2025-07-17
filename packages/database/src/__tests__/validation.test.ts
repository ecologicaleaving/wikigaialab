/**
 * Database validation tests
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import {
  validateUserInsert,
  validateUserUpdate,
  validateProblemInsert,
  validateProblemUpdate,
  validateVoteInsert,
  validateCategoryInsert,
  validateCategoryUpdate,
  validateAppInsert,
  validateAppUpdate,
  validateVotingEligibility,
  validateProblemStatusTransition,
  validateAppSlug,
  validateEmail,
  validateUUID,
} from '../validation/validators';

describe('Database Validation Tests', () => {
  describe('User Validation', () => {
    test('should validate correct user insert data', () => {
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const result = validateUserInsert(validUserData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toMatchObject(validUserData);
    });

    test('should reject invalid email format', () => {
      const invalidUserData = {
        email: 'invalid-email',
        name: 'Test User',
      };

      const result = validateUserInsert(invalidUserData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].code).toBe('invalid_email');
    });

    test('should reject name that is too short', () => {
      const invalidUserData = {
        email: 'test@example.com',
        name: 'A',
      };

      const result = validateUserInsert(invalidUserData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('name');
    });

    test('should validate user update data', () => {
      const validUpdateData = {
        name: 'Updated Name',
        subscription_status: 'active' as const,
      };

      const result = validateUserUpdate(validUpdateData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Problem Validation', () => {
    const validProblemData = {
      proposer_id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Problem Title',
      description: 'This is a test problem description that is long enough to be valid.',
      category_id: '123e4567-e89b-12d3-a456-426614174001',
    };

    test('should validate correct problem insert data', () => {
      const result = validateProblemInsert(validProblemData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject title that is too short', () => {
      const invalidData = {
        ...validProblemData,
        title: 'Bad',
      };

      const result = validateProblemInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('title');
    });

    test('should reject description that is too short', () => {
      const invalidData = {
        ...validProblemData,
        description: 'Too short',
      };

      const result = validateProblemInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('description');
    });

    test('should reject invalid UUID format', () => {
      const invalidData = {
        ...validProblemData,
        proposer_id: 'invalid-uuid',
      };

      const result = validateProblemInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('proposer_id');
    });

    test('should validate problem update data', () => {
      const validUpdateData = {
        title: 'Updated Problem Title',
        status: 'In Development' as const,
      };

      const result = validateProblemUpdate(validUpdateData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Vote Validation', () => {
    test('should validate correct vote insert data', () => {
      const validVoteData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        problem_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = validateVoteInsert(validVoteData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid user_id', () => {
      const invalidVoteData = {
        user_id: 'invalid-uuid',
        problem_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = validateVoteInsert(invalidVoteData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('user_id');
    });
  });

  describe('Category Validation', () => {
    test('should validate correct category insert data', () => {
      const validCategoryData = {
        name: 'Technology',
        description: 'Technology related problems',
        order_index: 1,
      };

      const result = validateCategoryInsert(validCategoryData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject name that is too short', () => {
      const invalidData = {
        name: 'A',
        description: 'Valid description',
      };

      const result = validateCategoryInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('name');
    });

    test('should reject negative order_index', () => {
      const invalidData = {
        name: 'Technology',
        order_index: -1,
      };

      const result = validateCategoryInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('order_index');
    });
  });

  describe('App Validation', () => {
    const validAppData = {
      problem_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test App',
      description: 'Test app description',
      slug: 'test-app',
      base_features: ['feature1', 'feature2'],
      premium_features: ['premium1'],
      access_model: 'freemium' as const,
    };

    test('should validate correct app insert data', () => {
      const result = validateAppInsert(validAppData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid slug format', () => {
      const invalidData = {
        ...validAppData,
        slug: 'Invalid Slug!',
      };

      const result = validateAppInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('slug');
    });

    test('should reject invalid version format', () => {
      const invalidData = {
        ...validAppData,
        version: 'invalid-version',
      };

      const result = validateAppInsert(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('version');
    });
  });

  describe('Custom Validation Functions', () => {
    test('should validate voting eligibility', () => {
      const result = validateVotingEligibility(
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002'
      );
      expect(result.isValid).toBe(true);
    });

    test('should reject self-voting', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateVotingEligibility(
        userId,
        '123e4567-e89b-12d3-a456-426614174001',
        userId
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('self_voting_not_allowed');
    });

    test('should validate problem status transition', () => {
      const result = validateProblemStatusTransition(
        'Proposed',
        'In Development',
        true
      );
      expect(result.isValid).toBe(true);
    });

    test('should reject non-admin status change', () => {
      const result = validateProblemStatusTransition(
        'Proposed',
        'In Development',
        false
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('admin_only_status');
    });

    test('should validate app slug', () => {
      const result = validateAppSlug('valid-app-slug');
      expect(result.isValid).toBe(true);
    });

    test('should reject reserved slug words', () => {
      const result = validateAppSlug('admin');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('reserved_word');
    });

    test('should validate email format', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('invalid_email');
    });

    test('should validate UUID format', () => {
      const result = validateUUID('123e4567-e89b-12d3-a456-426614174000');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid UUID', () => {
      const result = validateUUID('invalid-uuid');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('invalid_uuid');
    });
  });
});