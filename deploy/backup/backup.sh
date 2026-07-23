#!/bin/sh

set -eu

database_path=/data/bilimorda.db
backup_directory=/backups
retention_days=${BACKUP_RETENTION_DAYS:-30}

case "$retention_days" in
  ''|*[!0-9]*)
    echo "BACKUP_RETENTION_DAYS must be a positive integer" >&2
    exit 1
    ;;
esac

if [ "$retention_days" -lt 1 ]; then
  echo "BACKUP_RETENTION_DAYS must be at least 1" >&2
  exit 1
fi

if [ ! -s "$database_path" ]; then
  echo "SQLite database does not exist or is empty: $database_path" >&2
  exit 1
fi

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
temporary_path="$backup_directory/.bilimorda-$timestamp.tmp"
backup_path="$backup_directory/bilimorda-$timestamp.db"

if [ -e "$temporary_path" ] || [ -e "$backup_path" ]; then
  echo "Backup for timestamp $timestamp already exists" >&2
  exit 1
fi

umask 077
trap 'rm -f "$temporary_path"' EXIT HUP INT TERM

sqlite3 "file:$database_path?mode=ro" \
  ".timeout 30000" \
  ".backup '$temporary_path'"

integrity_result=$(sqlite3 "$temporary_path" "PRAGMA quick_check;")
if [ "$integrity_result" != "ok" ]; then
  echo "SQLite integrity check failed: $integrity_result" >&2
  exit 1
fi

mv "$temporary_path" "$backup_path"
trap - EXIT HUP INT TERM

find "$backup_directory" \
  -maxdepth 1 \
  -type f \
  -name 'bilimorda-*.db' \
  -mtime "+$retention_days" \
  -delete

echo "Created verified SQLite backup: $backup_path"
