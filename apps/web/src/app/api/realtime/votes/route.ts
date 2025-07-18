import { NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

// Connection limits and management
const MAX_CONNECTIONS_PER_USER = 3;
const MAX_TOTAL_CONNECTIONS = 1000;
const CONNECTION_CLEANUP_INTERVAL = 60000; // 1 minute
const CLIENT_TIMEOUT = 120000; // 2 minutes

// Track connected clients for vote updates with enhanced management
const clients = new Map<string, {
  controller: ReadableStreamDefaultController;
  problemIds: Set<string>;
  lastPing: number;
  createdAt: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
}>();

// Connection pool management
class ConnectionPool {
  private userConnections = new Map<string, Set<string>>();
  
  addConnection(clientId: string, userId?: string): boolean {
    // Check total connection limit
    if (clients.size >= MAX_TOTAL_CONNECTIONS) {
      console.warn(`Total connection limit reached: ${clients.size}`);
      return false;
    }
    
    if (userId) {
      const userConns = this.userConnections.get(userId) || new Set();
      
      // Check per-user limit
      if (userConns.size >= MAX_CONNECTIONS_PER_USER) {
        console.warn(`User connection limit reached for ${userId}: ${userConns.size}`);
        return false;
      }
      
      userConns.add(clientId);
      this.userConnections.set(userId, userConns);
    }
    
    return true;
  }
  
  removeConnection(clientId: string, userId?: string): void {
    if (userId) {
      const userConns = this.userConnections.get(userId);
      if (userConns) {
        userConns.delete(clientId);
        if (userConns.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }
  }
  
  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
  
  getTotalConnections(): number {
    return clients.size;
  }
  
  cleanup(): void {
    const now = Date.now();
    const expiredClients: string[] = [];
    
    for (const [clientId, client] of clients.entries()) {
      if (now - client.lastPing > CLIENT_TIMEOUT || 
          now - client.createdAt > 24 * 60 * 60 * 1000) { // 24 hours max
        expiredClients.push(clientId);
      }
    }
    
    expiredClients.forEach(clientId => {
      const client = clients.get(clientId);
      if (client) {
        try {
          client.controller.close();
        } catch (e) {
          // Client already disconnected
        }
        this.removeConnection(clientId, client.userId);
        clients.delete(clientId);
      }
    });
    
    if (expiredClients.length > 0) {
      console.log(`Cleaned up ${expiredClients.length} expired connections`);
    }
  }
  
  getMetrics() {
    return {
      totalConnections: this.getTotalConnections(),
      userConnectionCounts: Object.fromEntries(this.userConnections.entries()),
      maxTotalConnections: MAX_TOTAL_CONNECTIONS,
      maxPerUser: MAX_CONNECTIONS_PER_USER,
    };
  }
}

const connectionPool = new ConnectionPool();

// Enhanced cleanup with connection pooling
setInterval(() => {
  connectionPool.cleanup();
}, CONNECTION_CLEANUP_INTERVAL);

// Memory usage monitoring
setInterval(() => {
  const metrics = connectionPool.getMetrics();
  if (metrics.totalConnections > MAX_TOTAL_CONNECTIONS * 0.8) {
    console.warn(`High connection usage: ${metrics.totalConnections}/${MAX_TOTAL_CONNECTIONS}`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

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

  // Extract user info for connection management
  const userId = extractUserIdFromRequest(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = extractClientIP(request);

  // Generate unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check connection limits
  if (!connectionPool.addConnection(clientId, userId)) {
    return new Response('Connection limit exceeded', { status: 429 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store client connection with enhanced metadata
      clients.set(clientId, {
        controller,
        problemIds: new Set(validProblemIds),
        lastPing: Date.now(),
        createdAt: Date.now(),
        userId,
        userAgent,
        ip
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
      const client = clients.get(clientId);
      if (client) {
        connectionPool.removeConnection(clientId, client.userId);
      }
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
async function broadcastVoteUpdate(problemId: string, newVoteCount: number, hasVoted: boolean, userId?: string) {
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
        // Client disconnected, remove it properly
        const client = clients.get(clientId);
        if (client) {
          connectionPool.removeConnection(clientId, client.userId);
        }
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

// Utility functions for user extraction and IP detection
function extractUserIdFromRequest(request: NextRequest): string | undefined {
  // Try to extract user ID from session cookie or auth header
  const sessionCookie = request.cookies.get('sb-access-token');
  if (sessionCookie) {
    try {
      // This is a placeholder - implement actual JWT decode
      // For now, use a hash of the token as user identifier
      return sessionCookie.value.substring(0, 10);
    } catch (error) {
      console.warn('Failed to extract user ID from session:', error);
    }
  }
  
  return undefined;
}

function extractClientIP(request: NextRequest): string {
  // Try multiple headers for getting real client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  return 'unknown';
}

// Health check endpoint for real-time system
export async function OPTIONS(request: NextRequest) {
  const metrics = connectionPool.getMetrics();
  
  return new Response(JSON.stringify({
    status: 'healthy',
    metrics,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}