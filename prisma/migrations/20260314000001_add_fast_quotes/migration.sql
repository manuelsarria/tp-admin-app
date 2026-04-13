-- CreateTable
CREATE TABLE "fast_quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "cliente" TEXT NOT NULL,
    "direccion" TEXT,
    "medidaLargo" DOUBLE PRECISION,
    "medidaAncho" DOUBLE PRECISION,
    "medidaAlto" DOUBLE PRECISION,
    "tipoCarga" TEXT,
    "tipoEnvio" TEXT NOT NULL DEFAULT 'MARITIMO',
    "cbmFt3" DOUBLE PRECISION,
    "unidadVolumen" TEXT NOT NULL DEFAULT 'CBM',
    "tiempoTransito" INTEGER NOT NULL DEFAULT 45,
    "validezTarifa" INTEGER NOT NULL DEFAULT 10,
    "peso" DOUBLE PRECISION,
    "flete" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraManejo" DOUBLE PRECISION,
    "entregaPanama" DOUBLE PRECISION,
    "descuento" DOUBLE PRECISION,
    "comentarios" TEXT,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "fast_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fast_quotes_quoteNumber_key" ON "fast_quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "fast_quotes_quoteNumber_idx" ON "fast_quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "fast_quotes_status_idx" ON "fast_quotes"("status");

-- CreateIndex
CREATE INDEX "fast_quotes_createdAt_idx" ON "fast_quotes"("createdAt");
