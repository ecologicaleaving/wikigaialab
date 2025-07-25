/**
 * DEPRECATED: UserIdentityService
 * 
 * This service has been replaced by the session callback in auth.config.ts
 * which automatically handles user creation and identity management.
 * 
 * The new dual-identity architecture:
 * - Google UID for authentication
 * - Database UID for sessions (auto-created via session callback)
 * 
 * @deprecated Use session-based user management instead
 * @date 2025-07-25
 */

// Export empty functions to prevent breaking existing imports
export const getUserIdentityService = () => {
  throw new Error('UserIdentityService is deprecated. User creation now handled by session callback.');
};

export const resolveUserIdentity = () => {
  throw new Error('UserIdentityService is deprecated. User creation now handled by session callback.');
};

export const createUser = () => {
  throw new Error('UserIdentityService is deprecated. User creation now handled by session callback.');
};

// Legacy exports for compatibility (all deprecated)
export default {
  getUserIdentityService,
  resolveUserIdentity,
  createUser
};