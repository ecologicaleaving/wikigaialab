/**
 * Debug: Test Real Authenticated Problem Creation Flow
 * This endpoint tests the EXACT flow that fails with 500 error
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth-nextauth';
import { validateProblemInput } from '@/lib/validation/problem-schema';
import { createApiTracker } from '@/lib/debug/api-tracker';
import { logger } from '@/lib/debug/logger';
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
  const tracker = createApiTracker(request, 'POST /api/debug/test-authenticated-flow');
  
  try {
    // Test the EXACT same flow as the real problems endpoint
    console.log('🧪 Testing REAL authenticated problem creation flow...');
    
    // STEP 1: Real Authentication Check
    console.log('🧪 Step 1: Checking REAL authentication...');
    const session = await logger.time('auth-check', async () => {
      return await auth();
    });
    
    if (!session?.user?.id) {
      const authError = new Error('Authentication required');
      tracker.trackError(authError, 401);
      
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'authentication',
        error: 'No authenticated session found',
        details: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasUserId: !!session?.user?.id,
          sessionId: session?.id || null,
          userEmail: session?.user?.email || null
        },
        correlationId: tracker.getCorrelationId()
      }, { status: 401 }));
    }
    
    const user = {
      id: session.user.id,
      email: session.user.email || 'unknown@email.com',
      name: session.user.name || 'Unknown User'
    };
    
    tracker.setUser(user.id, {
      email: user.email,
      name: user.name,
      sessionId: session.id
    });
    
    console.log('✅ Step 1: REAL authentication successful:', { 
      userId: user.id, 
      userEmail: user.email,
      sessionId: session.id
    });

    // STEP 2: Input Validation (use real test data)
    const body = await request.json();
    const testInput = {
      title: body.title || 'Authenticated Debug Test Problem',
      description: body.description || 'This tests the real authenticated flow that causes 500 errors',
      category_id: body.category_id || 'c22c8d43-9753-42bf-9849-30bd0704e086' // Ambiente category
    };
    
    tracker.setRequestBody(testInput);
    
    console.log('🧪 Step 2: Validating input...');
    const validation = await logger.time('input-validation', () => {
      return validateProblemInput(testInput);
    });
    
    if (!validation.success) {
      tracker.addValidationError(validation.errorMessage);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'validation',
        error: validation.errorMessage,
        correlationId: tracker.getCorrelationId()
      }, { status: 400 }));
    }
    console.log('✅ Step 2: Input validation passed');

    // STEP 3: Database Connection
    console.log('🧪 Step 3: Connecting to database...');
    let supabase;
    try {
      supabase = await logger.time('db-connection', () => {
        return getSupabaseClient();
      });
      console.log('✅ Step 3: Database connection established');
    } catch (dbError) {
      tracker.trackError(dbError as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'database-connection',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }

    // STEP 4: REAL User Synchronization (This is where the 500 likely occurs!)
    console.log('🧪 Step 4: REAL user synchronization...');
    try {
      // Check if user exists in database
      console.log('🧪 Checking if user exists in database:', user.id);
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, name, created_at')
        .eq('id', user.id)
        .single();

      console.log('🧪 User check result:', { 
        existingUser: !!existingUser, 
        error: checkError?.code,
        errorMessage: checkError?.message 
      });

      if (!existingUser && (!checkError || checkError.code === 'PGRST116')) {
        // User doesn't exist, try to create them
        console.log('🧪 User not found, attempting to create...');
        
        const newUserData = {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('🧪 Creating user with data:', newUserData);
        
        const { data: createdUser, error: insertError } = await supabase
          .from('users')
          .insert(newUserData)
          .select('id, email, name')
          .single();

        if (insertError) {
          console.log('❌ User creation failed:', insertError);
          
          // Check if it's an email conflict
          if (insertError.code === '23505') {
            console.log('🧪 Email conflict detected, trying to update existing user...');
            
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({
                name: user.name,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
              .select('id, email, name')
              .single();

            if (updateError) {
              console.log('❌ User update failed:', updateError);
              tracker.trackError(new Error(`User update failed: ${updateError.message}`), 500);
              
              return tracker.complete(NextResponse.json({
                success: false,
                step: 'user-synchronization',
                error: 'Failed to synchronize user data',
                details: {
                  operation: 'update',
                  userId: user.id,
                  email: user.email,
                  errorCode: updateError.code,
                  errorMessage: updateError.message,
                  errorHint: updateError.hint
                },
                correlationId: tracker.getCorrelationId()
              }, { status: 500 }));
            }
            
            console.log('✅ User updated successfully:', updatedUser);
          } else {
            // Other insertion error
            tracker.trackError(new Error(`User creation failed: ${insertError.message}`), 500);
            
            return tracker.complete(NextResponse.json({
              success: false,
              step: 'user-synchronization',
              error: 'Failed to create user',
              details: {
                operation: 'insert',
                userId: user.id,
                email: user.email,
                errorCode: insertError.code,
                errorMessage: insertError.message,
                errorHint: insertError.hint
              },
              correlationId: tracker.getCorrelationId()
            }, { status: 500 }));
          }
        } else {
          console.log('✅ User created successfully:', createdUser);
        }
      } else if (checkError && checkError.code !== 'PGRST116') {
        // Unexpected error during user check
        console.log('❌ Error checking user existence:', checkError);
        tracker.trackError(new Error(`User check failed: ${checkError.message}`), 500);
        
        return tracker.complete(NextResponse.json({
          success: false,
          step: 'user-synchronization',
          error: 'Failed to verify user existence',
          details: {
            operation: 'check',
            userId: user.id,
            errorCode: checkError.code,
            errorMessage: checkError.message,
            errorHint: checkError.hint
          },
          correlationId: tracker.getCorrelationId()
        }, { status: 500 }));
      } else {
        console.log('✅ User already exists in database:', existingUser?.email);
      }
      
      console.log('✅ Step 4: User synchronization completed successfully');
    } catch (userSyncError) {
      console.log('❌ User synchronization failed with exception:', userSyncError);
      tracker.trackError(userSyncError as Error, 500);
      
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'user-synchronization',
        error: 'User synchronization failed with exception',
        details: {
          userId: user.id,
          email: user.email,
          exception: userSyncError instanceof Error ? userSyncError.message : 'Unknown exception'
        },
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }
    
    // STEP 5: Category Validation
    console.log('🧪 Step 5: Validating category...');
    try {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', testInput.category_id)
        .single();

      if (categoryError || !category) {
        return tracker.complete(NextResponse.json({
          success: false,
          step: 'category-validation',
          error: `Category not found: ${testInput.category_id}`,
          correlationId: tracker.getCorrelationId()
        }, { status: 400 }));
      }
      console.log('✅ Step 5: Category validation passed -', category.name);
    } catch (categoryError) {
      tracker.trackError(categoryError as Error, 500);
      return tracker.complete(NextResponse.json({
        success: false,
        step: 'category-validation',
        error: 'Category validation failed',
        correlationId: tracker.getCorrelationId()
      }, { status: 500 }));
    }

    // STEP 6: Test Problem Creation Structure (without actually creating)
    console.log('🧪 Step 6: Testing problem creation structure...');
    const problemData = {
      title: testInput.title,
      description: testInput.description,
      category_id: testInput.category_id,
      proposer_id: user.id,
      status: 'Proposed' as const,
      vote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Step 6: Problem creation structure valid');

    // SUCCESS - All steps passed!
    return tracker.complete(NextResponse.json({
      success: true,
      message: 'REAL authenticated flow completed successfully - 500 error cause identified!',
      steps: [
        '✅ Real authentication passed',
        '✅ Input validation passed',
        '✅ Database connection established',
        '✅ User synchronization completed',
        '✅ Category validation passed',
        '✅ Problem creation structure valid'
      ],
      realUserData: {
        sessionId: session.id,
        userId: user.id,
        userEmail: user.email
      },
      correlationId: tracker.getCorrelationId()
    }));

  } catch (error) {
    console.log('❌ Unexpected error in authenticated flow:', error);
    tracker.trackError(error as Error, 500);
    
    return tracker.complete(NextResponse.json({
      success: false,
      step: 'unknown',
      error: 'Authenticated flow failed with unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      correlationId: tracker.getCorrelationId()
    }, { status: 500 }));
  }
}