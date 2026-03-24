#!/bin/bash
# Backup script for Client Portal SQLite database
# Usage: ./scripts/backup.sh [backup-dir]

set -e

DB_PATH="${DB_PATH:-prisma/dev.db}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="client-portal-backup-${TIMESTAMP}.db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at: $DB_PATH"
  exit 1
fi

# Create backup using SQLite backup command (safe for live DB)
if command -v sqlite3 &> /dev/null; then
  sqlite3 "$DB_PATH" ".backup '${BACKUP_DIR}/${BACKUP_FILE}'"
else
  # Fallback: copy with WAL checkpoint
  cp "$DB_PATH" "${BACKUP_DIR}/${BACKUP_FILE}"
fi

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
echo "📊 Size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)"

# Keep only last 30 backups
ls -t "${BACKUP_DIR}"/client-portal-backup-*.db.gz 2>/dev/null | tail -n +31 | xargs -r rm

echo "📁 Total backups: $(ls "${BACKUP_DIR}"/client-portal-backup-*.db.gz 2>/dev/null | wc -l)"
