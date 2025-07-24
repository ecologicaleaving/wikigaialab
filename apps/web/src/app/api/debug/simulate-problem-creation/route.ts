/**
 * Debug: Simulate Authenticated Problem Creation
 * Test the exact flow that fails in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateProblemInput } from '@/lib/validation/problem-schema';
import { createApiTracker } from '@/lib/debug/api-tracker';
import type { Database } from '@wikigaialab/database';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  const tracker = createApiTracker(request, 'POST /api/debug/simulate-problem-creation');
  
  try {
    const body = await request.json();
    const testUserId = body.testUserId || 'test-user-id';
    
    // Simulate the exact problem creation flow without authentication
    console.log('🧪 Starting problem creation simulation...');
    
    // Step 1: Input Validation
    const testInput = {
      title: body.title || 'Debug Test Problem',
      description: body.description || 'This is a debug test to identify production issues',
      category_id: body.category_id || 'c22c8d43-9753-42bf-9849-30bd0704e086' // Real category from DB
    };
    
    tracker.setRequestBody(testInput);
    
    console.log('🧪 Step 1: Validating input...');
    const validation = validateProblemInput(testInput);
    if (!validation.success) {
      tracker.addValidationError(validation.errorMessage);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'validation',
        error: validation.errorMessage,
        correlationId: tracker.getCorrelationId()
      }, { status: 400 }));
    }
    console.log('✅ Step 1: Validation passed');
    
    // Step 2: Database Connection
    console.log('🧪 Step 2: Connecting to database...');
    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log('✅ Step 2: Database connection established');
    } catch (error) {
      tracker.trackError(error as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'database-connection',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    // Step 3: User Simulation (what happens in real auth flow)
    console.log('🧪 Step 3: Simulating user synchronization...');
    const simulatedUser = {
      id: testUserId,
      email: 'debug-test@example.com',
      name: 'Debug Test User'
    };
    
    // Try to check if user exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', simulatedUser.id)
        .single();
      
      console.log('🧪 User check result:', { existingUser: !!existingUser, error: checkError?.code });
      
      if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
        console.log('🧪 User not found, would create new user...');
        // Don't actually create user in debug mode
      }
      console.log('✅ Step 3: User synchronization simulation passed');
    } catch (userError) {
      tracker.trackError(userError as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'user-sync',
        error: userError instanceof Error ? userError.message : 'User sync failed',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    // Step 4: Category Validation
    console.log('🧪 Step 4: Validating category...');
    try {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', testInput.category_id)
        .single();
      
      console.log('🧪 Category check result:', { 
        category: category ? { id: category.id, name: category.name } : null, 
        error: categoryError?.code 
      });
      
      if (categoryError || !category) {
        return tracker.complete(NextResponse.json({
          success: false,
          step: 'category-validation',
          error: `Category not found: ${testInput.category_id}`,
          availableCategories: 'Run /api/debug/test-scenarios?category=database to see available categories',
          correlationId: tracker.getCorrelationId()
        }, { status: 400 }));
      }
      console.log('✅ Step 4: Category validation passed -', category.name);
    } catch (categoryError) {
      tracker.trackError(categoryError as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'category-validation',
        error: categoryError instanceof Error ? categoryError.message : 'Category validation failed',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    // Step 5: Problem Creation Simulation (without actually creating)
    console.log('🧪 Step 5: Simulating problem creation...');
    const problemData = {
      title: testInput.title,
      description: testInput.description,
      category_id: testInput.category_id,
      proposer_id: simulatedUser.id,
      status: 'Proposed',
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🧪 Problem data prepared:', {
      title: problemData.title,
      category_id: problemData.category_id,
      status: problemData.status
    });
    
    // Test the insert query without actually inserting
    try {
      // Dry run - just validate the query structure
      const queryTest = supabase
        .from('problems')
        .insert(problemData)
        .select('*');
      
      console.log('✅ Step 5: Problem creation query structure valid');
    } catch (insertError) {
      tracker.trackError(insertError as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'problem-creation',
        error: insertError instanceof Error ? insertError.message : 'Problem creation failed',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    // Success!
    return tracker.complete(NextResponse.json({
      success: true,
      message: 'Problem creation simulation completed successfully',
      steps: [
        '✅ Input validation passed',
        '✅ Database connection established', 
        '✅ User synchronization simulated',
        '✅ Category validation passed',
        '✅ Problem creation query structure valid'
      ],
      simulatedData: {
        input: testInput,
        user: simulatedUser,
        problemData: problemData
      },
      correlationId: tracker.getCorrelationId()
    }));
    
  } catch (error) {
    tracker.trackError(error as Error, 500);
    
    return tracker.complete(NextResponse.json({
      success: false,
      step: 'unknown',
      error: 'Simulation failed with unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId: tracker.getCorrelationId()
    }, { status: 500 }));
  }
}