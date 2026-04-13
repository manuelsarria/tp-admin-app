-- AddColumn itemType and userId to fcl_shipments table
ALTER TABLE "fcl_shipments" ADD COLUMN "itemType" TEXT,
ADD COLUMN "userId" TEXT;

-- AddIndex on the new columns for better query performance
CREATE INDEX "fcl_shipments_userId_idx" ON "fcl_shipments"("userId");
CREATE INDEX "fcl_shipments_itemType_idx" ON "fcl_shipments"("itemType");
