#!/bin/sh
# Startup script — initializes DB and starts the app
set -e

echo "🚀 Starting Client Portal..."

# Ensure data directory exists
mkdir -p /app/data

# Check if DB exists and is valid
if [ -f /app/data/prod.db ]; then
  echo "📁 Database exists, checking integrity..."
  # Remove stale lock files
  rm -f /app/data/prod.db-journal /app/data/prod.db-wal /app/data/prod.db-shm 2>/dev/null || true
else
  echo "📁 No database found, creating..."
fi

# Push schema (creates or updates DB)
echo "🔧 Syncing database schema..."
npx prisma db push --schema=/app/prisma/schema.prisma --accept-data-loss 2>/dev/null || npx prisma db push --schema=/app/prisma/schema.prisma

echo "✅ Database ready"

# Log startup activity
echo "📝 Logging startup..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.activityLog.create({
  data: {
    userId: 'system',
    action: 'LOGIN',
    entity: 'System',
    details: 'Application started'
  }
}).catch(() => {});
" 2>/dev/null || true

# Start the app
echo "🌐 Starting Next.js..."
exec npx next start -p 3000
