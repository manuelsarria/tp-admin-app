-- CreateEnum
CREATE TYPE "LclBookingStatus" AS ENUM ('PENDING', 'IN_WAREHOUSE', 'ASSIGNED', 'SHIPPED', 'ARRIVED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "LclContainerStatus" AS ENUM ('OPEN', 'LOADING', 'CLOSED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED');

-- CreateTable
CREATE TABLE "lcl_containers" (
    "id" TEXT NOT NULL,
    "mblNumber" TEXT NOT NULL,
    "containerNumber" TEXT,
    "seal" TEXT,
    "vessel" TEXT,
    "voyage" TEXT,
    "portOfLoading" TEXT NOT NULL DEFAULT 'QINGDAO',
    "portOfDischarge" TEXT NOT NULL DEFAULT 'BALBOA',
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "status" "LclContainerStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lcl_containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lcl_bookings" (
    "id" TEXT NOT NULL,
    "hblNumber" TEXT NOT NULL,
    "warehouseEntryId" TEXT,
    "shipperName" TEXT NOT NULL,
    "shipperAddress" TEXT,
    "clientId" TEXT,
    "clientType" TEXT,
    "clientName" TEXT NOT NULL,
    "clientAddress" TEXT,
    "notifyParty" TEXT,
    "notifyPhone" TEXT,
    "portOfLoading" TEXT NOT NULL DEFAULT 'QINGDAO',
    "portOfDischarge" TEXT NOT NULL DEFAULT 'BALBOA',
    "placeOfReceipt" TEXT,
    "placeOfDelivery" TEXT,
    "preCarriageBy" TEXT,
    "vessel" TEXT,
    "voyage" TEXT,
    "description" TEXT,
    "marks" TEXT,
    "packages" INTEGER NOT NULL DEFAULT 1,
    "packageType" TEXT NOT NULL DEFAULT 'CTNS',
    "grossWeightKg" DOUBLE PRECISION,
    "cbm" DOUBLE PRECISION,
    "hsCode" TEXT,
    "freightTerms" TEXT NOT NULL DEFAULT 'PREPAID',
    "freightAmount" DOUBLE PRECISION,
    "freightCurrency" TEXT NOT NULL DEFAULT 'USD',
    "freightDesc" TEXT,
    "exportReference" TEXT,
    "documentNumber" TEXT,
    "status" "LclBookingStatus" NOT NULL DEFAULT 'PENDING',
    "lclContainerId" TEXT,
    "coordinatorId" TEXT,
    "coordinatorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lcl_bookings_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "warehouse_entries" ADD COLUMN "lclBookingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lcl_containers_mblNumber_key" ON "lcl_containers"("mblNumber");
CREATE INDEX "lcl_containers_mblNumber_idx" ON "lcl_containers"("mblNumber");
CREATE INDEX "lcl_containers_status_idx" ON "lcl_containers"("status");
CREATE INDEX "lcl_containers_createdAt_idx" ON "lcl_containers"("createdAt");

CREATE UNIQUE INDEX "lcl_bookings_hblNumber_key" ON "lcl_bookings"("hblNumber");
CREATE UNIQUE INDEX "lcl_bookings_warehouseEntryId_key" ON "lcl_bookings"("warehouseEntryId");
CREATE INDEX "lcl_bookings_hblNumber_idx" ON "lcl_bookings"("hblNumber");
CREATE INDEX "lcl_bookings_status_idx" ON "lcl_bookings"("status");
CREATE INDEX "lcl_bookings_clientId_idx" ON "lcl_bookings"("clientId");
CREATE INDEX "lcl_bookings_lclContainerId_idx" ON "lcl_bookings"("lclContainerId");
CREATE INDEX "lcl_bookings_createdAt_idx" ON "lcl_bookings"("createdAt");

CREATE UNIQUE INDEX "warehouse_entries_lclBookingId_key" ON "warehouse_entries"("lclBookingId");

-- AddForeignKey
ALTER TABLE "lcl_bookings" ADD CONSTRAINT "lcl_bookings_lclContainerId_fkey" FOREIGN KEY ("lclContainerId") REFERENCES "lcl_containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
