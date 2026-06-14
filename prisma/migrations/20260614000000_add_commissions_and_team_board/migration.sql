-- CreateEnum
CREATE TYPE "CommissionMode" AS ENUM ('FIXED', 'PERCENT');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID');
CREATE TYPE "TeamTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE "TeamTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "mode" "CommissionMode" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_sales" (
    "id" TEXT NOT NULL,
    "saleType" TEXT NOT NULL,
    "saleLabel" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "description" TEXT,
    "saleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionMode" "CommissionMode" NOT NULL,
    "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "workerId" TEXT,
    "workerName" TEXT NOT NULL,
    "workerEmail" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "commission_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "workerId" TEXT,
    "workerName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "paidById" TEXT,
    "paidByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TeamTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TeamTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "team_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "team_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commission_rules_saleType_key" ON "commission_rules"("saleType");
CREATE INDEX "commission_sales_workerId_idx" ON "commission_sales"("workerId");
CREATE INDEX "commission_sales_status_idx" ON "commission_sales"("status");
CREATE INDEX "commission_sales_saleType_idx" ON "commission_sales"("saleType");
CREATE INDEX "commission_payments_workerId_idx" ON "commission_payments"("workerId");
CREATE INDEX "team_tasks_status_idx" ON "team_tasks"("status");
CREATE INDEX "team_tasks_assigneeId_idx" ON "team_tasks"("assigneeId");
CREATE INDEX "team_notes_pinned_idx" ON "team_notes"("pinned");

-- AddForeignKey
ALTER TABLE "commission_sales" ADD CONSTRAINT "commission_sales_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "team_notes" ADD CONSTRAINT "team_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default commission rules (FCL $50, LCL $50, Seguro $15, Cotización Alibaba $2.50)
INSERT INTO "commission_rules" ("id", "saleType", "label", "mode", "value", "active", "sortOrder", "createdAt", "updatedAt") VALUES
    ('cmrule_fcl', 'FCL', 'FCL (Contenedor Completo)', 'FIXED', 50, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cmrule_lcl', 'LCL', 'LCL (Carga Consolidada)', 'FIXED', 50, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cmrule_seguro', 'SEGURO', 'Seguro de Carga', 'FIXED', 15, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cmrule_alibaba', 'COTIZACION_ALIBABA', 'Cotización Alibaba (cliente ya pagó)', 'FIXED', 2.5, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
