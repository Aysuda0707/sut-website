# Backup & Restore Guide

The archive has two stateful components that must be backed up together:

1. **PostgreSQL** — all content, users, roles, and file metadata.
2. **Object storage bucket** — all media binaries (images, audio, video).

A backup is only complete when **both** are captured. Restoring the database
without the bucket (or vice versa) yields broken media references.

---

## 1. What the scripts do

| Script | Purpose |
| --- | --- |
| [`scripts/backup.sh`](../scripts/backup.sh) | Dumps the database, mirrors the bucket, copies the schema snapshot, and writes a manifest. |
| [`scripts/restore.sh`](../scripts/restore.sh) | Restores the database and bucket from a backup directory; optionally re-applies the schema. |

Both scripts read connection details from the environment (or `.env`) and use
`docker compose exec`, so they operate on the running stack.

---

## 2. Taking a backup

```bash
# Ensure the stack is running
docker compose up -d

# Run the backup (default output: ./backups/<timestamp>/)
./scripts/backup.sh

# Or specify an output directory
./scripts/backup.sh /mnt/backups/sut-archive
```

Resulting layout:

```
backups/20260101-120000/
├── database.sql     # pg_dump --clean --if-exists --no-owner
├── media/           # object storage mirror
├── schema.yaml      # Directus schema snapshot
└── MANIFEST.txt     # metadata + restore hint
```

### Prerequisites for the media mirror

The script uses `mc` (MinIO client) or `aws` (AWS CLI). Install one:

```bash
# MinIO client
mc alias set local "$STORAGE_S3_ENDPOINT" "$STORAGE_S3_KEY" "$STORAGE_S3_SECRET"

# or AWS CLI
aws configure
```

If neither is installed, the script still backs up the database and warns about
the skipped media mirror.

---

## 3. Restoring

> **Always test a restore into a scratch environment before relying on it.**

```bash
# Restore database + media (interactive confirmation required)
./scripts/restore.sh ./backups/20260101-120000

# Also re-apply the Directus schema snapshot
./scripts/restore.sh ./backups/20260101-120000 --with-schema

# Clear caches afterwards
docker compose restart
```

The restore script overwrites the current database and bucket. It prompts for
`yes` before proceeding.

---

## 4. Tested restore procedure (verification)

Run this drill periodically (e.g. quarterly) to prove backups are usable:

1. **Take a fresh backup** of the live stack: `./scripts/backup.sh`.
2. **Spin up a scratch stack** on a different project name and ports:
   ```bash
   COMPOSE_PROJECT_NAME=sut-restore docker compose -p sut-restore up -d
   ```
3. **Restore into the scratch stack**:
   ```bash
   COMPOSE_PROJECT_NAME=sut-restore ./scripts/restore.sh ./backups/<stamp>
   ```
4. **Verify content**: open the Directus admin on the scratch stack and confirm
   collections, items, and file references are present.
5. **Verify media**: open a known asset URL and confirm the binary loads.
6. **Verify the site**: point a local frontend at the scratch Directus and load
   the home page, an event, a podcast episode, and an interview.
7. **Tear down** the scratch stack: `docker compose -p sut-restore down -v`.

Record the date and outcome of each drill. A backup that has never been restored
is not a backup.

---

## 5. Recommended schedule

| Frequency | Action | Retention |
| --- | --- | --- |
| Daily | Automated `backup.sh` (cron / scheduled task) | 14 days |
| Weekly | Off-site copy of the latest backup | 8 weeks |
| Monthly | Full archive copy to cold storage | 12 months |
| Quarterly | Restore drill (section 4) | — |

### Example cron entry (Linux host)

```cron
0 3 * * * cd /srv/sut-website && ./scripts/backup.sh /mnt/backups/sut-archive >> /var/log/sut-backup.log 2>&1
```

### Example Windows Task Scheduler

Run `bash -lc "cd /c/Users/Lenovo/Desktop/SUT-website && ./scripts/backup.sh"` daily.

---

## 6. Off-site storage

Never keep the only copy on the same host as the database. Sync the backup
directory to a separate location (another bucket, a NAS, or an encrypted
external drive). For production on Cloudflare R2, enable object versioning and
lifecycle rules as an additional safety net.

---

## 7. Disaster recovery summary

| Scenario | Recovery |
| --- | --- |
| Accidental content deletion | Restore database from the most recent dump; media is untouched. |
| Corrupted database | Restore database from dump; re-apply schema if needed. |
| Lost media bucket | Restore bucket from the media mirror. |
| Full host loss | Provision a new host, `docker compose up -d`, restore database + bucket, point DNS at the new host. |
