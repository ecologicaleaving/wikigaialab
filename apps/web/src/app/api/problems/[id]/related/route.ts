import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const problemId = params.id;
    const url = new URL(request.url);
    const algorithm = url.searchParams.get('algorithm') || 'hybrid';
    const limit = parseInt(url.searchParams.get('limit') || '5');

    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }

    // Mock related problems response since database is not available
    console.log('Mock related problems for:', problemId, algorithm, limit);

    return NextResponse.json({
      success: true,
      data: {
        problemId,
        relatedProblems: [], // Mock empty array
        algorithm,
        generated_at: new Date().toISOString(),
        cache_hit: false,
        total: 0
      }
    });

  } catch (error) {
    console.error('Error in related problems GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related problems' },
      { status: 500 }
    );
  }
}