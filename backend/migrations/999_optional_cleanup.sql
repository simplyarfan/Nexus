-- OPTIONAL CLEANUP MIGRATION (DO NOT AUTO-RUN)
-- Purpose: Allow safe manual cleanup of unused tables/indexes and revert programmatic schema additions
-- Usage: Review lines below, uncomment specific DROP statements you want to execute, then run manually.

-- Notes:
-- - This file is intentionally not executed by runtime bootstrap.
-- - Only run in a controlled environment with backups.
-- - Verify no code paths depend on the objects you drop.

BEGIN;

-- Example: remove legacy/unused resume tables (if confirmed unused)
-- DROP TABLE IF EXISTS resumes_raw CASCADE;
-- DROP TABLE IF EXISTS resume_entities CASCADE;
-- DROP TABLE IF EXISTS jobs CASCADE;

-- Example: remove orphaned indexes (if any exist and are unused)
-- DROP INDEX IF EXISTS idx_legacy_table_col;

-- Example: remove extraneous CV tables not used by current code
-- (Current code uses cv_batches and candidates only)
-- DROP TABLE IF EXISTS cv_candidates CASCADE; -- legacy name; not present in current schema

COMMIT;


