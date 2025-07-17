import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';
import { z } from 'zod';

type QueuePriority = 'low' | 'medium' | 'high' | 'urgent';

const addToQueueSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  addedBy: z.string().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional()
});

const updateQueueSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  queuePosition: z.number().min(1).optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  estimatedCompletion: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['queued', 'in_progress', 'completed', 'blocked']).optional()
});

/**
 * Add problem to development queue
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Parse and validate request
    const body = await request.json();
    const validation = addToQueueSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { problemId, priority, addedBy, estimatedHours, notes } = validation.data;
    
    // Verify problem exists and is in development status
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('id, title, status, vote_count')
      .eq('id', problemId)
      .single();
    
    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    if (problem.status !== 'In Development') {
      return NextResponse.json(
        { error: 'Problem must be in "In Development" status to be added to queue' },
        { status: 400 }
      );
    }
    
    // Check if already in queue
    const { data: existingQueueItem } = await supabase
      .from('development_queue')
      .select('id')
      .eq('problem_id', problemId)
      .single();
    
    if (existingQueueItem) {
      return NextResponse.json(
        { error: 'Problem is already in development queue' },
        { status: 409 }
      );
    }
    
    // Calculate queue position based on priority
    const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
    const currentPriorityValue = priorityOrder[priority];
    
    // Get the last position for this priority level
    const { data: lastInPriority, error: positionError } = await supabase
      .from('development_queue')
      .select('queue_position')
      .eq('priority', priority)
      .order('queue_position', { ascending: false })
      .limit(1)
      .single();
    
    let newPosition = 1;
    if (!positionError && lastInPriority) {
      newPosition = lastInPriority.queue_position + 1;
    } else {
      // Find the appropriate position considering all priorities
      const { data: allItems, error: allItemsError } = await supabase
        .from('development_queue')
        .select('queue_position, priority')
        .order('queue_position', { ascending: true });
      
      if (!allItemsError && allItems) {
        // Find where to insert based on priority
        let insertPosition = 1;
        for (const item of allItems) {
          const itemPriorityValue = priorityOrder[item.priority as QueuePriority];
          if (currentPriorityValue <= itemPriorityValue) {
            insertPosition = item.queue_position;
            break;
          }
          insertPosition = item.queue_position + 1;
        }
        newPosition = insertPosition;
        
        // Update positions of items that need to be moved down
        if (allItems.some(item => item.queue_position >= newPosition)) {
          await supabase.rpc('increment_queue_positions', {
            start_position: newPosition
          });
        }
      }
    }
    
    // Calculate estimated completion based on queue position and hours
    const estimatedCompletion = estimatedHours 
      ? new Date(Date.now() + (newPosition * estimatedHours * 60 * 60 * 1000)).toISOString()
      : null;
    
    // Add to development queue
    const { data: queueItem, error: insertError } = await supabase
      .from('development_queue')
      .insert({
        problem_id: problemId,
        priority,
        queue_position: newPosition,
        status: 'queued',
        estimated_hours: estimatedHours,
        estimated_completion: estimatedCompletion,
        notes,
        added_by: addedBy,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (insertError) {
      console.error('Error adding to development queue:', insertError);
      return NextResponse.json(
        { error: 'Failed to add to development queue' },
        { status: 500 }
      );
    }
    
    // Log the queue action
    await supabase
      .from('workflow_logs')
      .insert({
        problem_id: problemId,
        previous_status: problem.status,
        new_status: problem.status, // Status doesn't change
        trigger_type: 'queue_added',
        vote_count_at_change: problem.vote_count,
        reason: `Added to development queue with ${priority} priority`,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      queueItem,
      message: `Problem added to development queue at position ${newPosition} with ${priority} priority`
    });
    
  } catch (error) {
    console.error('Error adding to development queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get development queue with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const priority = searchParams.get('priority') as QueuePriority | null;
    const status = searchParams.get('status');
    const adminView = searchParams.get('adminView') === 'true';
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // For admin view, check permissions
    if (adminView) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required for admin view' },
          { status: 401 }
        );
      }
      
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (adminError || !adminUser?.is_admin) {
        return NextResponse.json(
          { error: 'Admin privileges required' },
          { status: 403 }
        );
      }
    }
    
    // Build query
    let query = supabase
      .from('development_queue')
      .select(`
        *,
        problem:problems!problem_id(
          id,
          title,
          description,
          vote_count,
          created_at,
          proposer:users!proposer_id(id, name),
          category:categories!category_id(id, name)
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('queue_position', { ascending: true });
    
    const { data: queueItems, error: queueError, count } = await query;
    
    if (queueError) {
      console.error('Error fetching development queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to fetch development queue' },
        { status: 500 }
      );
    }
    
    // Get queue statistics
    const { data: stats, error: statsError } = await supabase
      .from('development_queue')
      .select('priority, status')
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const statistics = {
          total: data?.length || 0,
          byPriority: {
            urgent: data?.filter(item => item.priority === 'urgent').length || 0,
            high: data?.filter(item => item.priority === 'high').length || 0,
            medium: data?.filter(item => item.priority === 'medium').length || 0,
            low: data?.filter(item => item.priority === 'low').length || 0
          },
          byStatus: {
            queued: data?.filter(item => item.status === 'queued').length || 0,
            in_progress: data?.filter(item => item.status === 'in_progress').length || 0,
            completed: data?.filter(item => item.status === 'completed').length || 0,
            blocked: data?.filter(item => item.status === 'blocked').length || 0
          }
        };
        
        return { data: statistics, error: null };
      });
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      success: true,
      queue: queueItems || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: count || 0,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      statistics: stats || {
        total: 0,
        byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
        byStatus: { queued: 0, in_progress: 0, completed: 0, blocked: 0 }
      }
    });
    
  } catch (error) {
    console.error('Error fetching development queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update queue item (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    const validation = updateQueueSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { problemId, ...updateData } = validation.data;
    
    // Get current queue item
    const { data: queueItem, error: queueError } = await supabase
      .from('development_queue')
      .select('*')
      .eq('problem_id', problemId)
      .single();
    
    if (queueError || !queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }
    
    // Handle position changes
    if (updateData.queuePosition && updateData.queuePosition !== queueItem.queue_position) {
      // This would require more complex logic to reorder queue items
      // For now, we'll implement priority changes which affect ordering
      return NextResponse.json(
        { error: 'Position reordering not yet implemented. Use priority changes instead.' },
        { status: 400 }
      );
    }
    
    // Update the queue item
    const { data: updatedItem, error: updateError } = await supabase
      .from('development_queue')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('problem_id', problemId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('Error updating queue item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update queue item' },
        { status: 500 }
      );
    }
    
    // Log the change
    await supabase
      .from('workflow_logs')
      .insert({
        problem_id: problemId,
        previous_status: 'In Development',
        new_status: 'In Development',
        trigger_type: 'queue_updated',
        triggered_by: user.id,
        reason: `Queue item updated by admin`,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      queueItem: updatedItem,
      message: 'Queue item updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating queue item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove from development queue (admin only)
 */
export async function DELETE(request: NextRequest) {
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
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (adminError || !adminUser?.is_admin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Remove from queue
    const { error: deleteError } = await supabase
      .from('development_queue')
      .delete()
      .eq('problem_id', problemId);
    
    if (deleteError) {
      console.error('Error removing from queue:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove from development queue' },
        { status: 500 }
      );
    }
    
    // Log the removal
    await supabase
      .from('workflow_logs')
      .insert({
        problem_id: problemId,
        previous_status: 'In Development',
        new_status: 'In Development',
        trigger_type: 'queue_removed',
        triggered_by: user.id,
        reason: 'Removed from development queue by admin',
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      message: 'Problem removed from development queue'
    });
    
  } catch (error) {
    console.error('Error removing from development queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}