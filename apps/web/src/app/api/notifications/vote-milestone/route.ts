import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/NotificationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemId, newVoteCount, oldVoteCount } = body;

    if (!problemId || typeof newVoteCount !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: problemId and newVoteCount' },
        { status: 400 }
      );
    }

    // Check which milestones were crossed
    const milestones = [50, 75, 100];
    const milestonesToNotify: number[] = [];

    for (const milestone of milestones) {
      // If we crossed this milestone (new count >= milestone but old count < milestone)
      if (newVoteCount >= milestone && (oldVoteCount || 0) < milestone) {
        milestonesToNotify.push(milestone);
      }
    }

    const results = [];

    // Send notifications for each milestone crossed
    for (const milestone of milestonesToNotify) {
      try {
        console.log(`Sending milestone notification for problem ${problemId}, milestone ${milestone}`);
        
        if (milestone === 100) {
          // Send admin alert for 100 votes
          const adminNotificationIds = await notificationService.sendAdminAlert(problemId);
          results.push({
            type: 'admin_alert',
            milestone: 100,
            notificationIds: adminNotificationIds,
            success: true
          });
        }

        // Send user milestone notification
        const userNotificationId = await notificationService.sendVoteMilestoneNotification(
          problemId,
          milestone
        );
        
        results.push({
          type: 'vote_milestone',
          milestone,
          notificationId: userNotificationId,
          success: true
        });

        // Trigger workflow status update for vote milestone
        try {
          const workflowResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflow/status-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId,
              newVoteCount
            })
          });

          const workflowResult = await workflowResponse.json();
          
          results.push({
            type: 'workflow_update',
            milestone,
            workflowResult,
            success: workflowResponse.ok
          });

          console.log(`Workflow update triggered for problem ${problemId} at milestone ${milestone}:`, workflowResult);
        } catch (workflowError) {
          console.error(`Error triggering workflow update for milestone ${milestone}:`, workflowError);
          results.push({
            type: 'workflow_update',
            milestone,
            error: workflowError instanceof Error ? workflowError.message : 'Unknown workflow error',
            success: false
          });
        }

      } catch (error) {
        console.error(`Error sending milestone ${milestone} notification:`, error);
        results.push({
          type: 'vote_milestone',
          milestone,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      problemId,
      oldVoteCount: oldVoteCount || 0,
      newVoteCount,
      milestonesTriggered: milestonesToNotify,
      results
    });

  } catch (error) {
    console.error('Error in vote milestone notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}