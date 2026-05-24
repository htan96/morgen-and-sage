# Morgens Kitchen — Postgres restore & Supabase Storage → S3

Operational notes for self-hosted Postgres on EC2 and storage migration. Application code (`@supabase/*`) is unchanged until the app is pointed at Postgres + S3.

## 1. Create database and role (EC2)

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE morgens_app LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
CREATE DATABASE morgens_kitchen OWNER morgens_app;
\c morgens_kitchen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
SQL
```

Identify dump format:

```bash
file /var/backups/morgens-kitchen/morgens_backup.dump
```

Restore custom-format dump (adjust path if remote):

```bash
sudo -u postgres pg_restore \
  --verbose \
  --no-owner \
  --no-privileges \
  --dbname=morgens_kitchen \
  /var/backups/morgens-kitchen/morgens_backup.dump \
  2>&1 | tee /tmp/pg_restore_morgens.log
```

`-U postgres` is optional when using `sudo -u postgres`; use it if invoking `pg_restore` as another OS user while passing `PGPASSWORD` for the DB superuser.

**Note:** The dump contains references to Storage objects (`storage_path` rows, `storage.objects` if included), **not file bytes**. Run the Storage → S3 script below for actual files.

## 2. Migrate Supabase Storage to S3

### Prerequisites

- **IAM user or role** with `s3:PutObject`, `s3:GetObject`, `s3:HeadObject` on the destination prefix (minimum for this script).
- Repo dependencies (install once):

```bash
cd /path/to/morgens-kitchen
npm install --save-dev @aws-sdk/client-s3
```

`@supabase/supabase-js` is already an app dependency.

### Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Same as app |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role (**secret**); never commit |
| `AWS_BUCKET` | yes | Destination bucket (`AWS_S3_BUCKET` / `S3_BUCKET` also accepted) |
| `AWS_REGION` | yes | e.g. `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | yes* | Standard SDK env vars (or omit on EC2 with instance profile + correct IAM) |
| `SUPABASE_STORAGE_BUCKET` | no | Defaults to `documents` (matches `.from('documents')` in app) |
| `S3_DEST_PREFIX` | no | Defaults to `documents` → S3 keys look like `documents/<storage_key>` |
| `SKIP_IF_EXISTS` | no | Set to `1` for safe reruns (HeadObject skip) |
| `ONLY_PREFIX` | no | Optional subfolder inside the Supabase bucket to scan |

Secrets can live in `.env.local` / `.env` in the repo root (gitignored); the script loads both.

### Run

```bash
cd /path/to/morgens-kitchen
SKIP_IF_EXISTS=1 node scripts/migrate-supabase-storage-to-s3.mjs
```

Or:

```bash
SKIP_IF_EXISTS=1 npm run migrate:storage-to-s3
```

**Freeze writes** on Supabase during the final production run (or accept drift and reconcile).

## 3. Sanity checks

**Row count (metadata in Postgres):**

```sql
SELECT COUNT(*) AS document_rows
FROM public.documents
WHERE storage_path IS NOT NULL
  AND storage_path NOT LIKE 'manual-%';
```

**S3 object count** (under prefix used for migration):

```bash
aws s3 ls "s3://YOUR_BUCKET/documents/" --recursive --summarize
```

**Spot-check:** pick `storage_path` values from `public.documents` and confirm an object exists at:

`s3://YOUR_BUCKET/documents/<storage_path>`

## 4. After cutover

Point the app at `DATABASE_URL` (self-hosted) and replace `supabase.storage` usage with S3 (presigned URLs or a proxy). Keep S3 key layout aligned with `S3_DEST_PREFIX` + `storage_path` so existing rows stay valid.
