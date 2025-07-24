/**
 * User ID Migration API Endpoint
 * 
 * Administrative endpoint for executing the user ID unification migration.
 * This endpoint is protected and should only be accessible to administrators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-nextauth';
import { 
  createUserIdMigration, 
  analyzeUserIdConsistency 
} from '@/lib/migrations/user-id-unification';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Note: In a production system, you'd check admin status from the database
    // For now, we'll allow analysis for any authenticated user in development
    if (process.env.NODE_ENV === 'production' && !session.user.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required'
      }, { status: 403 });
    }

    // Analyze user data consistency
    const analysis = await analyzeUserIdConsistency();

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        migration: {
          available: true,
          recommended: analysis.inconsistentUsers > 0,
          urgent: analysis.duplicateEmails > 0
        }
      }
    });

  } catch (error) {
    console.error('Migration analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Strict admin check for POST operations
    if (!session.user.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required for migration execution'
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      dryRun = true, 
      batchSize = 50, 
      skipValidation = false,
      action = 'execute'
    } = body;

    console.log('🔄 Migration API called by admin:', {
      userId: session.user.id,
      email: session.user.email,
      action,
      dryRun,
      batchSize
    });

    if (action === 'analyze') {
      // Detailed analysis for admin interface
      const migration = createUserIdMigration({ dryRun: true });
      const detailedAnalysis = await migration.analyzeUsers();

      return NextResponse.json({
        success: true,
        data: {
          action: 'analyze',
          analysis: detailedAnalysis,
          recommendations: {
            canProceed: detailedAnalysis.duplicateEmails.length === 0,
            shouldProceed: detailedAnalysis.usersWithInconsistentIds.length > 0,
            issues: detailedAnalysis.duplicateEmails.length > 0 
              ? ['Duplicate emails must be resolved before migration']
              : []
          }
        }
      });
    }

    if (action === 'execute') {
      // Execute migration
      const migration = createUserIdMigration({
        dryRun,
        batchSize,
        skipValidation
      });

      const result = await migration.executeMigration();

      console.log('🔄 Migration completed:', {
        success: result.success,
        usersProcessed: result.usersProcessed,
        usersUpdated: result.usersUpdated,
        errorCount: result.errors.length,
        duration: result.duration,
        correlationId: result.correlationId
      });

      return NextResponse.json({
        success: result.success,
        data: {
          action: 'execute',
          result,
          summary: {
            usersProcessed: result.usersProcessed,
            usersUpdated: result.usersUpdated,
            errorCount: result.errors.length,
            duration: `${result.duration}ms`,
            correlationId: result.correlationId
          }
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "analyze" or "execute"'
    }, { status: 400 });

  } catch (error) {
    console.error('Migration execution error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Rollback endpoint (separate from main migration)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin privileges required for rollback operations'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter required for rollback'
      }, { status: 400 });
    }

    console.log('🔄 Rollback requested by admin:', {
      adminUserId: session.user.id,
      targetEmail: email
    });

    const migration = createUserIdMigration({ dryRun: false });
    await migration.rollbackUser(email);

    return NextResponse.json({
      success: true,
      data: {
        action: 'rollback',
        email,
        message: 'User migration rolled back successfully'
      }
    });

  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json({
      success: false,
      error: 'Rollback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}