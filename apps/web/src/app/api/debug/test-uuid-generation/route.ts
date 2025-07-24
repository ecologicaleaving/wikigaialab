import { NextRequest, NextResponse } from 'next/server';
import { v5 as uuidv5 } from 'uuid';

const WIKIGAIALAB_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

export async function GET(request: NextRequest) {
  const testEmail = 'dadecresce@gmail.com';
  const normalizedEmail = testEmail.toLowerCase().trim();
  const generatedUuid = uuidv5(normalizedEmail, WIKIGAIALAB_NAMESPACE);
  
  return NextResponse.json({
    testEmail,
    normalizedEmail,
    generatedUuid,
    namespace: WIKIGAIALAB_NAMESPACE,
    existingUserInDb: '90fbc024-98c1-41fa-b01a-7cd7f096c70a',
    match: generatedUuid === '90fbc024-98c1-41fa-b01a-7cd7f096c70a',
    timestamp: new Date().toISOString()
  });
}