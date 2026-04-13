-- AddColumn itemType and userId to container_shipments table
ALTER TABLE "container_shipments" ADD COLUMN "itemType" TEXT,
ADD COLUMN "userId" TEXT;

-- AddIndex on the new columns for better query performance
CREATE INDEX "container_shipments_userId_idx" ON "container_shipments"("userId");
CREATE INDEX "container_shipments_itemType_idx" ON "container_shipments"("itemType");
