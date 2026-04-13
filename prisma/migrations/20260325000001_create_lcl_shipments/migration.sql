-- CreateTable: lcl_shipments (was missing from migrations)
CREATE TABLE IF NOT EXISTS "lcl_shipments" (
    "id" TEXT NOT NULL,
    "blNumber" TEXT NOT NULL,
    "eta" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "cargoAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCbm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "itemType" TEXT,
    "userId" TEXT,

    CONSTRAINT "lcl_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lcl_shipments_blNumber_key" ON "lcl_shipments"("blNumber");
CREATE INDEX IF NOT EXISTS "lcl_shipments_blNumber_idx" ON "lcl_shipments"("blNumber");
CREATE INDEX IF NOT EXISTS "lcl_shipments_eta_idx" ON "lcl_shipments"("eta");
CREATE INDEX IF NOT EXISTS "lcl_shipments_companyId_idx" ON "lcl_shipments"("companyId");

-- AddForeignKey
ALTER TABLE "lcl_shipments" ADD CONSTRAINT "lcl_shipments_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
