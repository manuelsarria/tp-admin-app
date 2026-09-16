-- Freight forwarding: HBL de Panamá, líneas de carga y documentos adjuntos.
--
-- Hasta ahora todo HBL era de origen China. Los de Panamá llevan otro agente
-- de carga en la celda 7, otro notify party y un MBL propio, así que el origen
-- pasa a ser un campo y no un supuesto.
--
-- La mercancía era un solo bloque de texto en `description`: un HBL con tres
-- productos de distinto HS code no se podía declarar bien. Ahora cada línea es
-- una fila. `description` se conserva tal cual — los HBL viejos siguen
-- imprimiendo desde ahí mientras no se les carguen líneas.

-- CreateEnum
CREATE TYPE "CargoOrigin" AS ENUM ('CHINA', 'PANAMA');
CREATE TYPE "DocumentKind" AS ENUM ('MBL', 'DCME', 'HBL', 'OTHER');

-- AlterTable: consignee y notify completos + agente + origen + sellos
ALTER TABLE "lcl_bookings"
  ADD COLUMN "clientRuc" TEXT,
  ADD COLUMN "clientDv" TEXT,
  ADD COLUMN "clientEmail" TEXT,
  ADD COLUMN "notifyAddress" TEXT,
  ADD COLUMN "notifyRuc" TEXT,
  ADD COLUMN "notifyDv" TEXT,
  ADD COLUMN "notifyEmail" TEXT,
  ADD COLUMN "forwardingAgent" TEXT,
  ADD COLUMN "omitQr" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "groupedCargo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "origin" "CargoOrigin" NOT NULL DEFAULT 'CHINA',
  ADD COLUMN "stamps" JSONB;

-- AlterTable: el shipper se escribe una vez en el MBL y los HBL lo heredan
ALTER TABLE "lcl_containers"
  ADD COLUMN "shipperName" TEXT,
  ADD COLUMN "shipperAddress" TEXT,
  ADD COLUMN "origin" "CargoOrigin" NOT NULL DEFAULT 'CHINA';

-- CreateIndex
CREATE INDEX "lcl_bookings_origin_idx" ON "lcl_bookings"("origin");
CREATE INDEX "lcl_containers_origin_idx" ON "lcl_containers"("origin");

-- CreateTable
CREATE TABLE "lcl_booking_cargo_items" (
    "id" TEXT NOT NULL,
    "lclBookingId" TEXT NOT NULL,
    "hsCode" TEXT,
    "description" TEXT NOT NULL,
    "packages" INTEGER NOT NULL DEFAULT 1,
    "packageType" TEXT,
    "grossWeightKg" DOUBLE PRECISION,
    "cbm" DOUBLE PRECISION,
    "marks" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lcl_booking_cargo_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lcl_booking_cargo_items_lclBookingId_idx" ON "lcl_booking_cargo_items"("lclBookingId");

ALTER TABLE "lcl_booking_cargo_items" ADD CONSTRAINT "lcl_booking_cargo_items_lclBookingId_fkey" FOREIGN KEY ("lclBookingId") REFERENCES "lcl_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "lclContainerId" TEXT,
    "lclBookingId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documents_storedName_key" ON "documents"("storedName");
CREATE INDEX "documents_lclContainerId_idx" ON "documents"("lclContainerId");
CREATE INDEX "documents_lclBookingId_idx" ON "documents"("lclBookingId");
CREATE INDEX "documents_kind_idx" ON "documents"("kind");

ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_lclContainerId_fkey" FOREIGN KEY ("lclContainerId") REFERENCES "lcl_containers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_lclBookingId_fkey" FOREIGN KEY ("lclBookingId") REFERENCES "lcl_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Correlativo de las series de HBL/MBL.
--
-- Se deducía de las filas (`count()`), y eso reemite números: al borrar un HBL
-- el conteo baja y el siguiente pide uno que ya existe — o, si se borró el
-- último, uno que ya se imprimió. El contador vive aparte y no retrocede.
--
-- No se siembra aquí: la primera vez que se usa una serie, el código la
-- arranca desde el mayor correlativo que ya exista en la tabla.
CREATE TABLE "bl_counters" (
    "prefix" TEXT NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bl_counters_pkey" PRIMARY KEY ("prefix")
);
