# Manual Migration Execution - Winston's Voting Trigger Fix

If you prefer to run the migration manually or need to troubleshoot, here are the options:

## Option 1: Supabase CLI (Recommended)

```bash
# From project root
./scripts/run-migration.sh
```

## Option 2: Supabase Dashboard SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/projects
2. Select your project
3. Go to "SQL Editor"
4. Copy and paste the contents of `supabase/migrations/20250723_fix_voting_triggers.sql`
5. Click "Run"

## Option 3: Direct CLI Commands

```bash
# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Or apply specific migration
supabase db reset --linked
```

## Option 4: API Endpoint Execution (Advanced)

Create a one-time migration endpoint:

```typescript
// /api/admin/migrate-voting-triggers
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service key needed for schema changes
  );
  
  const migrationSQL = `
    -- Copy the migration SQL here
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { 
    sql: migrationSQL 
  });
  
  return Response.json({ success: !error, error });
}
```

## Verification Steps

After running the migration, verify it worked:

1. **Test Problem Creation:**
   ```javascript
   fetch('/api/debug/create-problem', {
     method: 'POST',
     credentials: 'include'
   }).then(r => r.json()).then(console.log)
   ```

2. **Check Vote Analytics:**
   ```sql
   SELECT * FROM vote_analytics LIMIT 5;
   ```

3. **Verify Trigger Functions:**
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_name LIKE '%vote%';
   ```

## Rollback Plan (If Needed)

```sql
-- Emergency rollback
DROP TRIGGER IF EXISTS trigger_prevent_self_voting ON votes;
DROP TRIGGER IF EXISTS trigger_auto_vote_on_problem_creation ON problems;
DROP TRIGGER IF EXISTS trigger_vote_rate_limit ON votes;

-- Restore simple state (no auto-voting)
CREATE TRIGGER simple_prevent_duplicates
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_votes();
```

## Expected Results

After successful migration:
- ✅ Problem creation works without P0001 errors
- ✅ Creators get automatic "interest" vote
- ✅ Community members can vote on others' problems
- ✅ Rate limiting prevents spam
- ✅ Vote counts are accurate

The architecture will be properly secured while maintaining full functionality! 🏗️