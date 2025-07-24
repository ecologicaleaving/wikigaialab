/**
 * Debug Test Scenarios Endpoint
 * Systematic testing of common error conditions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateProblemInput } from '@/lib/validation/problem-schema';
import { createApiTracker } from '@/lib/debug/api-tracker';
import type { Database } from '@wikigaialab/database';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'authentication' | 'database' | 'integration';
  execute: () => Promise<TestResult>;
}

interface TestResult {
  scenario: string;
  status: 'pass' | 'fail' | 'error';
  duration: number;
  details?: any;
  error?: string;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const tracker = createApiTracker(request, 'GET /api/debug/test-scenarios');
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'validation' | 'authentication' | 'database' | 'integration' | null;
    const scenarioId = searchParams.get('scenario');

    const scenarios: TestScenario[] = [
      // Validation Test Scenarios
      {
        id: 'validation-empty-title',
        name: 'Empty Title Validation',
        description: 'Test validation with empty title',
        category: 'validation',
        execute: async () => {
          const startTime = Date.now();
          try {
            const result = validateProblemInput({
              title: '',
              description: 'Valid description here',
              category_id: '123e4567-e89b-12d3-a456-426614174000'
            });
            
            return {
              scenario: 'validation-empty-title',
              status: result.success ? 'fail' : 'pass',
              duration: Date.now() - startTime,
              details: { validationResult: result }
            };
          } catch (error) {
            return {
              scenario: 'validation-empty-title',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      {
        id: 'validation-invalid-uuid',
        name: 'Invalid UUID Validation',
        description: 'Test validation with invalid category UUID',
        category: 'validation',
        execute: async () => {
          const startTime = Date.now();
          try {
            const result = validateProblemInput({
              title: 'Valid title',
              description: 'Valid description here',
              category_id: 'invalid-uuid'
            });
            
            return {
              scenario: 'validation-invalid-uuid',
              status: result.success ? 'fail' : 'pass',
              duration: Date.now() - startTime,
              details: { validationResult: result }
            };
          } catch (error) {
            return {
              scenario: 'validation-invalid-uuid',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      {
        id: 'validation-xss-attempt',
        name: 'XSS Prevention Test',
        description: 'Test XSS prevention in title/description',
        category: 'validation',
        execute: async () => {
          const startTime = Date.now();
          try {
            const result = validateProblemInput({
              title: '<script>alert("xss")</script>',
              description: 'javascript:alert("xss")',
              category_id: '123e4567-e89b-12d3-a456-426614174000'
            });
            
            return {
              scenario: 'validation-xss-attempt',
              status: result.success ? 'fail' : 'pass',
              duration: Date.now() - startTime,
              details: { validationResult: result }
            };
          } catch (error) {
            return {
              scenario: 'validation-xss-attempt',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },

      // Database Test Scenarios
      {
        id: 'database-connection',
        name: 'Database Connection Test',
        description: 'Test basic database connectivity',
        category: 'database',
        execute: async () => {
          const startTime = Date.now();
          try {
            const supabase = getSupabaseClient();
            const { data, error, count } = await supabase
              .from('problems')
              .select('id', { count: 'exact' })
              .limit(1);

            return {
              scenario: 'database-connection',
              status: error ? 'fail' : 'pass',
              duration: Date.now() - startTime,
              details: { hasData: !!data, error: error?.message }
            };
          } catch (error) {
            return {
              scenario: 'database-connection',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Connection failed'
            };
          }
        }
      },

      {
        id: 'database-categories-exist',
        name: 'Categories Table Check',
        description: 'Verify categories table has data',
        category: 'database',
        execute: async () => {
          const startTime = Date.now();
          try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
              .from('categories')
              .select('id, name')
              .limit(5);

            return {
              scenario: 'database-categories-exist',
              status: (!error && data && data.length > 0) ? 'pass' : 'fail',
              duration: Date.now() - startTime,
              details: { 
                categoriesFound: data?.length || 0,
                error: error?.message,
                sampleCategories: data?.slice(0, 3)
              }
            };
          } catch (error) {
            return {
              scenario: 'database-categories-exist',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Query failed'
            };
          }
        }
      },

      {
        id: 'database-status-enum',
        name: 'Problem Status Enum Test',
        description: 'Test valid problem status values',
        category: 'database',
        execute: async () => {
          const startTime = Date.now();
          try {
            const supabase = getSupabaseClient();
            
            // Test each valid status value
            const validStatuses = ['Proposed', 'In Development', 'Completed'];
            const results = await Promise.all(
              validStatuses.map(async (status) => {
                const { data, error } = await supabase
                  .from('problems')
                  .select('id')
                  .eq('status', status)
                  .limit(1);
                
                return { status, querySucceeded: !error, error: error?.message };
              })
            );

            const failedQueries = results.filter(r => !r.querySucceeded);

            return {
              scenario: 'database-status-enum',
              status: failedQueries.length === 0 ? 'pass' : 'fail',
              duration: Date.now() - startTime,
              details: { 
                testedStatuses: validStatuses,
                results,
                failedQueries: failedQueries.length
              }
            };
          } catch (error) {
            return {
              scenario: 'database-status-enum',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Status test failed'
            };
          }
        }
      },

      // Integration Test Scenarios
      {
        id: 'integration-problem-creation-flow',
        name: 'Problem Creation Flow Test',
        description: 'Test complete problem creation without auth',
        category: 'integration',
        execute: async () => {
          const startTime = Date.now();
          try {
            // Simulate the exact flow that fails in production
            const supabase = getSupabaseClient();
            
            // Step 1: Validate input
            const testInput = {
              title: 'Test Problem Creation Flow',
              description: 'This is a test to identify production issues',
              category_id: '123e4567-e89b-12d3-a456-426614174000'
            };
            
            const validation = validateProblemInput(testInput);
            if (!validation.success) {
              return {
                scenario: 'integration-problem-creation-flow',
                status: 'fail',
                duration: Date.now() - startTime,
                details: { step: 'validation', error: validation.errorMessage }
              };
            }

            // Step 2: Check if category exists
            const { data: category, error: categoryError } = await supabase
              .from('categories')
              .select('id, name')
              .eq('id', testInput.category_id)
              .single();

            if (categoryError && categoryError.code !== 'PGRST116') {
              return {
                scenario: 'integration-problem-creation-flow',
                status: 'fail',
                duration: Date.now() - startTime,
                details: { 
                  step: 'category-check', 
                  error: categoryError.message,
                  categoryId: testInput.category_id
                }
              };
            }

            return {
              scenario: 'integration-problem-creation-flow',
              status: 'pass',
              duration: Date.now() - startTime,
              details: { 
                validationPassed: true,
                categoryExists: !!category,
                categoryName: category?.name,
                readyForCreation: true
              }
            };
          } catch (error) {
            return {
              scenario: 'integration-problem-creation-flow',
              status: 'error',
              duration: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Integration test failed'
            };
          }
        }
      }
    ];

    // Filter scenarios if requested
    let selectedScenarios = scenarios;
    if (category) {
      selectedScenarios = scenarios.filter(s => s.category === category);
    }
    if (scenarioId) {
      selectedScenarios = scenarios.filter(s => s.id === scenarioId);
    }

    // Execute scenarios
    const results = await Promise.all(
      selectedScenarios.map(async (scenario) => {
        try {
          return await scenario.execute();
        } catch (error) {
          return {
            scenario: scenario.id,
            status: 'error' as const,
            duration: 0,
            error: error instanceof Error ? error.message : 'Execution failed'
          };
        }
      })
    );

    const summary = {
      totalScenarios: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      errored: results.filter(r => r.status === 'error').length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
    };

    return tracker.complete(NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      results,
      availableCategories: ['validation', 'authentication', 'database', 'integration'],
      availableScenarios: scenarios.map(s => ({ id: s.id, name: s.name, category: s.category }))
    }));

  } catch (error) {
    tracker.trackError(error as Error, 500);
    
    return tracker.complete(NextResponse.json({
      success: false,
      error: 'Test scenarios execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}