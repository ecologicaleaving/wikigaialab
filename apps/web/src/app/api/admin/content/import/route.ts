import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@wikigaialab/database';

interface ImportProblem {
  title: string;
  description: string;
  category_name?: string;
  category_id?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  is_featured?: boolean;
  metadata?: any;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string; // 'csv' or 'json'

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!['csv', 'json'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be csv or json' },
        { status: 400 }
      );
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('content_imports')
      .insert({
        imported_by: user.id,
        import_type: importType,
        file_name: file.name,
        file_size: file.size,
        status: 'processing'
      })
      .select()
      .single();

    if (importError) {
      throw importError;
    }

    // Process file content
    const fileContent = await file.text();
    let problems: ImportProblem[] = [];

    try {
      if (importType === 'json') {
        const parsedData = JSON.parse(fileContent);
        problems = Array.isArray(parsedData) ? parsedData : [parsedData];
      } else if (importType === 'csv') {
        problems = parseCSV(fileContent);
      }
    } catch (parseError) {
      await supabase
        .from('content_imports')
        .update({
          status: 'failed',
          error_log: [{ error: 'File parsing failed', details: parseError.message }],
          completed_at: new Date().toISOString()
        })
        .eq('id', importRecord.id);

      return NextResponse.json(
        { error: 'Failed to parse file content' },
        { status: 400 }
      );
    }

    // Get categories for mapping
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);

    const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]) || []);

    // Process problems
    let successCount = 0;
    let failureCount = 0;
    const errorLog: any[] = [];
    const successLog: any[] = [];

    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i];
      
      try {
        // Validate required fields
        if (!problem.title || !problem.description) {
          throw new Error('Title and description are required');
        }

        // Map category
        let categoryId = problem.category_id;
        if (!categoryId && problem.category_name) {
          categoryId = categoryMap.get(problem.category_name.toLowerCase());
          if (!categoryId) {
            throw new Error(`Category '${problem.category_name}' not found`);
          }
        }

        // Set default category if none provided
        if (!categoryId && categories && categories.length > 0) {
          categoryId = categories[0].id; // Use first available category as default
        }

        // Check for duplicates based on title similarity
        const { data: existingProblems } = await supabase
          .from('problems')
          .select('id, title')
          .ilike('title', `%${problem.title}%`);

        if (existingProblems && existingProblems.length > 0) {
          const duplicate = existingProblems.find(p => 
            p.title.toLowerCase().trim() === problem.title.toLowerCase().trim()
          );
          
          if (duplicate) {
            throw new Error(`Duplicate problem found: "${duplicate.title}"`);
          }
        }

        // Insert problem
        const { data: newProblem, error: problemError } = await supabase
          .from('problems')
          .insert({
            title: problem.title.trim(),
            description: problem.description.trim(),
            proposer_id: user.id,
            category_id: categoryId,
            moderation_status: 'approved', // Auto-approve admin imports
            is_featured: problem.is_featured || false,
            status: 'open'
          })
          .select()
          .single();

        if (problemError) {
          throw problemError;
        }

        // Calculate quality score
        await supabase.rpc('calculate_content_quality_score', {
          problem_id: newProblem.id
        });

        successCount++;
        successLog.push({
          index: i + 1,
          title: problem.title,
          problem_id: newProblem.id
        });

      } catch (error) {
        failureCount++;
        errorLog.push({
          index: i + 1,
          title: problem.title || 'Unknown',
          error: error.message
        });
      }
    }

    // Update import record
    await supabase
      .from('content_imports')
      .update({
        total_records: problems.length,
        successful_imports: successCount,
        failed_imports: failureCount,
        status: failureCount === 0 ? 'completed' : 'completed',
        error_log: errorLog,
        success_log: successLog,
        completed_at: new Date().toISOString()
      })
      .eq('id', importRecord.id);

    return NextResponse.json({
      success: true,
      data: {
        import_id: importRecord.id,
        total_records: problems.length,
        successful_imports: successCount,
        failed_imports: failureCount,
        error_log: errorLog,
        success_log: successLog
      }
    });

  } catch (error) {
    console.error('Error during bulk import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get import history
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    // Get import history
    const { data: imports, error: importsError } = await supabase
      .from('content_imports')
      .select(`
        id,
        import_type,
        file_name,
        file_size,
        total_records,
        successful_imports,
        failed_imports,
        status,
        started_at,
        completed_at,
        imported_by:users!imported_by(id, name)
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    if (importsError) {
      throw importsError;
    }

    return NextResponse.json({ success: true, data: imports || [] });

  } catch (error) {
    console.error('Error fetching import history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simple CSV parser
function parseCSV(content: string): ImportProblem[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const problems: ImportProblem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const problem: ImportProblem = {
      title: '',
      description: ''
    };

    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'title':
          problem.title = value.replace(/^"|"$/g, ''); // Remove quotes
          break;
        case 'description':
          problem.description = value.replace(/^"|"$/g, '');
          break;
        case 'category':
        case 'category_name':
          problem.category_name = value.replace(/^"|"$/g, '');
          break;
        case 'category_id':
          problem.category_id = value.replace(/^"|"$/g, '');
          break;
        case 'is_featured':
          problem.is_featured = value.toLowerCase() === 'true' || value === '1';
          break;
        case 'priority':
          if (['low', 'medium', 'high'].includes(value.toLowerCase())) {
            problem.priority = value.toLowerCase() as 'low' | 'medium' | 'high';
          }
          break;
        case 'tags':
          if (value) {
            problem.tags = value.split(';').map(tag => tag.trim()).filter(tag => tag);
          }
          break;
      }
    });

    if (problem.title && problem.description) {
      problems.push(problem);
    }
  }

  return problems;
}