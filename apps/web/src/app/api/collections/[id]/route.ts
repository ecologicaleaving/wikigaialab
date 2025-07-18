import { NextRequest, NextResponse } from 'next/server';
import { supabase, withErrorHandling, getUser } from '../../../../lib/supabase';

// Collection Manager (imported from parent route)
class CollectionManager {
  async getCollection(collectionId: string, includeProblems: boolean = true): Promise<any> {
    try {
      // Get collection details
      const { data: collection, error } = await supabase
        .from('problem_collections')
        .select(`
          id,
          name,
          description,
          curator_id,
          is_featured,
          is_public,
          collection_type,
          criteria,
          display_order,
          created_at,
          updated_at,
          users:curator_id (
            name
          )
        `)
        .eq('id', collectionId)
        .single();

      if (error) throw error;
      if (!collection) throw new Error('Collection not found');

      // Get items count
      const { data: items, error: itemsError } = await supabase
        .from('collection_items')
        .select('id')
        .eq('collection_id', collectionId);

      const itemsCount = itemsError ? 0 : (items?.length || 0);

      let problems = [];
      if (includeProblems) {
        problems = await this.getCollectionProblems(collectionId);
      }

      return {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        curator_id: collection.curator_id,
        is_featured: collection.is_featured,
        is_public: collection.is_public,
        collection_type: collection.collection_type,
        criteria: collection.criteria,
        display_order: collection.display_order,
        created_at: collection.created_at,
        updated_at: collection.updated_at,
        curator: { name: (collection.users as any)?.name || 'Anonymous' },
        items_count: itemsCount,
        problems: problems
      };

    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  async getCollectionProblems(collectionId: string, limit?: number): Promise<any[]> {
    try {
      let query = supabase
        .from('collection_items')
        .select(`
          item_order,
          added_at,
          problems!inner (
            id,
            title,
            description,
            category_id,
            vote_count,
            created_at,
            categories:category_id (
              name
            ),
            users:proposer_id (
              name
            )
          )
        `)
        .eq('collection_id', collectionId)
        .order('item_order');

      if (limit) {
        query = query.limit(limit);
      }

      const { data: items, error } = await query;

      if (error) throw error;

      return (items || []).map(item => {
        const problem = item.problems as any;
        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          category_id: problem.category_id,
          vote_count: problem.vote_count,
          created_at: problem.created_at,
          item_order: item.item_order,
          added_at: item.added_at,
          category: { name: problem.categories?.name || 'Unknown' },
          proposer: { name: problem.users?.name || 'Anonymous' }
        };
      });

    } catch (error) {
      console.error('Error getting collection problems:', error);
      throw error;
    }
  }

  async updateCollection(collectionId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('problem_collections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', collectionId)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      // Delete collection items first (CASCADE should handle this, but explicit is better)
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId);

      // Delete the collection
      const { error } = await supabase
        .from('problem_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

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
      // Get current max order
      const { data: maxOrder, error: maxOrderError } = await supabase
        .from('collection_items')
        .select('item_order')
        .eq('collection_id', collectionId)
        .order('item_order', { ascending: false })
        .limit(1)
        .single();

      const startOrder = maxOrderError ? 0 : ((maxOrder?.item_order || 0) + 1);

      // Create collection items
      const items = problemIds.map((problemId, index) => ({
        collection_id: collectionId,
        problem_id: problemId,
        item_order: startOrder + index,
        added_at: new Date().toISOString(),
        added_by_id: addedById || null
      }));

      const { error } = await supabase
        .from('collection_items')
        .insert(items);

      if (error) throw error;

      // Update collection updated_at
      await supabase
        .from('problem_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

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
      const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .in('problem_id', problemIds);

      if (error) throw error;

      // Update collection updated_at
      await supabase
        .from('problem_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

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
      for (const { problem_id, order } of problemOrders) {
        await supabase
          .from('collection_items')
          .update({ item_order: order })
          .eq('collection_id', collectionId)
          .eq('problem_id', problem_id);
      }

      // Update collection updated_at
      await supabase
        .from('problem_collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

    } catch (error) {
      console.error('Error updating collection order:', error);
      throw error;
    }
  }

  async trackCollectionView(collectionId: string, userId?: string): Promise<void> {
    try {
      await supabase
        .from('discovery_analytics')
        .insert({
          user_id: userId || null,
          discovery_method: 'collection',
          source_id: collectionId,
          session_id: `collection_${Date.now()}`,
          created_at: new Date().toISOString()
        });
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
      const { data: collection, error } = await supabase
        .from('problem_collections')
        .select('id, curator_id, is_public')
        .eq('id', collectionId)
        .single();

      if (error || !collection) {
        return { canView: false, canEdit: false, collection: null };
      }

      const canView = collection.is_public || collection.curator_id === userId;
      const canEdit = collection.curator_id === userId;

      return { canView, canEdit, collection };

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
    
    // Check permissions
    const user = await getUser();
    const { canView, collection: permissionCollection } = await manager.checkCollectionPermission(
      collectionId, 
      user?.id
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
    await manager.trackCollectionView(collectionId, user?.id);

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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