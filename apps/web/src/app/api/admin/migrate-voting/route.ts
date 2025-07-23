import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-time migration endpoint - Winston's Voting Trigger Fix
// IMPORTANT: Remove this endpoint after successful migration

export async function POST(request: NextRequest) {
  try {
    console.log('🏗️ Winston: Executing voting trigger migration...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Service key needed for schema changes
    );
    
    // Execute the migration SQL in parts to avoid timeout
    const migrationSteps = [
      // Step 1: Add vote_type column
      `ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_type TEXT DEFAULT 'community';`,
      
      // Step 2: Add constraint
      `ALTER TABLE votes ADD CONSTRAINT IF NOT EXISTS vote_type_check 
       CHECK (vote_type IN ('community', 'creator_interest'));`,
      
      // Step 3: Update existing votes
      `UPDATE votes SET vote_type = 'community' WHERE vote_type IS NULL;`,
      
      // Step 4: Drop existing triggers
      `DROP TRIGGER IF EXISTS trigger_prevent_self_voting ON votes;
       DROP TRIGGER IF EXISTS trigger_auto_vote_on_problem_creation ON problems;`,
      
      // Step 5: Create improved prevent_self_voting function
      `CREATE OR REPLACE FUNCTION prevent_self_voting()
       RETURNS TRIGGER AS $$
       BEGIN
           IF NEW.vote_type = 'community' AND EXISTS (
               SELECT 1 FROM problems 
               WHERE id = NEW.problem_id 
               AND proposer_id = NEW.user_id
           ) THEN
               RAISE EXCEPTION 'Users cannot cast community votes on their own problems'
               USING ERRCODE = 'P0001';
           END IF;
           
           IF EXISTS (
               SELECT 1 FROM votes 
               WHERE user_id = NEW.user_id 
               AND problem_id = NEW.problem_id 
               AND vote_type = NEW.vote_type
           ) THEN
               RAISE EXCEPTION 'User has already cast this type of vote on this problem'
               USING ERRCODE = 'P0002';
           END IF;
           
           RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,
      
      // Step 6: Create improved auto_vote function
      `CREATE OR REPLACE FUNCTION auto_vote_on_problem_creation()
       RETURNS TRIGGER AS $$
       BEGIN
           INSERT INTO votes (user_id, problem_id, vote_type, created_at)
           VALUES (NEW.proposer_id, NEW.id, 'creator_interest', NEW.created_at);
           
           UPDATE problems 
           SET vote_count = 1
           WHERE id = NEW.id;
           
           RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,
      
      // Step 7: Recreate triggers
      `CREATE TRIGGER trigger_prevent_self_voting
           BEFORE INSERT ON votes
           FOR EACH ROW
           EXECUTE FUNCTION prevent_self_voting();
       
       CREATE TRIGGER trigger_auto_vote_on_problem_creation
           AFTER INSERT ON problems
           FOR EACH ROW
           EXECUTE FUNCTION auto_vote_on_problem_creation();`
    ];
    
    const results = [];
    
    for (let i = 0; i < migrationSteps.length; i++) {
      console.log(`🏗️ Executing migration step ${i + 1}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: migrationSteps[i]
      });
      
      results.push({
        step: i + 1,
        success: !error,
        error: error?.message,
        data
      });
      
      if (error) {
        console.error(`❌ Migration step ${i + 1} failed:`, error);
        break;
      }
    }
    
    return NextResponse.json({
      success: results.every(r => r.success),
      message: 'Voting trigger migration executed',
      results,
      nextSteps: [
        'Test problem creation at /problems/new',
        'Verify with: fetch(\'/api/debug/create-problem\', {method: \'POST\', credentials: \'include\'})',
        'Remove this admin endpoint after successful testing'
      ]
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}