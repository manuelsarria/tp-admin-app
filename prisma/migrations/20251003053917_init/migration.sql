-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'WORKER', 'BUSINESS_USER');

-- CreateEnum
CREATE TYPE "CargoStatus" AS ENUM ('IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'READY_FOR_DELIVERY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "CargoType" AS ENUM ('MARITIME', 'AIR');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('RECEIVED_IN_WAREHOUSE', 'IN_TRANSIT', 'ARRIVED_PANAMA', 'READY_FOR_DELIVERY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUSINESS_USER',
    "phone" TEXT,
    "avatar" TEXT,
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "dv" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "employees" TEXT,
    "established" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "bl" TEXT NOT NULL,
    "eta" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "departureDate" TIMESTAMP(3),
    "shippingLine" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "tracking" TEXT NOT NULL,
    "status" "CargoStatus" NOT NULL DEFAULT 'IN_TRANSIT',
    "type" "CargoType" NOT NULL DEFAULT 'MARITIME',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_management" (
    "id" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "eta" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" "ContainerStatus" NOT NULL DEFAULT 'RECEIVED_IN_WAREHOUSE',
    "shippingLine" TEXT,
    "departureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_management_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_ruc_key" ON "companies"("ruc");

-- CreateIndex
CREATE INDEX "companies_ruc_idx" ON "companies"("ruc");

-- CreateIndex
CREATE INDEX "companies_isActive_idx" ON "companies"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "containers_bl_key" ON "containers"("bl");

-- CreateIndex
CREATE INDEX "containers_bl_idx" ON "containers"("bl");

-- CreateIndex
CREATE INDEX "containers_eta_idx" ON "containers"("eta");

-- CreateIndex
CREATE INDEX "containers_shippingLine_idx" ON "containers"("shippingLine");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_tracking_key" ON "cargos"("tracking");

-- CreateIndex
CREATE INDEX "cargos_tracking_idx" ON "cargos"("tracking");

-- CreateIndex
CREATE INDEX "cargos_status_idx" ON "cargos"("status");

-- CreateIndex
CREATE INDEX "cargos_type_idx" ON "cargos"("type");

-- CreateIndex
CREATE INDEX "cargos_companyId_idx" ON "cargos"("companyId");

-- CreateIndex
CREATE INDEX "cargo_management_containerNumber_idx" ON "cargo_management"("containerNumber");

-- CreateIndex
CREATE INDEX "cargo_management_status_idx" ON "cargo_management"("status");

-- CreateIndex
CREATE INDEX "cargo_management_eta_idx" ON "cargo_management"("eta");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
