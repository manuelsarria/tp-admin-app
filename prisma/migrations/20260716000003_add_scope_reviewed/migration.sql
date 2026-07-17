-- Flag the rows whose `scope` is an unconfirmed guess.
--
-- The 20260716000002 backfill classified what it could by rule and left
-- everything else at the NEGOCIO default. That default is indistinguishable
-- from a real business movement, so ambiguous rows would quietly sit in the
-- business P&L forever. This column makes the guess visible and fixable.
--
-- The rule below is intentionally broad: category 'Otro'/'Combustible'/
-- 'Bancos / Comisiones' is where the unclassifiable stuff lives (it caught
-- "electricidad casa", which the earlier LIKE '%luz casa%' rule missed).
-- Better to over-flag and let the owner confirm than to under-flag and be
-- silently wrong.

-- AlterTable
ALTER TABLE "personal_ledger_entries"
  ADD COLUMN "scopeReviewed" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "personal_ledger_entries_scopeReviewed_idx" ON "personal_ledger_entries"("scopeReviewed");

-- Flag ambiguous business egresos for review.
UPDATE "personal_ledger_entries"
SET "scopeReviewed" = false
WHERE "type" = 'EGRESO'
  AND "scope" = 'NEGOCIO'
  AND (
    "category" IN ('Otro', 'Combustible', 'Bancos / Comisiones')
    OR "unit" = 'Otro'
  );
