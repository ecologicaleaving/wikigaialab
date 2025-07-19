import { NextRequest, NextResponse } from 'next/server';
import { supabase, withErrorHandling, getUser } from '../../../lib/supabase';

// Types for collections system
interface Collection {
  id: string;
  name: string;
  description: string;
  curator_id: string;
  is_featured: boolean;
  is_public: boolean;
  collection_type: 'manual' | 'auto_trending' | 'auto_category' | 'auto_recommended';
  criteria: any;
  display_order: number;
  created_at: string;
  updated_at: string;
  curator: {
    name: string;
  };
  items_count: number;
  problems?: CollectionProblem[];
}

interface CollectionProblem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  vote_count: number;
  created_at: string;
  item_order: number;
  added_at: string;
  category: {
    name: string;
  };
  proposer: {
    name: string;
  };
}

interface CreateCollectionRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  collection_type?: 'manual' | 'auto_trending' | 'auto_category' | 'auto_recommended';
  criteria?: any;
  problem_ids?: string[];
}

// Collection Management Engine
class CollectionManager {
  // Get all public collections with optional filtering
  async getCollections(options: {
    includeProblems?: boolean;
    featuredOnly?: boolean;
    curatorId?: string;
    collectionType?: string;
    limit?: number;
  } = {}): Promise<Collection[]> {
    try {
      let query = supabase
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
        .eq('is_public', true)
        .order('display_order');

      if (options.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (options.curatorId) {
        query = query.eq('curator_id', options.curatorId);
      }

      if (options.collectionType) {
        query = query.eq('collection_type', options.collectionType);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: collections, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array instead of failing
        if (error.message?.includes('does not exist') || error.code === 'PGRST200') {
          console.warn('Collections table not found, returning empty collections');
          return [];
        }
        throw error;
      }

      // Get item counts for each collection
      const collectionsWithCounts = await Promise.all(
        (collections || []).map(async (collection) => {
          const { data: items, error: itemsError } = await supabase
            .from('collection_items')
            .select('id')
            .eq('collection_id', collection.id);

          const itemsCount = itemsError ? 0 : (items?.length || 0);

          let problems: CollectionProblem[] = [];
          
          if (options.includeProblems) {
            problems = await this.getCollectionProblems(collection.id);
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
        })
      );

      return collectionsWithCounts;

    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  }

  // Get problems in a specific collection
  async getCollectionProblems(collectionId: string, limit?: number): Promise<CollectionProblem[]> {
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

  // Create a new collection
  async createCollection(
    curatorId: string, 
    data: CreateCollectionRequest
  ): Promise<Collection> {
    try {
      // Create the collection
      const { data: collection, error } = await supabase
        .from('problem_collections')
        .insert({
          name: data.name,
          description: data.description || null,
          curator_id: curatorId,
          is_public: data.is_public ?? true,
          collection_type: data.collection_type || 'manual',
          criteria: data.criteria || null,
          display_order: 0, // Will be updated if needed
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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
          updated_at
        `)
        .single();

      if (error) throw error;

      // Add problems to collection if provided
      if (data.problem_ids && data.problem_ids.length > 0) {
        await this.addProblemsToCollection(
          collection.id, 
          data.problem_ids, 
          curatorId
        );
      }

      // Return collection with metadata
      return {
        ...collection,
        curator: { name: 'Current User' }, // Will be updated with actual name
        items_count: data.problem_ids?.length || 0
      };

    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  // Add problems to a collection
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

  // Remove problems from collection
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

  // Update collection order
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

  // Generate automatic collections based on criteria
  async generateAutomaticCollection(collectionId: string): Promise<void> {
    try {
      const { data: collection, error } = await supabase
        .from('problem_collections')
        .select('collection_type, criteria')
        .eq('id', collectionId)
        .single();

      if (error || !collection) throw new Error('Collection not found');

      let problemIds: string[] = [];

      switch (collection.collection_type) {
        case 'auto_trending':
          problemIds = await this.getTrendingProblems(collection.criteria);
          break;
        case 'auto_category':
          problemIds = await this.getCategoryProblems(collection.criteria);
          break;
        case 'auto_recommended':
          problemIds = await this.getRecommendedProblems(collection.criteria);
          break;
      }

      if (problemIds.length > 0) {
        // Clear existing items
        await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collectionId);

        // Add new items
        await this.addProblemsToCollection(collectionId, problemIds);
      }

    } catch (error) {
      console.error('Error generating automatic collection:', error);
      throw error;
    }
  }

  // Get trending problems for auto collection
  private async getTrendingProblems(criteria: any): Promise<string[]> {
    const limit = criteria?.limit || 20;
    
    const { data, error } = await supabase
      .from('trending_cache')
      .select('problem_id')
      .gt('expires_at', new Date().toISOString())
      .order('trending_score', { ascending: false })
      .limit(limit);

    return error ? [] : (data?.map(item => item.problem_id) || []);
  }

  // Get category problems for auto collection
  private async getCategoryProblems(criteria: any): Promise<string[]> {
    const categoryId = criteria?.category_id;
    const limit = criteria?.limit || 20;

    if (!categoryId) return [];

    const { data, error } = await supabase
      .from('problems')
      .select('id')
      .eq('category_id', categoryId)
      .eq('status', 'Proposed')
      .order('vote_count', { ascending: false })
      .limit(limit);

    return error ? [] : (data?.map(item => item.id) || []);
  }

  // Get recommended problems for auto collection
  private async getRecommendedProblems(criteria: any): Promise<string[]> {
    const limit = criteria?.limit || 20;
    const minVotes = criteria?.min_votes || 10;

    const { data, error } = await supabase
      .from('problems')
      .select('id')
      .eq('status', 'Proposed')
      .gte('vote_count', minVotes)
      .order('vote_count', { ascending: false })
      .limit(limit);

    return error ? [] : (data?.map(item => item.id) || []);
  }

  // Track collection view for analytics
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
}

// GET endpoint - Fetch collections
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const includeProblems = url.searchParams.get('include_problems') === 'true';
    const featuredOnly = url.searchParams.get('featured_only') === 'true';
    const collectionType = url.searchParams.get('type') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const manager = new CollectionManager();
    const collections = await manager.getCollections({
      includeProblems,
      featuredOnly,
      collectionType,
      limit
    });

    return NextResponse.json({
      success: true,
      data: collections,
      metadata: {
        total: collections.length,
        fetched_at: new Date().toISOString(),
        included_problems: includeProblems
      }
    });

  } catch (error) {
    console.error('Error in collections GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST endpoint - Create new collection
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateCollectionRequest = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Collection name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    const manager = new CollectionManager();
    const collection = await manager.createCollection(user.id, body);

    return NextResponse.json({
      success: true,
      data: collection,
      message: 'Collection created successfully'
    });

  } catch (error) {
    console.error('Error in collections POST:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}