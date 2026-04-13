-- Add items JSON column to fast_quotes for multi-line support
ALTER TABLE "fast_quotes" ADD COLUMN "items" JSONB;
