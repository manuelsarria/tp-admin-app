-- Backfill `personal_ledger_catalog`, which until now was empty.
--
-- The API used to fall back to hardcoded defaults whenever a kind had zero
-- rows, so the dropdowns looked populated while the table was empty. Adding a
-- single value flipped `length > 0` and made the fallback stop applying, which
-- collapsed the list to just that value and looked exactly like data loss.
-- Seeding the table makes it the real source of truth so the fallback can go.
--
-- Idempotent: `ON CONFLICT DO NOTHING` against the existing (kind, value)
-- unique index, so re-running is safe.

-- Defaults (mirror of DEFAULT_UNITS / DEFAULT_CATEGORIES / DEFAULT_METHODS in src/lib/finance.ts)
INSERT INTO "personal_ledger_catalog" ("id", "kind", "value", "active", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, v.kind, v.value, true, v.ord, NOW()
FROM (VALUES
  ('unit', 'Shippy', 0),
  ('unit', 'TrackingPTY', 1),
  ('unit', 'CNC', 2),
  ('unit', 'Salario Personal', 3),
  ('unit', 'Dividendos Empresa', 4),
  ('unit', 'Contenedores Valdai', 5),
  ('unit', 'Ventas Adicionales', 6),
  ('unit', 'Otro', 7),
  ('category', 'Venta servicio', 0),
  ('category', 'Flete', 1),
  ('category', 'Comida', 2),
  ('category', 'Combustible', 3),
  ('category', 'Transporte', 4),
  ('category', 'Salario', 5),
  ('category', 'Comisión', 6),
  ('category', 'Dividendos', 7),
  ('category', 'Proveedor', 8),
  ('category', 'Aduana', 9),
  ('category', 'Bodega', 10),
  ('category', 'Servicios (luz/agua/internet)', 11),
  ('category', 'Software / Suscripciones', 12),
  ('category', 'Mantenimiento', 13),
  ('category', 'Bancos / Comisiones', 14),
  ('category', 'Impuestos', 15),
  ('category', 'Marketing', 16),
  ('category', 'Préstamos', 17),
  ('category', 'Propiedades', 18),
  ('category', 'Otro', 19),
  ('method', 'Efectivo', 0),
  ('method', 'Transferencia', 1),
  ('method', 'ACH', 2),
  ('method', 'Yappy', 3),
  ('method', 'Tarjeta', 4),
  ('method', 'Cheque', 5),
  ('method', 'Débito automático', 6),
  ('method', 'Otro', 7)
) AS v(kind, value, ord)
ON CONFLICT ("kind", "value") DO NOTHING;

-- Rescue every value already used in the journal that isn't a default, so
-- nothing the owner typed by hand disappears from the dropdowns.
INSERT INTO "personal_ledger_catalog" ("id", "kind", "value", "active", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, 'unit', TRIM("unit"), true, 100, NOW()
FROM "personal_ledger_entries"
WHERE "unit" IS NOT NULL AND TRIM("unit") <> ''
GROUP BY TRIM("unit")
ON CONFLICT ("kind", "value") DO NOTHING;

INSERT INTO "personal_ledger_catalog" ("id", "kind", "value", "active", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, 'category', TRIM("category"), true, 100, NOW()
FROM "personal_ledger_entries"
WHERE "category" IS NOT NULL AND TRIM("category") <> ''
GROUP BY TRIM("category")
ON CONFLICT ("kind", "value") DO NOTHING;

INSERT INTO "personal_ledger_catalog" ("id", "kind", "value", "active", "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, 'method', TRIM("method"), true, 100, NOW()
FROM "personal_ledger_entries"
WHERE "method" IS NOT NULL AND TRIM("method") <> ''
GROUP BY TRIM("method")
ON CONFLICT ("kind", "value") DO NOTHING;
