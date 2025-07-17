/**
 * Database Migration Management
 * 
 * This module manages database migrations for WikiGaiaLab.
 * Migrations should be run in order to properly set up the database schema.
 * 
 * @author James (Dev Agent)
 * @date 2025-07-17
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface Migration {
  id: string;
  name: string;
  description: string;
  sql: string;
  version: string;
}

/**
 * Get all available migrations in order
 */
export const getMigrations = (): Migration[] => {
  const migrationsDir = __dirname;
  
  const migrations: Migration[] = [
    {
      id: '001',
      name: 'initial_schema',
      description: 'Create core tables (users, problems, votes, categories, apps) with proper constraints and indexes',
      sql: readFileSync(join(migrationsDir, '001_initial_schema.sql'), 'utf8'),
      version: '1.0.0'
    },
    {
      id: '002',
      name: 'triggers',
      description: 'Add database triggers for real-time updates and data consistency',
      sql: readFileSync(join(migrationsDir, '002_triggers.sql'), 'utf8'),
      version: '1.0.0'
    },
    {
      id: '003',
      name: 'rls_policies',
      description: 'Implement Row Level Security policies for data protection',
      sql: readFileSync(join(migrationsDir, '003_rls_policies.sql'), 'utf8'),
      version: '1.0.0'
    },
    {
      id: '004',
      name: 'seed_data',
      description: 'Insert initial seed data for development and testing',
      sql: readFileSync(join(migrationsDir, '004_seed_data.sql'), 'utf8'),
      version: '1.0.0'
    }
  ];

  return migrations;
};

/**
 * Get a specific migration by ID
 */
export const getMigration = (id: string): Migration | undefined => {
  return getMigrations().find(migration => migration.id === id);
};

/**
 * Get migration SQL content by name
 */
export const getMigrationSql = (name: string): string => {
  const migration = getMigrations().find(m => m.name === name);
  if (!migration) {
    throw new Error(`Migration not found: ${name}`);
  }
  return migration.sql;
};

/**
 * Validate migration order and dependencies
 */
export const validateMigrations = (): { isValid: boolean; errors: string[] } => {
  const migrations = getMigrations();
  const errors: string[] = [];

  // Check if migrations are in correct order
  for (let i = 0; i < migrations.length - 1; i++) {
    const currentId = parseInt(migrations[i].id);
    const nextId = parseInt(migrations[i + 1].id);
    
    if (nextId !== currentId + 1) {
      errors.push(`Migration order error: ${migrations[i].id} -> ${migrations[i + 1].id}`);
    }
  }

  // Check for duplicate IDs
  const ids = migrations.map(m => m.id);
  const uniqueIds = [...new Set(ids)];
  if (ids.length !== uniqueIds.length) {
    errors.push('Duplicate migration IDs found');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Migration execution order
 */
export const MIGRATION_ORDER = [
  '001_initial_schema',
  '002_triggers',
  '003_rls_policies',
  '004_seed_data'
] as const;

export type MigrationName = typeof MIGRATION_ORDER[number];

/**
 * Check if all required migrations are present
 */
export const checkMigrationCompleteness = (): boolean => {
  const availableMigrations = getMigrations().map(m => `${m.id}_${m.name}`);
  return MIGRATION_ORDER.every(required => 
    availableMigrations.includes(required)
  );
};