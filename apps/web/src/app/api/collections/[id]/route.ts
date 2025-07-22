import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth-nextauth';

// Collection Manager (temporary mock implementation without database)
class CollectionManager {
  async getCollection(collectionId: string, includeProblems: boolean = true): Promise<any> {
    try {
      // Mock collection data since database is not available
      const collection = {
        id: collectionId,
        name: `Collection ${collectionId}`,
        description: 'This is a mock collection while database is unavailable',
        curator_id: 'mock-user',
        is_featured: false,
        is_public: true,
        collection_type: 'manual',
        criteria: null,
        display_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        curator: { name: 'Mock User' },
        items_count: 0,
        problems: includeProblems ? [] : undefined
      };

      return collection;

    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  async getCollectionProblems(collectionId: string, limit?: number): Promise<any[]> {
    try {
      // Mock empty problems array since database is not available
      return [];

    } catch (error) {
      console.error('Error getting collection problems:', error);
      throw error;
    }
  }

  async updateCollection(collectionId: string, updates: any): Promise<any> {
    try {
      // Mock successful update since database is not available
      console.log('Mock updating collection:', collectionId, updates);
      return { id: collectionId, ...updates, updated_at: new Date().toISOString() };

    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      // Mock successful deletion since database is not available
      console.log('Mock deleting collection:', collectionId);

    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  async addProblemsToCollection(
    collectionId: string, 
    problemIds: string[], 
    addedById?: string
  ): Promise<void> {
    try {
      // Mock successful addition since database is not available
      console.log('Mock adding problems to collection:', collectionId, problemIds, addedById);

    } catch (error) {
      console.error('Error adding problems to collection:', error);
      throw error;
    }
  }

  async removeProblemsFromCollection(
    collectionId: string, 
    problemIds: string[]
  ): Promise<void> {
    try {
      // Mock successful removal since database is not available
      console.log('Mock removing problems from collection:', collectionId, problemIds);

    } catch (error) {
      console.error('Error removing problems from collection:', error);
      throw error;
    }
  }

  async updateCollectionOrder(
    collectionId: string, 
    problemOrders: { problem_id: string; order: number }[]
  ): Promise<void> {
    try {
      // Mock successful order update since database is not available
      console.log('Mock updating collection order:', collectionId, problemOrders);

    } catch (error) {
      console.error('Error updating collection order:', error);
      throw error;
    }
  }

  async trackCollectionView(collectionId: string, userId?: string): Promise<void> {
    try {
      // Mock analytics tracking since database is not available
      console.log('Mock tracking collection view:', collectionId, userId);
    } catch (error) {
      console.error('Error tracking collection view:', error);
    }
  }

  async checkCollectionPermission(collectionId: string, userId?: string): Promise<{
    canView: boolean;
    canEdit: boolean;
    collection: any;
  }> {
    try {
      // Mock permission check since database is not available
      // Allow all operations for now
      const mockCollection = {
        id: collectionId,
        curator_id: 'mock-user',
        is_public: true
      };

      return { 
        canView: true, 
        canEdit: true, 
        collection: mockCollection 
      };

    } catch (error) {
      console.error('Error checking collection permission:', error);
      return { canView: false, canEdit: false, collection: null };
    }
  }
}

// GET endpoint - Fetch specific collection
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const collectionId = params.id;
    const url = new URL(request.url);
    const includeProblems = url.searchParams.get('include_problems') !== 'false';

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const manager = new CollectionManager();
    
    // Check authentication using NextAuth
    const session = await auth();
    const userId = session?.user?.id;

    const { canView, collection: permissionCollection } = await manager.checkCollectionPermission(
      collectionId, 
      userId
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Collection not found or access denied' },
        { status: 404 }
      );
    }

    // Get full collection data
    const collection = await manager.getCollection(collectionId, includeProblems);

    // Track collection view
    await manager.trackCollectionView(collectionId, userId);

    return NextResponse.json({
      success: true,
      data: collection,
      metadata: {
        collection_id: collectionId,
        fetched_at: new Date().toISOString(),
        included_problems: includeProblems
      }
    });

  } catch (error) {
    console.error('Error in collection GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// PUT endpoint - Update collection
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const collectionId = params.id;
    const body = await request.json();

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const manager = new CollectionManager();
    
    // Check edit permissions
    const { canEdit } = await manager.checkCollectionPermission(collectionId, user.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update collection
    const allowedUpdates = ['name', 'description', 'is_public', 'criteria', 'display_order'];
    const updates = Object.keys(body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedCollection = await manager.updateCollection(collectionId, updates);

    return NextResponse.json({
      success: true,
      data: updatedCollection,
      message: 'Collection updated successfully'
    });

  } catch (error) {
    console.error('Error in collection PUT:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const manager = new CollectionManager();
    
    // Check edit permissions
    const { canEdit } = await manager.checkCollectionPermission(collectionId, user.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Delete collection
    await manager.deleteCollection(collectionId);

    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully'
    });

  } catch (error) {
    console.error('Error in collection DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - Manage collection items (add/remove problems, reorder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    const collectionId = params.id;
    const body = await request.json();
    const { action, problem_ids, problem_orders } = body;

    if (!collectionId) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    const manager = new CollectionManager();
    
    // Check edit permissions
    const { canEdit } = await manager.checkCollectionPermission(collectionId, user.id);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'add_problems':
        if (!problem_ids || !Array.isArray(problem_ids)) {
          return NextResponse.json(
            { error: 'problem_ids array is required for add_problems action' },
            { status: 400 }
          );
        }
        await manager.addProblemsToCollection(collectionId, problem_ids, user.id);
        break;

      case 'remove_problems':
        if (!problem_ids || !Array.isArray(problem_ids)) {
          return NextResponse.json(
            { error: 'problem_ids array is required for remove_problems action' },
            { status: 400 }
          );
        }
        await manager.removeProblemsFromCollection(collectionId, problem_ids);
        break;

      case 'reorder_problems':
        if (!problem_orders || !Array.isArray(problem_orders)) {
          return NextResponse.json(
            { error: 'problem_orders array is required for reorder_problems action' },
            { status: 400 }
          );
        }
        await manager.updateCollectionOrder(collectionId, problem_orders);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: add_problems, remove_problems, reorder_problems' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Collection ${action} completed successfully`
    });

  } catch (error) {
    console.error('Error in collection PATCH:', error);
    return NextResponse.json(
      { error: `Failed to perform ${body.action || 'collection operation'}` },
      { status: 500 }
    );
  }
}