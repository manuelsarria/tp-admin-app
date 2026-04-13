-- AlterTable: add new fields to fcl_shipments
ALTER TABLE "fcl_shipments" ADD COLUMN "totalCbm" DOUBLE PRECISION;
ALTER TABLE "fcl_shipments" ADD COLUMN "totalWeight" DOUBLE PRECISION;
ALTER TABLE "fcl_shipments" ADD COLUMN "comments" TEXT;
ALTER TABLE "fcl_shipments" ADD COLUMN "additionalCode" TEXT;

-- CreateTable: fcl_shipment_pieces
CREATE TABLE "fcl_shipment_pieces" (
    "id" TEXT NOT NULL,
    "fclShipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fcl_shipment_pieces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fcl_shipment_pieces_fclShipmentId_idx" ON "fcl_shipment_pieces"("fclShipmentId");

-- AddForeignKey
ALTER TABLE "fcl_shipment_pieces" ADD CONSTRAINT "fcl_shipment_pieces_fclShipmentId_fkey" FOREIGN KEY ("fclShipmentId") REFERENCES "fcl_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
