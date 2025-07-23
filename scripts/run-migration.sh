#!/bin/bash

# Script to run the voting trigger fix migration
# Usage: ./scripts/run-migration.sh

echo "🏗️ Winston - System Architect: Running Voting Trigger Fix Migration"
echo "================================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ supabase/config.toml not found. Please run from project root."
    exit 1
fi

echo "🔍 Checking Supabase connection..."

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI ready"

# Link to remote project if not already linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking to remote Supabase project..."
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    echo "Find your project ref at: https://supabase.com/dashboard/projects"
    exit 1
fi

echo "🚀 Running migration..."

# Apply the migration
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Test problem creation at /problems/new"
    echo "2. Check vote_analytics view: SELECT * FROM vote_analytics;"
    echo "3. Monitor for any issues"
    echo ""
    echo "🏗️ Voting system is now properly architected!"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    echo "💡 You may need to:"
    echo "1. Check your database connection"
    echo "2. Verify project permissions"
    echo "3. Review the migration SQL for syntax errors"
fi