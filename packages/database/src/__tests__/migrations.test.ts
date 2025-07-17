/**
 * Database migration tests
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import {
  getMigrations,
  getMigration,
  getMigrationSql,
  validateMigrations,
  checkMigrationCompleteness,
  MIGRATION_ORDER,
} from '../migrations';

describe('Database Migration Tests', () => {
  describe('Migration Management', () => {
    test('should get all migrations', () => {
      const migrations = getMigrations();
      expect(migrations).toHaveLength(4);
      expect(migrations[0].id).toBe('001');
      expect(migrations[0].name).toBe('initial_schema');
      expect(migrations[1].id).toBe('002');
      expect(migrations[1].name).toBe('triggers');
      expect(migrations[2].id).toBe('003');
      expect(migrations[2].name).toBe('rls_policies');
      expect(migrations[3].id).toBe('004');
      expect(migrations[3].name).toBe('seed_data');
    });

    test('should get migration by ID', () => {
      const migration = getMigration('001');
      expect(migration).toBeDefined();
      expect(migration?.id).toBe('001');
      expect(migration?.name).toBe('initial_schema');
      expect(migration?.description).toContain('core tables');
    });

    test('should return undefined for non-existent migration', () => {
      const migration = getMigration('999');
      expect(migration).toBeUndefined();
    });

    test('should get migration SQL by name', () => {
      const sql = getMigrationSql('initial_schema');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS categories');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS problems');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS votes');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS apps');
    });

    test('should throw error for non-existent migration SQL', () => {
      expect(() => getMigrationSql('non_existent')).toThrow('Migration not found');
    });

    test('should validate migration order', () => {
      const validation = validateMigrations();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should check migration completeness', () => {
      const isComplete = checkMigrationCompleteness();
      expect(isComplete).toBe(true);
    });

    test('should verify migration order constant', () => {
      expect(MIGRATION_ORDER).toHaveLength(4);
      expect(MIGRATION_ORDER[0]).toBe('001_initial_schema');
      expect(MIGRATION_ORDER[1]).toBe('002_triggers');
      expect(MIGRATION_ORDER[2]).toBe('003_rls_policies');
      expect(MIGRATION_ORDER[3]).toBe('004_seed_data');
    });
  });

  describe('Migration Content Validation', () => {
    test('initial schema migration should contain required tables', () => {
      const migration = getMigration('001');
      expect(migration?.sql).toContain('CREATE TABLE IF NOT EXISTS categories');
      expect(migration?.sql).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(migration?.sql).toContain('CREATE TABLE IF NOT EXISTS problems');
      expect(migration?.sql).toContain('CREATE TABLE IF NOT EXISTS votes');
      expect(migration?.sql).toContain('CREATE TABLE IF NOT EXISTS apps');
    });

    test('initial schema migration should contain required indexes', () => {
      const migration = getMigration('001');
      expect(migration?.sql).toContain('CREATE INDEX IF NOT EXISTS idx_problems_status');
      expect(migration?.sql).toContain('CREATE INDEX IF NOT EXISTS idx_problems_vote_count');
      expect(migration?.sql).toContain('CREATE INDEX IF NOT EXISTS idx_votes_user_id');
      expect(migration?.sql).toContain('CREATE INDEX IF NOT EXISTS idx_votes_problem_id');
    });

    test('triggers migration should contain required functions', () => {
      const migration = getMigration('002');
      expect(migration?.sql).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(migration?.sql).toContain('CREATE OR REPLACE FUNCTION update_problem_vote_count()');
      expect(migration?.sql).toContain('CREATE OR REPLACE FUNCTION update_user_problem_count()');
      expect(migration?.sql).toContain('CREATE OR REPLACE FUNCTION prevent_self_voting()');
    });

    test('triggers migration should contain required triggers', () => {
      const migration = getMigration('002');
      expect(migration?.sql).toContain('CREATE TRIGGER trigger_users_updated_at');
      expect(migration?.sql).toContain('CREATE TRIGGER trigger_update_vote_count');
      expect(migration?.sql).toContain('CREATE TRIGGER trigger_prevent_self_voting');
    });

    test('RLS policies migration should enable RLS on all tables', () => {
      const migration = getMigration('003');
      expect(migration?.sql).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
      expect(migration?.sql).toContain('ALTER TABLE problems ENABLE ROW LEVEL SECURITY');
      expect(migration?.sql).toContain('ALTER TABLE votes ENABLE ROW LEVEL SECURITY');
      expect(migration?.sql).toContain('ALTER TABLE categories ENABLE ROW LEVEL SECURITY');
      expect(migration?.sql).toContain('ALTER TABLE apps ENABLE ROW LEVEL SECURITY');
    });

    test('RLS policies migration should contain required policies', () => {
      const migration = getMigration('003');
      expect(migration?.sql).toContain('CREATE POLICY \"Users can view all public profiles\"');
      expect(migration?.sql).toContain('CREATE POLICY \"Users can view all problems\"');
      expect(migration?.sql).toContain('CREATE POLICY \"Authenticated users can cast votes\"');
      expect(migration?.sql).toContain('CREATE POLICY \"Admins can manage categories\"');
    });

    test('seed data migration should contain initial categories', () => {
      const migration = getMigration('004');
      expect(migration?.sql).toContain('INSERT INTO categories');
      expect(migration?.sql).toContain('Technology');
      expect(migration?.sql).toContain('Environment');
      expect(migration?.sql).toContain('Health');
      expect(migration?.sql).toContain('Education');
    });

    test('seed data migration should contain demo users', () => {
      const migration = getMigration('004');
      expect(migration?.sql).toContain('INSERT INTO users');
      expect(migration?.sql).toContain('admin@wikigaialab.com');
      expect(migration?.sql).toContain('user1@example.com');
    });

    test('seed data migration should contain demo problems', () => {
      const migration = getMigration('004');
      expect(migration?.sql).toContain('INSERT INTO problems');
      expect(migration?.sql).toContain('Better Password Management');
      expect(migration?.sql).toContain('Reduce Food Waste');
    });
  });

  describe('Migration Structure', () => {
    test('all migrations should have required properties', () => {
      const migrations = getMigrations();
      
      migrations.forEach(migration => {
        expect(migration).toHaveProperty('id');
        expect(migration).toHaveProperty('name');
        expect(migration).toHaveProperty('description');
        expect(migration).toHaveProperty('sql');
        expect(migration).toHaveProperty('version');
        
        expect(typeof migration.id).toBe('string');
        expect(typeof migration.name).toBe('string');
        expect(typeof migration.description).toBe('string');
        expect(typeof migration.sql).toBe('string');
        expect(typeof migration.version).toBe('string');
        
        expect(migration.id.length).toBeGreaterThan(0);
        expect(migration.name.length).toBeGreaterThan(0);
        expect(migration.description.length).toBeGreaterThan(0);
        expect(migration.sql.length).toBeGreaterThan(0);
        expect(migration.version).toBe('1.0.0');
      });
    });

    test('migrations should be properly ordered', () => {
      const migrations = getMigrations();
      
      for (let i = 0; i < migrations.length - 1; i++) {
        const currentId = parseInt(migrations[i].id);
        const nextId = parseInt(migrations[i + 1].id);
        expect(nextId).toBe(currentId + 1);
      }
    });

    test('all migrations should contain transaction blocks', () => {
      const migrations = getMigrations();
      
      migrations.forEach(migration => {
        expect(migration.sql).toContain('BEGIN;');
        expect(migration.sql).toContain('COMMIT;');
      });
    });
  });
});