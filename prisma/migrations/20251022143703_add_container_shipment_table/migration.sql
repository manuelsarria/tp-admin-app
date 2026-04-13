-- CreateTable
CREATE TABLE "container_shipments" (
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

    CONSTRAINT "container_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "container_shipments_blNumber_key" ON "container_shipments"("blNumber");

-- CreateIndex
CREATE INDEX "container_shipments_blNumber_idx" ON "container_shipments"("blNumber");

-- CreateIndex
CREATE INDEX "container_shipments_eta_idx" ON "container_shipments"("eta");

-- CreateIndex
CREATE INDEX "container_shipments_companyId_idx" ON "container_shipments"("companyId");

-- AddForeignKey
ALTER TABLE "container_shipments" ADD CONSTRAINT "container_shipments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
