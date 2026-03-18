-- Fix booking times that were stored incorrectly (UTC interpreted as Pacific)
--
-- Bug: datetime-local values like "2025-03-18T09:00" were sent to the server
-- and stored as 09:00 UTC instead of 09:00 Pacific (16:00 or 17:00 UTC).
--
-- Run each section separately in Supabase SQL Editor.
-- The exclusion constraint must be dropped during the update.

-- =============================================================================
-- STEP 1: Get the constraint definition (save the output in case you need to restore)
-- =============================================================================

SELECT pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'bookings_no_overlap_per_kitchen';

-- =============================================================================
-- STEP 2: DRY RUN - Preview what will change
-- =============================================================================

SELECT
  id,
  start_time AS old_start,
  ((start_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Los_Angeles') AS new_start,
  end_time AS old_end,
  ((end_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Los_Angeles') AS new_end,
  tenant_id
FROM bookings
ORDER BY start_time;

-- =============================================================================
-- STEP 3: Drop constraint, update, re-add constraint
-- Run all 3 statements together (or one at a time)
-- =============================================================================

-- 3a. Drop the constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap_per_kitchen;

-- 3b. Apply the fix
UPDATE bookings
SET
  start_time = ((start_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Los_Angeles'),
  end_time = ((end_time AT TIME ZONE 'UTC') AT TIME ZONE 'America/Los_Angeles');

-- 3c. Re-add the constraint
-- (Run STEP 1 first to get your exact definition if this fails)
-- May need: CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap_per_kitchen
  EXCLUDE USING gist (
    organization_id WITH =,
    kitchen_space_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  );

-- =============================================================================
-- IF RE-ADD FAILS: You have real overlaps after the fix (duplicate/conflicting bookings).
-- Find them with this query, then delete or adjust the conflicting rows manually:
-- =============================================================================

/*
SELECT a.id AS id_a, b.id AS id_b, a.start_time, a.end_time, b.start_time, b.end_time
FROM bookings a
JOIN bookings b ON a.id < b.id
  AND a.organization_id = b.organization_id
  AND a.kitchen_space_id = b.kitchen_space_id
  AND tstzrange(a.start_time, a.end_time) && tstzrange(b.start_time, b.end_time);
*/
