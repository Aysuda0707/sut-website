#!/usr/bin/env bash
#
# Backup script for the SUT Azerbaijan Archive.
#
# Produces a timestamped backup directory containing:
#   1. A PostgreSQL dump (schema + data) from the Directus database.
#   2. A mirror of the S3/MinIO media bucket.
#   3. A copy of the Directus schema snapshot (for reference).
#
# Usage:
#   ./scripts/backup.sh [output-dir]
#
# Environment (read from .env or the shell):
#   POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD
#   STORAGE_S3_BUCKET, STORAGE_S3_ENDPOINT, STORAGE_S3_KEY, STORAGE_S3_SECRET
#
# Requires: docker compose (running stack), mc (MinIO client) OR aws-cli.

set -euo pipefail

OUTPUT_ROOT="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="${OUTPUT_ROOT}/${STAMP}"

mkdir -p "${DEST}"

echo "==> Backing up to ${DEST}"

# --- 1. Database -----------------------------------------------------------
echo "--> Dumping PostgreSQL database"
docker compose exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-directus}" -d "${POSTGRES_DB:-directus}" \
  --clean --if-exists --no-owner \
  > "${DEST}/database.sql"

echo "    wrote ${DEST}/database.sql ($(wc -c < "${DEST}/database.sql") bytes)"

# --- 2. Media bucket -------------------------------------------------------
echo "--> Mirroring media bucket"
if command -v mc >/dev/null 2>&1; then
  mc mirror --overwrite \
    "local/${STORAGE_S3_BUCKET:-sut-media}" \
    "${DEST}/media"
elif command -v aws >/dev/null 2>&1; then
  aws --endpoint-url "${STORAGE_S3_ENDPOINT}" s3 sync \
    "s3://${STORAGE_S3_BUCKET:-sut-media}" \
    "${DEST}/media"
else
  echo "    WARNING: neither 'mc' nor 'aws' found; skipping media mirror."
  echo "    Install MinIO client (mc) or AWS CLI and re-run to capture media."
fi

# --- 3. Schema snapshot ----------------------------------------------------
echo "--> Copying schema snapshot"
if [ -f "./cms/snapshots/schema.yaml" ]; then
  cp "./cms/snapshots/schema.yaml" "${DEST}/schema.yaml"
fi

# --- 4. Manifest -----------------------------------------------------------
cat > "${DEST}/MANIFEST.txt" <<EOF
Backup:        ${STAMP}
Created:       $(date -u +%Y-%m-%dT%H:%M:%SZ)
Database:      ${POSTGRES_DB:-directus}
Bucket:        ${STORAGE_S3_BUCKET:-sut-media}
Contents:
  - database.sql   PostgreSQL dump (pg_dump --clean --if-exists)
  - media/         Object storage mirror
  - schema.yaml    Directus schema snapshot
Restore with:  ./scripts/restore.sh ${DEST}
EOF

echo "==> Backup complete: ${DEST}"
