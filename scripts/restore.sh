#!/usr/bin/env bash
#
# Restore script for the SUT Azerbaijan Archive.
#
# Restores a backup produced by ./scripts/backup.sh:
#   1. Recreates the PostgreSQL database from the dump.
#   2. Restores the media bucket.
#   3. Optionally re-applies the Directus schema snapshot.
#
# Usage:
#   ./scripts/restore.sh <backup-dir> [--with-schema]
#
# Example:
#   ./scripts/restore.sh ./backups/20260101-120000
#
# WARNING: This OVERWRITES the current database and media bucket.
#          Always test a restore into a scratch environment first.

set -euo pipefail

SRC="${1:-}"
WITH_SCHEMA="${2:-}"

if [ -z "${SRC}" ] || [ ! -d "${SRC}" ]; then
  echo "Usage: $0 <backup-dir> [--with-schema]" >&2
  exit 1
fi

echo "==> Restoring from ${SRC}"
echo "    This will OVERWRITE the current database and media bucket."
read -r -p "    Type 'yes' to continue: " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "    Aborted."
  exit 1
fi

# --- 1. Database -----------------------------------------------------------
if [ -f "${SRC}/database.sql" ]; then
  echo "--> Restoring PostgreSQL database"
  docker compose exec -T postgres \
    psql -U "${POSTGRES_USER:-directus}" -d "${POSTGRES_DB:-directus}" \
    < "${SRC}/database.sql"
  echo "    database restored"
else
  echo "    WARNING: ${SRC}/database.sql not found; skipping database."
fi

# --- 2. Media bucket -------------------------------------------------------
if [ -d "${SRC}/media" ]; then
  echo "--> Restoring media bucket"
  if command -v mc >/dev/null 2>&1; then
    mc mirror --overwrite "${SRC}/media" "local/${STORAGE_S3_BUCKET:-sut-media}"
  elif command -v aws >/dev/null 2>&1; then
    aws --endpoint-url "${STORAGE_S3_ENDPOINT}" s3 sync \
      "${SRC}/media" "s3://${STORAGE_S3_BUCKET:-sut-media}"
  else
    echo "    WARNING: neither 'mc' nor 'aws' found; skipping media restore."
  fi
else
  echo "    WARNING: ${SRC}/media not found; skipping media."
fi

# --- 3. Schema (optional) --------------------------------------------------
if [ "${WITH_SCHEMA}" = "--with-schema" ] && [ -f "${SRC}/schema.yaml" ]; then
  echo "--> Re-applying Directus schema snapshot"
  docker compose cp "${SRC}/schema.yaml" directus:/directus/snapshots/schema.yaml
  docker compose exec -T directus \
    npx directus schema apply --yes /directus/snapshots/schema.yaml
fi

echo "==> Restore complete."
echo "    Restart the stack to clear caches: docker compose restart"
