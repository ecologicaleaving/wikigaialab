import { NextRequest, NextResponse } from 'next/server';
import { validateProblemInput } from '@/lib/validation/problem-schema';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug validation endpoint called');
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const validation = validateProblemInput(body);
    console.log('🔍 Validation result:', validation);
    
    return NextResponse.json({
      success: true,
      validation,
      inputReceived: body
    });
    
  } catch (error) {
    console.error('❌ Debug validation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}