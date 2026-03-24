#!/bin/sh
echo "🚀 Starting Client Portal..."

mkdir -p /app/data
rm -f /app/data/prod.db-journal /app/data/prod.db-wal /app/data/prod.db-shm

echo "🔧 Syncing database..."
npx prisma db push 2>&1 || true

echo "👤 Checking admin..."
node scripts/init-admin.js 2>&1 || true

echo "🌐 Starting..."
exec npx next start -p 3000
