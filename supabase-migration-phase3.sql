-- PHASE 3: Add notes column to plans table.
-- Safe to run on live data — adds a column with a default, no data loss.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
