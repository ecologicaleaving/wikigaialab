import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';
import { z } from 'zod';
import { notificationService } from '@/lib/notifications/NotificationService';

// Problem status progression based on vote milestones
const STATUS_THRESHOLDS = {
  50: 'Under Review' as const,
  75: 'Priority Queue' as const,
  100: 'In Development' as const
} as const;

// Valid status transitions
const VALID_TRANSITIONS = {
  'Proposed': ['Under Review', 'Rejected'],
  'Under Review': ['Priority Queue', 'Rejected'],
  'Priority Queue': ['In Development', 'Rejected'],
  'In Development': ['Completed', 'Rejected'],
  'Completed': [],
  'Rejected': []
} as const;

type ProblemStatus = keyof typeof VALID_TRANSITIONS;

interface StatusUpdateRequest {
  problemId: string;
  newVoteCount: number;
  adminOverride?: boolean;
  targetStatus?: ProblemStatus;
  reason?: string;
}

const statusUpdateSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  newVoteCount: z.number().min(0, 'Vote count must be non-negative'),
  adminOverride: z.boolean().optional(),
  targetStatus: z.enum(['Proposed', 'Under Review', 'Priority Queue', 'In Development', 'Completed', 'Rejected']).optional(),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional()
});

/**
 * Automatic status update based on vote milestones
 * Also handles admin manual status changes
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Parse and validate request body
    const body = await request.json();
    const validation = statusUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { problemId, newVoteCount, adminOverride, targetStatus, reason } = validation.data;
    
    // Get authenticated user for admin operations
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Admin override requires authentication
    if (adminOverride && (!user || authError)) {
      return NextResponse.json(
        { error: 'Admin authentication required for manual status changes' },
        { status: 401 }
      );
    }
    
    // Verify admin permissions for manual changes
    if (adminOverride && user) {
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (adminError || !adminUser?.is_admin) {
        return NextResponse.json(
          { error: 'Admin privileges required for manual status changes' },
          { status: 403 }
        );
      }
    }
    
    // Get current problem data
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        status,
        vote_count,
        proposer_id,
        category_id,
        created_at,
        proposer:users!proposer_id(id, name, email),
        category:categories!category_id(id, name)
      `)
      .eq('id', problemId)
      .single();
    
    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    let newStatus: ProblemStatus = problem.status as ProblemStatus;
    let statusChanged = false;
    let workflowAction = 'none';
    
    if (adminOverride && targetStatus) {
      // Admin manual status change
      if (!VALID_TRANSITIONS[problem.status as ProblemStatus].includes(targetStatus)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${problem.status} to ${targetStatus}` },
          { status: 400 }
        );
      }
      
      newStatus = targetStatus;
      statusChanged = true;
      workflowAction = 'admin_override';
      
    } else {
      // Automatic status progression based on vote milestones
      const currentStatus = problem.status as ProblemStatus;
      
      // Only auto-progress if status allows it (not Completed or Rejected)
      if (currentStatus !== 'Completed' && currentStatus !== 'Rejected') {
        // Check if we've hit a new threshold
        for (const [threshold, status] of Object.entries(STATUS_THRESHOLDS)) {
          const voteThreshold = parseInt(threshold);
          
          if (newVoteCount >= voteThreshold && problem.vote_count < voteThreshold) {
            // We've crossed this threshold
            if (VALID_TRANSITIONS[currentStatus].includes(status)) {
              newStatus = status;
              statusChanged = true;
              workflowAction = 'milestone_triggered';
              break;
            }
          }
        }
      }
    }
    
    const results: any = {
      problemId,
      previousStatus: problem.status,
      newStatus,
      statusChanged,
      workflowAction,
      voteCount: newVoteCount
    };
    
    if (statusChanged) {
      // Update problem status
      const { error: updateError } = await supabase
        .from('problems')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', problemId);
      
      if (updateError) {
        console.error('Error updating problem status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update problem status' },
          { status: 500 }
        );
      }
      
      // Log workflow action
      await supabase
        .from('workflow_logs')
        .insert({
          problem_id: problemId,
          previous_status: problem.status,
          new_status: newStatus,
          trigger_type: workflowAction,
          triggered_by: adminOverride ? user?.id : null,
          vote_count_at_change: newVoteCount,
          reason: reason || null,
          created_at: new Date().toISOString()
        });
      
      // Send status change notifications
      try {
        await notificationService.sendStatusChangeNotification(
          problemId,
          problem.status,
          newStatus,
          {
            triggerType: workflowAction,
            voteCount: newVoteCount,
            adminUser: adminOverride ? user?.id : null,
            reason
          }
        );
        
        results.notificationSent = true;
      } catch (notificationError) {
        console.error('Error sending status change notification:', notificationError);
        results.notificationSent = false;
        results.notificationError = notificationError instanceof Error ? notificationError.message : 'Unknown error';
      }
      
      // Add to development queue if moved to "In Development"
      if (newStatus === 'In Development') {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflow/development-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId,
              priority: newVoteCount >= 100 ? 'high' : 'medium',
              addedBy: workflowAction
            })
          });
          
          results.addedToDevQueue = true;
        } catch (queueError) {
          console.error('Error adding to development queue:', queueError);
          results.addedToDevQueue = false;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      ...results
    });
    
  } catch (error) {
    console.error('Error in workflow status update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get workflow information for a problem
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    
    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get problem with workflow data
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select(`
        id,
        title,
        status,
        vote_count,
        created_at,
        updated_at
      `)
      .eq('id', problemId)
      .single();
    
    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    // Get workflow logs
    const { data: workflowLogs, error: logsError } = await supabase
      .from('workflow_logs')
      .select(`
        id,
        previous_status,
        new_status,
        trigger_type,
        vote_count_at_change,
        reason,
        created_at,
        triggered_by_user:users!triggered_by(id, name)
      `)
      .eq('problem_id', problemId)
      .order('created_at', { ascending: false });
    
    // Calculate next milestone and required votes
    const currentVotes = problem.vote_count;
    const nextMilestone = Object.keys(STATUS_THRESHOLDS)
      .map(Number)
      .find(threshold => currentVotes < threshold);
    
    const nextStatus = nextMilestone ? STATUS_THRESHOLDS[nextMilestone as keyof typeof STATUS_THRESHOLDS] : null;
    const votesNeeded = nextMilestone ? nextMilestone - currentVotes : null;
    
    // Get development queue status if applicable
    let developmentQueueInfo = null;
    if (problem.status === 'In Development') {
      const { data: queueInfo } = await supabase
        .from('development_queue')
        .select('priority, queue_position, estimated_completion')
        .eq('problem_id', problemId)
        .single();
      
      developmentQueueInfo = queueInfo;
    }
    
    return NextResponse.json({
      success: true,
      problem: {
        ...problem,
        nextMilestone,
        nextStatus,
        votesNeeded,
        developmentQueueInfo
      },
      workflowHistory: workflowLogs || [],
      statusThresholds: STATUS_THRESHOLDS,
      validTransitions: VALID_TRANSITIONS[problem.status as ProblemStatus]
    });
    
  } catch (error) {
    console.error('Error getting workflow information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}