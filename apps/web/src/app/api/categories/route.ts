import { NextRequest, NextResponse } from 'next/server';

// Mock categories data for frontend during migration
const MOCK_CATEGORIES = [
  {
    id: 'a1b2c3d4-e5f6-4890-ab12-cd34ef567890',
    name: 'Ambiente',
    description: 'Problemi legati all\'ambiente e sostenibilità',
    color: '#10B981',
    icon: 'leaf',
    problem_count: 8,
    created_at: new Date().toISOString()
  },
  {
    id: 'b2c3d4e5-f6a7-4901-bc23-de45af678901', 
    name: 'Mobilità',
    description: 'Trasporti e mobilità urbana',
    color: '#3B82F6',
    icon: 'car',
    problem_count: 5,
    created_at: new Date().toISOString()
  },
  {
    id: 'c3d4e5f6-a7b8-4012-cd34-ef56ab789012',
    name: 'Energia',
    description: 'Efficienza energetica e fonti rinnovabili',
    color: '#F59E0B',
    icon: 'lightning-bolt',
    problem_count: 3,
    created_at: new Date().toISOString()
  },
  {
    id: 'd4e5f6a7-b8c9-4123-de45-fa67bc890123',
    name: 'Sociale',
    description: 'Problemi sociali e comunitari',
    color: '#EF4444',
    icon: 'users',
    problem_count: 2,
    created_at: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    console.log('Mock categories request during authentication migration');
    
    return NextResponse.json({
      success: true,
      data: MOCK_CATEGORIES
    });

  } catch (error) {
    console.error('Error in categories:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories',
      data: []
    }, { status: 500 });
  }
}