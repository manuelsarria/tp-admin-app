-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('IN_WAREHOUSE', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED');

-- CreateTable
CREATE TABLE "warehouse_entries" (
    "id" TEXT NOT NULL,
    "wrNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "clientType" TEXT,
    "clientName" TEXT NOT NULL,
    "consigneeName" TEXT,
    "description" TEXT,
    "pieces" INTEGER NOT NULL DEFAULT 1,
    "pieceType" TEXT NOT NULL DEFAULT 'Cajas',
    "weight" DOUBLE PRECISION,
    "largo" DOUBLE PRECISION,
    "ancho" DOUBLE PRECISION,
    "alto" DOUBLE PRECISION,
    "unidadMedida" TEXT NOT NULL DEFAULT 'cm',
    "originWarehouse" TEXT NOT NULL DEFAULT 'CHINA',
    "destWarehouse" TEXT,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'IN_WAREHOUSE',
    "coordinatorId" TEXT,
    "coordinatorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_entries_wrNumber_key" ON "warehouse_entries"("wrNumber");

-- CreateIndex
CREATE INDEX "warehouse_entries_wrNumber_idx" ON "warehouse_entries"("wrNumber");

-- CreateIndex
CREATE INDEX "warehouse_entries_status_idx" ON "warehouse_entries"("status");

-- CreateIndex
CREATE INDEX "warehouse_entries_clientId_idx" ON "warehouse_entries"("clientId");

-- CreateIndex
CREATE INDEX "warehouse_entries_createdAt_idx" ON "warehouse_entries"("createdAt");
