-- Add the NEGOCIO/PERSONAL axis to the daily journal.
--
-- `unit` says which pot the money moved through; `scope` says whether the
-- movement was business or personal. Both are needed because the owner pays
-- personal expenses out of business pots — 16 of the 21 egresos filed under
-- "Contenedores Valdai" are comida, gasolina, luz de la casa, agua de la finca,
-- etc. Without this split, "cuánto deja Valdai" is not computable.
--
-- Everything defaults to NEGOCIO; the backfill below only flips rows that are
-- unambiguous. Anything judgement-dependent (gasolina, cargos bancarios,
-- "cuota") is deliberately LEFT as NEGOCIO for the owner to reclassify in the
-- UI — guessing wrong here silently corrupts the P&L.

-- CreateEnum
CREATE TYPE "LedgerScope" AS ENUM ('NEGOCIO', 'PERSONAL');

-- AlterTable
ALTER TABLE "personal_ledger_entries"
  ADD COLUMN "scope" "LedgerScope" NOT NULL DEFAULT 'NEGOCIO';

-- CreateIndex
CREATE INDEX "personal_ledger_entries_scope_idx" ON "personal_ledger_entries"("scope");

-- Backfill 1: the "Salario Personal" unit is personal money by definition.
UPDATE "personal_ledger_entries"
SET "scope" = 'PERSONAL'
WHERE "unit" = 'Salario Personal';

-- Backfill 2: unambiguous personal spend sitting inside business units.
-- Matched on category + description, not on amount, so it stays readable.
UPDATE "personal_ledger_entries"
SET "scope" = 'PERSONAL'
WHERE "type" = 'EGRESO'
  AND (
    "category" IN ('Comida')
    OR LOWER(COALESCE("description", '')) LIKE '%luz casa%'
    OR LOWER(COALESCE("description", '')) LIKE '%luz finca%'
    OR LOWER(COALESCE("description", '')) LIKE '%agua finca%'
    OR LOWER(COALESCE("description", '')) LIKE '%malla pollos%'
    OR LOWER(COALESCE("description", '')) LIKE '%cajilla tv%'
    OR LOWER(COALESCE("description", '')) LIKE '%prestamo personal%'
    OR LOWER(COALESCE("description", '')) LIKE '%préstamo personal%'
  );

-- Backfill 3: the app test rows the owner created while trying the module.
UPDATE "personal_ledger_entries"
SET "scope" = 'PERSONAL'
WHERE LOWER(COALESCE("description", '')) IN ('pueba app', 'prueba app');
