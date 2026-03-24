#!/bin/sh
# Startup script — initializes DB and starts the app
set -e

echo "🚀 Starting Client Portal..."

# Ensure data directory exists
mkdir -p /app/data

# Remove stale SQLite lock files
rm -f /app/data/prod.db-journal /app/data/prod.db-wal /app/data/prod.db-shm 2>/dev/null || true

# Push schema (creates or updates DB automatically)
echo "🔧 Syncing database schema..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push

# First-run: create admin if no users exist
echo "👤 Checking admin user..."
node scripts/init-admin.js 2>/dev/null || true

echo "✅ Database ready"

# Start the app
echo "🌐 Starting Next.js..."
exec npx next start -p 3000
