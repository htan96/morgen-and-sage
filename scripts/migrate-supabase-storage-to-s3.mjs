#!/usr/bin/env node
/**
 * Migrate Supabase Storage → S3, preserving paths under `S3_DEST_PREFIX` (default `documents`).
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   AWS_BUCKET  (aliases: AWS_S3_BUCKET, S3_BUCKET)
 *   AWS_REGION
 *
 * Optional:
 *   SUPABASE_STORAGE_BUCKET  — logical bucket id in Supabase (default `documents`)
 *   S3_DEST_PREFIX          — prefix in S3, no leading slash (default `documents`)
 *   SKIP_IF_EXISTS=1        — skip objects already present (HeadObject)
 *   ONLY_PREFIX=path/       — only migrate paths under this prefix inside the bucket (optional)
 *
 * Run from repo root:
 *   node scripts/migrate-supabase-storage-to-s3.mjs
 *
 * Or: SKIP_IF_EXISTS=1 npm run migrate:storage-to-s3
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const dotenv =
  typeof require("dotenv")?.config === "function" ? require("dotenv") : { config() {} };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });
dotenv.config({ path: path.join(ROOT, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET_ID = process.env.SUPABASE_STORAGE_BUCKET || "documents";
const AWS_BUCKET =
  process.env.AWS_BUCKET ||
  process.env.AWS_S3_BUCKET ||
  process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION;
const S3_PREFIX_RAW = process.env.S3_DEST_PREFIX ?? "documents";
const S3_PREFIX = String(S3_PREFIX_RAW).replace(/^\/+|\/+$/g, "");
const SKIP_IF_EXISTS = process.env.SKIP_IF_EXISTS === "1";
const ONLY_PREFIX = (process.env.ONLY_PREFIX || "")
  .replace(/^\/+|\/+$/g, "");

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
};

function mimeFromPath(p) {
  const lower = p.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return "application/octet-stream";
  return MIME_BY_EXT[lower.slice(dot)] || "application/octet-stream";
}
function s3DestinationKey(storageKey) {
  const normalizedStorage = storageKey.replace(/^\/+/g, "");
  const full = `${S3_PREFIX}/${normalizedStorage}`.replace(/\/{2,}/g, "/");
  return full.replace(/^\/+/g, "");
}

/**
 * Supabase Storage `list()` returns folder-like placeholders with null metadata.
 * File entries typically carry non-null metadata after upload (size, mimetype, etc.).
 */
function isLikelyFolderEntry(entry) {
  return entry?.metadata == null;
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[migrate] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!AWS_BUCKET || !AWS_REGION) {
    console.error("[migrate] Missing AWS_BUCKET (or AWS_S3_BUCKET/S3_BUCKET) or AWS_REGION");
    process.exit(1);
  }

  const [{ createClient }, { S3Client, PutObjectCommand, HeadObjectCommand }] =
    await Promise.all([
      import("@supabase/supabase-js"),
      import("@aws-sdk/client-s3"),
    ]);

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const s3 = new S3Client({ region: AWS_REGION });

  /** @type {string[]} storage keys relative to bucket root */
  async function collectFileKeys(storagePrefix) {
    const keys = [];
    const pageSize = 1000;

    async function scanDir(dirPrefix) {
      let offset = 0;
      for (;;) {
        const { data: entries, error } = await supabase.storage.from(STORAGE_BUCKET_ID).list(dirPrefix || "", {
          limit: pageSize,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
        if (error) throw error;
        if (!entries?.length) break;

        for (const entry of entries) {
          const relative = dirPrefix ? `${dirPrefix}/${entry.name}` : entry.name;
          if (isLikelyFolderEntry(entry)) {
            await scanDir(relative);
          } else {
            keys.push(relative);
          }
        }

        if (entries.length < pageSize) break;
        offset += entries.length;
      }
    }

    await scanDir(storagePrefix);
    return keys;
  }

  const baseInsideBucket = ONLY_PREFIX
    ? ONLY_PREFIX.replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/")
    : "";

  console.log("[migrate]", {
    supabase_bucket: STORAGE_BUCKET_ID,
    s3_bucket: AWS_BUCKET,
    s3_dest_prefix: S3_PREFIX,
    only_prefix_inside_bucket: baseInsideBucket || "(root)",
    skip_if_exists: SKIP_IF_EXISTS,
  });

  const fileKeys = await collectFileKeys(baseInsideBucket);

  console.log(`[migrate] Found ${fileKeys.length} objects to migrate.`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  const failures = [];

  for (const storageKey of fileKeys) {
    const destinationKey = s3DestinationKey(storageKey);
    try {
      if (SKIP_IF_EXISTS) {
        try {
          await s3.send(
            new HeadObjectCommand({
              Bucket: AWS_BUCKET,
              Key: destinationKey,
            }),
          );
          skip += 1;
          continue;
        } catch (_) {
          // not found → copy
        }
      }

      const { data: blob, error } = await supabase.storage.from(STORAGE_BUCKET_ID).download(storageKey);
      if (error || !blob) throw error ?? new Error("empty blob");

      const body = Buffer.from(await blob.arrayBuffer());
      const contentType =
        (typeof blob.type === "string" && blob.type.trim().length > 0
          ? blob.type
          : null) || mimeFromPath(storageKey);

      await s3.send(
        new PutObjectCommand({
          Bucket: AWS_BUCKET,
          Key: destinationKey,
          Body: body,
          ContentType: contentType || "application/octet-stream",
        }),
      );

      ok += 1;
      if (ok % 25 === 0) console.error("[migrate] copied", ok);
    } catch (e) {
      fail += 1;
      failures.push({
        storageKey,
        destinationKey,
        reason: String(e?.message ?? e),
      });
      console.error("[migrate] FAIL:", storageKey, destinationKey, e?.message ?? e);
    }
  }

  console.log(
    JSON.stringify(
      {
        migrated: ok,
        skipped_existing: skip,
        failed: fail,
        sample_failures: failures.slice(0, 25),
      },
      null,
      2,
    ),
  );
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
