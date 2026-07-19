#!/bin/bash
set -e

echo "🚀 AIMS Command Center Deployment"
echo "=================================="

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required env vars
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ Error: Missing Supabase env vars in .env"
  exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ Error: Missing ANTHROPIC_API_KEY in .env"
  exit 1
fi

echo "✓ Environment variables loaded"

# Extract project ID from URL
PROJECT_ID=$(echo $VITE_SUPABASE_URL | grep -oP '(?<=https://).*(?=\.supabase)')

if [ -z "$PROJECT_ID" ]; then
  echo "❌ Error: Could not extract project ID from VITE_SUPABASE_URL"
  exit 1
fi

echo "✓ Project ID: $PROJECT_ID"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "⚠️  Supabase CLI not found. Install with: npm install -g supabase"
  echo "   Skipping automatic secret deployment."
  echo "   ⚠️  IMPORTANT: Manually set ANTHROPIC_API_KEY in Supabase dashboard"
  exit 0
fi

echo "🔐 Setting Anthropic API key in Supabase..."

# Set the secret (requires SUPABASE_ACCESS_TOKEN env var to be set)
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "⚠️  SUPABASE_ACCESS_TOKEN not set. Cannot auto-deploy secrets."
  echo "   Run this to set your access token:"
  echo "   export SUPABASE_ACCESS_TOKEN='your_token_here'"
  echo "   (Get token from: https://app.supabase.com/account/tokens)"
else
  supabase secrets set ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY" --project-id $PROJECT_ID
  echo "✓ API key deployed to Supabase"
fi

echo "📦 Building application..."
npm install
npm run build

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify API key is set: Supabase Dashboard → Edge Functions → call-claude → Secrets"
echo "2. Test the app at your deployment URL"
