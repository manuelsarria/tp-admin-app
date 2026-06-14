-- CreateTable: cargo_management_clients (clientes asignados a cada contenedor)
CREATE TABLE IF NOT EXISTS "cargo_management_clients" (
    "id" TEXT NOT NULL,
    "cargoManagementId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cbm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_management_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "cargo_management_clients_cargoManagementId_companyId_key" ON "cargo_management_clients"("cargoManagementId", "companyId");
CREATE INDEX IF NOT EXISTS "cargo_management_clients_cargoManagementId_idx" ON "cargo_management_clients"("cargoManagementId");
CREATE INDEX IF NOT EXISTS "cargo_management_clients_companyId_idx" ON "cargo_management_clients"("companyId");

-- AddForeignKey
ALTER TABLE "cargo_management_clients" ADD CONSTRAINT "cargo_management_clients_cargoManagementId_fkey"
    FOREIGN KEY ("cargoManagementId") REFERENCES "cargo_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cargo_management_clients" ADD CONSTRAINT "cargo_management_clients_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
