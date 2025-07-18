import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user and verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const problemId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(problemId)) {
      return NextResponse.json(
        { error: 'Invalid problem ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, reason, notes } = body;

    // Extended action validation for content management
    const validActions = ['approve', 'reject', 'feature', 'unfeature', 'flag', 'unflag', 'hide', 'restore'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Valid action is required: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if problem exists and get current state
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('moderation_status, is_featured, status, title, proposer_id')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Prepare updates based on action
    let updates: any = {};
    let newModerationStatus = problem.moderation_status;

    switch (action) {
      case 'approve':
        updates.moderation_status = 'approved';
        updates.status = 'open'; // Set to open for voting
        newModerationStatus = 'approved';
        break;
      
      case 'reject':
        updates.moderation_status = 'rejected';
        updates.status = 'rejected';
        newModerationStatus = 'rejected';
        break;
      
      case 'feature':
        updates.is_featured = true;
        // Also approve if pending
        if (problem.moderation_status === 'pending') {
          updates.moderation_status = 'approved';
          updates.status = 'open';
          newModerationStatus = 'approved';
        }
        break;
      
      case 'unfeature':
        updates.is_featured = false;
        break;
      
      case 'hide':
        updates.status = 'hidden';
        break;
      
      case 'restore':
        updates.status = 'open';
        break;
      
      case 'unflag':
        // Remove all pending flags for this problem
        await supabase
          .from('content_flags')
          .update({ status: 'resolved' })
          .eq('problem_id', problemId)
          .eq('status', 'pending');
        break;
      
      case 'flag':
        // This would typically be handled by user flag submissions
        updates.status = 'flagged';
        break;
    }

    // Update problem if there are changes
    if (Object.keys(updates).length > 0) {
      const { data: updatedProblem, error: updateError } = await supabase
        .from('problems')
        .update(updates)
        .eq('id', problemId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating problem:', updateError);
        return NextResponse.json(
          { error: 'Failed to update problem' },
          { status: 500 }
        );
      }
    }

    // Log moderation action in the new moderation_actions table
    try {
      await supabase
        .from('moderation_actions')
        .insert({
          problem_id: problemId,
          moderator_id: user.id,
          action_type: action,
          reason: reason || null,
          previous_status: problem.moderation_status,
          new_status: newModerationStatus,
          metadata: {
            previous_featured: problem.is_featured,
            new_featured: updates.is_featured !== undefined ? updates.is_featured : problem.is_featured,
            previous_problem_status: problem.status,
            new_problem_status: updates.status || problem.status,
            notes: notes || null
          }
        });
    } catch (logError) {
      console.error('Error logging moderation action:', logError);
      // Don't fail the request if logging fails
    }

    // Send notification to problem proposer for significant actions
    if (['approve', 'reject', 'feature', 'hide'].includes(action) && problem.proposer_id !== user.id) {
      try {
        const notificationMessages = {
          approve: `Your problem "${problem.title}" has been approved and is now open for voting.`,
          reject: `Your problem "${problem.title}" has been rejected. ${reason || 'Please review our community guidelines.'}`,
          feature: `Congratulations! Your problem "${problem.title}" has been featured on our platform.`,
          hide: `Your problem "${problem.title}" has been temporarily hidden pending review.`
        };

        await supabase
          .from('notifications')
          .insert({
            user_id: problem.proposer_id,
            type: 'moderation',
            title: `Problem ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : action === 'feature' ? 'Featured' : 'Hidden'}`,
            message: notificationMessages[action as keyof typeof notificationMessages],
            metadata: {
              problem_id: problemId,
              action_type: action,
              moderator_id: user.id
            }
          });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Recalculate quality score if problem was approved
    if (action === 'approve') {
      try {
        // Use direct SQL to calculate quality score since we don't have the function created yet
        const { data: qualityResult } = await supabase
          .from('problems')
          .select('title, description, vote_count, created_at')
          .eq('id', problemId)
          .single();

        if (qualityResult) {
          let qualityScore = 0;
          const titleLength = qualityResult.title?.length || 0;
          const descriptionLength = qualityResult.description?.length || 0;
          const voteCount = qualityResult.vote_count || 0;
          const daysSinceCreation = Math.floor(
            (Date.now() - new Date(qualityResult.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Base score from content completeness
          if (titleLength >= 10 && descriptionLength >= 50) {
            qualityScore += 40;
          } else if (titleLength >= 5 && descriptionLength >= 20) {
            qualityScore += 25;
          } else {
            qualityScore += 10;
          }

          // Add engagement score
          qualityScore += Math.min(voteCount * 2, 30);

          // Add freshness score
          if (daysSinceCreation <= 7) {
            qualityScore += 10;
          } else if (daysSinceCreation <= 30) {
            qualityScore += 5;
          }

          // Ensure score is between 0-100
          qualityScore = Math.min(Math.max(qualityScore, 0), 100);

          // Update quality metrics
          await supabase
            .from('content_quality_metrics')
            .upsert({
              problem_id: problemId,
              quality_score: qualityScore,
              calculated_at: new Date().toISOString()
            });

          // Update problem quality score
          await supabase
            .from('problems')
            .update({ quality_score: qualityScore })
            .eq('id', problemId);
        }
      } catch (qualityError) {
        console.error('Error calculating quality score:', qualityError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Problem ${action}ed successfully`,
      data: {
        problem_id: problemId,
        action,
        previous_status: problem.moderation_status,
        new_status: newModerationStatus,
        updates
      }
    });

  } catch (error) {
    console.error('Error in problem moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}