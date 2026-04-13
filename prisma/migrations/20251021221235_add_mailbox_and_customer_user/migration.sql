-- Add CUSTOMER_USER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER_USER';

-- Add mailbox column to users table (nullable)
ALTER TABLE "users" ADD COLUMN "mailbox" TEXT;
