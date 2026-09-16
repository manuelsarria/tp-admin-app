-- Seguro de carga: el cotizador calculaba la prima y generaba un PDF sin
-- dejar rastro. El número del papel lo inventaba el generador y no existía
-- en ninguna parte, así que no se podía reimprimir, ni saber qué se cotizó,
-- ni darle seguimiento. Aquí se guarda la cotización.
--
-- La tarifa (rate/minimum) se guarda junto al resultado, no se consulta del
-- tarifario al reimprimir: una cotización vieja debe reimprimirse igual
-- aunque hoy la tasa sea otra.

-- CreateTable
CREATE TABLE "insurance_quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "cliente" TEXT NOT NULL,
    "referencia" TEXT,
    "descripcionCarga" TEXT,
    "valorComercial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorFlete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorTributos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosAdicionalesPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lucroSesantePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clienteType" TEXT NOT NULL DEFAULT 'regular',
    "rateLabel" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "minimum" DOUBLE PRECISION NOT NULL,
    "base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gastosAdicionales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lucroSesante" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAsegurado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorCobrar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comentarios" TEXT,
    "rejectionReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_quotes_quoteNumber_key" ON "insurance_quotes"("quoteNumber");
CREATE INDEX "insurance_quotes_quoteNumber_idx" ON "insurance_quotes"("quoteNumber");
CREATE INDEX "insurance_quotes_status_idx" ON "insurance_quotes"("status");
CREATE INDEX "insurance_quotes_createdAt_idx" ON "insurance_quotes"("createdAt");

-- Notas de seguimiento. Sirven a las tres clases de cotización (normal, fast
-- y seguro), por eso apuntan por (entity, entityId) y no por llave foránea.
-- Borrar al autor no borra la nota: el registro de qué se habló con el
-- cliente sobrevive a la salida del vendedor.

-- CreateEnum
CREATE TYPE "QuoteNoteEntity" AS ENUM ('QUOTE', 'FAST_QUOTE', 'INSURANCE_QUOTE');

-- CreateTable
CREATE TABLE "quote_notes" (
    "id" TEXT NOT NULL,
    "entity" "QuoteNoteEntity" NOT NULL,
    "entityId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_notes_entity_entityId_createdAt_idx" ON "quote_notes"("entity", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "quote_notes" ADD CONSTRAINT "quote_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
