import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

// Track connected clients for vote updates
const clients = new Map<string, {
  controller: ReadableStreamDefaultController;
  problemIds: Set<string>;
  lastPing: number;
}>();

// Cleanup disconnected clients every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [clientId, client] of clients.entries()) {
    if (now - client.lastPing > 60000) { // 1 minute timeout
      try {
        client.controller.close();
      } catch (e) {
        // Client already disconnected
      }
      clients.delete(clientId);
    }
  }
}, 30000);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const problemIds = searchParams.get('problemIds')?.split(',') || [];
  
  // Validate problem IDs
  const validProblemIds = problemIds.filter(id => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
  );

  if (validProblemIds.length === 0) {
    return new Response('No valid problem IDs provided', { status: 400 });
  }

  // Generate unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store client connection
      clients.set(clientId, {
        controller,
        problemIds: new Set(validProblemIds),
        lastPing: Date.now()
      });

      // Send initial connection message
      const data = JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
        subscribedProblems: validProblemIds
      });

      controller.enqueue(`data: ${data}\n\n`);

      // Send initial vote counts for subscribed problems
      sendInitialVoteCounts(controller, validProblemIds);

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          const client = clients.get(clientId);
          if (client) {
            client.lastPing = Date.now();
            controller.enqueue(`data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`);
          } else {
            clearInterval(pingInterval);
          }
        } catch (error) {
          clearInterval(pingInterval);
          clients.delete(clientId);
        }
      }, 30000); // Ping every 30 seconds
    },
    
    cancel() {
      clients.delete(clientId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Function to broadcast vote updates to all connected clients
export async function broadcastVoteUpdate(problemId: string, newVoteCount: number, hasVoted: boolean, userId?: string) {
  const updateData = {
    type: 'vote_update',
    problemId,
    newVoteCount,
    hasVoted,
    userId,
    timestamp: new Date().toISOString()
  };

  const message = `data: ${JSON.stringify(updateData)}\n\n`;

  // Send to all clients subscribed to this problem
  for (const [clientId, client] of clients.entries()) {
    if (client.problemIds.has(problemId)) {
      try {
        client.controller.enqueue(message);
      } catch (error) {
        // Client disconnected, remove it
        clients.delete(clientId);
      }
    }
  }
}

// Function to send initial vote counts
async function sendInitialVoteCounts(controller: ReadableStreamDefaultController, problemIds: string[]) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get current vote counts for all subscribed problems
    const { data: problems, error } = await supabase
      .from('problems')
      .select('id, vote_count')
      .in('id', problemIds);

    if (error) {
      console.error('Error fetching initial vote counts:', error);
      return;
    }

    // Send initial vote counts
    for (const problem of problems || []) {
      const data = JSON.stringify({
        type: 'initial_vote_count',
        problemId: problem.id,
        voteCount: problem.vote_count,
        timestamp: new Date().toISOString()
      });

      controller.enqueue(`data: ${data}\n\n`);
    }
  } catch (error) {
    console.error('Error sending initial vote counts:', error);
  }
}

// Endpoint to trigger vote updates (called by voting API)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemId, newVoteCount, hasVoted, userId } = body;

    if (!problemId || typeof newVoteCount !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Broadcast the update to all connected clients
    await broadcastVoteUpdate(problemId, newVoteCount, hasVoted, userId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        broadcastTo: Array.from(clients.keys()).length,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vote update broadcast:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}