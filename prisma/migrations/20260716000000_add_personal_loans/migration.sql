-- CreateEnum
CREATE TYPE "LoanKind" AS ENUM ('PERSONAL', 'BANCARIO', 'PROPIEDAD');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVO', 'PAGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "LoanPaymentKind" AS ENUM ('CUOTA', 'EXTRAORDINARIO', 'INICIAL', 'AJUSTE');

-- CreateTable
CREATE TABLE "personal_loans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "LoanKind" NOT NULL DEFAULT 'PERSONAL',
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVO',
    "counterparty" TEXT,
    "reference" TEXT,
    "principal" DOUBLE PRECISION NOT NULL,
    "interest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installmentAmount" DOUBLE PRECISION,
    "installmentsTotal" INTEGER,
    "interestRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "firstPaymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "unit" TEXT,
    "category" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_loan_payments" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "kind" "LoanPaymentKind" NOT NULL DEFAULT 'CUOTA',
    "sourceUnit" TEXT,
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "ledgerEntryId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_loan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personal_loans_status_idx" ON "personal_loans"("status");

-- CreateIndex
CREATE INDEX "personal_loans_kind_idx" ON "personal_loans"("kind");

-- CreateIndex
CREATE INDEX "personal_loan_payments_loanId_idx" ON "personal_loan_payments"("loanId");

-- CreateIndex
CREATE INDEX "personal_loan_payments_date_idx" ON "personal_loan_payments"("date");

-- AddForeignKey
ALTER TABLE "personal_loan_payments" ADD CONSTRAINT "personal_loan_payments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "personal_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
