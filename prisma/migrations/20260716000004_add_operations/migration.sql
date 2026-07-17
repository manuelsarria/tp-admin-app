-- Operations: one row per money-making job (typically a container).
--
-- Needed because the free-text `reference` cannot group a job's income with
-- its costs. Real data from this database:
--   INGRESO  "Contenedor [9507100400]: ETA [29/JUNIO]  COLCHON"   4960.00
--   EGRESO   "Contenedor [9507100400]: ETA [29/JUNIO] COLCHON"    3650.00
-- (differ by one space), and:
--   INGRESO  "2 contenedores colchones 1 triciclos"               2901.54
--   EGRESO   "3 contenedores 2 colchones 1 triciclos"             1908.60
-- (different text entirely). Grouping by that string reports a fake profit.
--
-- No data is migrated here on purpose. Linking an entry to an operation is a
-- judgement call — "is this the same job?" — so the app ships a matcher that
-- proposes groups and the owner confirms. `reference` is never modified.

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateTable
CREATE TABLE "personal_operations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "containerNumber" TEXT,
    "unit" TEXT,
    "status" "OperationStatus" NOT NULL DEFAULT 'ABIERTA',
    "eta" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_operations_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "personal_ledger_entries" ADD COLUMN "operationId" TEXT;

-- CreateIndex
CREATE INDEX "personal_operations_status_idx" ON "personal_operations"("status");

-- CreateIndex
CREATE INDEX "personal_operations_containerNumber_idx" ON "personal_operations"("containerNumber");

-- CreateIndex
CREATE INDEX "personal_ledger_entries_operationId_idx" ON "personal_ledger_entries"("operationId");

-- AddForeignKey
ALTER TABLE "personal_ledger_entries" ADD CONSTRAINT "personal_ledger_entries_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "personal_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
