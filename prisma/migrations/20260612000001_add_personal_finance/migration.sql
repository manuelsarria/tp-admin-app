-- Personal finance module ("Finanzas Personales" / contabilidad personal)

-- Enums
CREATE TYPE "LedgerType" AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE "LedgerStatus" AS ENUM ('PAGADO', 'PENDIENTE', 'PARCIAL', 'ANULADO');

-- PIN hash on users
ALTER TABLE "users" ADD COLUMN "financePinHash" TEXT;

-- Master daily journal
CREATE TABLE "personal_ledger_entries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "unit" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "method" TEXT,
    "status" "LedgerStatus" NOT NULL DEFAULT 'PAGADO',
    "counterparty" TEXT,
    "reference" TEXT,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "personal_ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "personal_ledger_entries_date_idx" ON "personal_ledger_entries"("date");
CREATE INDEX "personal_ledger_entries_unit_idx" ON "personal_ledger_entries"("unit");
CREATE INDEX "personal_ledger_entries_type_idx" ON "personal_ledger_entries"("type");
CREATE INDEX "personal_ledger_entries_status_idx" ON "personal_ledger_entries"("status");
CREATE INDEX "personal_ledger_entries_category_idx" ON "personal_ledger_entries"("category");

-- Editable dropdown catalogs
CREATE TABLE "personal_ledger_catalog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "personal_ledger_catalog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "personal_ledger_catalog_kind_value_key" ON "personal_ledger_catalog"("kind", "value");
CREATE INDEX "personal_ledger_catalog_kind_idx" ON "personal_ledger_catalog"("kind");

-- Audit trail
CREATE TABLE "personal_ledger_audit" (
    "id" TEXT NOT NULL,
    "entityId" TEXT,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "personal_ledger_audit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "personal_ledger_audit_createdAt_idx" ON "personal_ledger_audit"("createdAt");
CREATE INDEX "personal_ledger_audit_entityId_idx" ON "personal_ledger_audit"("entityId");
