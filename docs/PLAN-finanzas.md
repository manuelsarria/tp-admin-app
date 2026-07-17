# Plan — Finanzas Personales

Estado al 16-jul-2026. Recoge todo lo pedido por el dueño; nada se descarta.
Marcado: ✅ hecho · 🚧 en curso · ⬜ pendiente · 🔴 bug

---

## Hallazgos del diagnóstico (leer antes de decidir)

### H1 — El catálogo nunca estuvo en la base
`src/app/api/finanzas/catalog/route.ts:34`

```ts
values[k] = grouped[k].length > 0 ? grouped[k].map(g => g.value) : DEFAULTS[k]
```

Los valores de los desplegables (Shippy, TrackingPTY, CNC…) son un *fallback* en
código, no filas. La tabla `personal_ledger_catalog` está vacía. Al agregar el
primer valor de un tipo, `length > 0` pasa a true, el fallback deja de aplicar y
la lista colapsa a ese único valor. **No se borra nada** — los movimientos
guardan la categoría como texto y están intactos. Pero el síntoma es idéntico a
una pérdida de datos, y hasta que se arregle el módulo de catálogos es
inusable.

### H2 — "Contenedores Valdai" se usa como cartera personal
De 21 egresos con `unit='Contenedores Valdai'`, solo 5 son de contenedores.
El resto: comida, gasolina, arreglo luz casa, agua finca, malla pollos, cajilla
tv, cuota de Yesenia, cargo BAC 0720. Por eso el Resumen "dice de todo".

Ninguna vista nueva arregla esto sola: el dato de entrada mezcla negocio y
gasto personal en la misma unidad.

### H3 — Las referencias de contenedor no cuadran entre sí
| Tipo | Referencia | Monto |
|---|---|---|
| INGRESO | `Contenedor [9507100400]: ETA [29/JUNIO]··COLCHON` (2 espacios) | 4,960.00 |
| EGRESO | `Contenedor [9507100400]: ETA [29/JUNIO]·COLCHON` (1 espacio) | 3,650.00 |
| EGRESO | `Contenedor [9507100400]: ETA [29/JUNIO]·COLCHON` | 270.00 |
| INGRESO | `2 contenedores colchones 1 triciclos` | 2,901.54 |
| EGRESO | `3 contenedores 2 colchones 1 triciclos` | 1,908.60 |
| EGRESO | `3 contenedores 2 colchones 1 triciclos` | 736.00 |

Agrupar por texto libre parte la misma operación en dos. El P&L por contenedor
**exige** una entidad Operación real; sobre texto libre daría números falsos con
apariencia de correctos.

Ganancias reales (calculadas a mano, para validar después):
- Contenedor 9507100400: 4,960 − (3,650 + 270) = **+1,040.00**
- Colchones/triciclos: 2,901.54 − (1,908.60 + 736) = **+256.94**

---

## Fase 0 — Bugs (bloquean el uso hoy)

- ✅ **B1. Botones invisibles.** `variant="contained"` + `bgcolor:'#0A0A0A'` sin
  `color`. El tema tiene `primary.contrastText:'#0A0A0A'` → texto negro sobre
  negro. Arreglado en los 4 botones de finanzas (Registrar, Nuevo, Crear PIN,
  Desbloquear). *Falta desplegar.*
- 🔴 **B2. Catálogos (H1).** Ver Fase 1.

## Fase 1 — Persistencia del catálogo 🔴 PRIORIDAD

1. Migración de datos: insertar `DEFAULT_UNITS/CATEGORIES/METHODS` en
   `personal_ledger_catalog` (idempotente, `ON CONFLICT DO NOTHING`).
2. Sembrar además todo valor `unit`/`category`/`method` que ya exista en
   `personal_ledger_entries` y no esté en los defaults — para no perder los que
   el dueño ya usó a mano.
3. Quitar el fallback fantasma de `catalog/route.ts:34`: el catálogo pasa a ser
   la única fuente de verdad.
4. `@@unique([kind, value])` para que el 409 "ya existe" sea real.
5. Verificar: agregar una categoría y confirmar que las demás siguen ahí.

## Fase 2 — Préstamos y deudas 🚧

- ✅ Esquema `PersonalLoan` + `PersonalLoanPayment` + migración SQL.
- ✅ API: CRUD, pagos, informe PDF. Cada pago abre un EGRESO en el libro diario.
- ✅ UI: pestaña Préstamos, tarjetas, alta/edición, registro de pago, detalle.
- ✅ Seed de los 4 préstamos (`prisma/seed-loans.ts`).
- 🚧 **Fondo de pago**: `sourceUnit` en cada pago = de qué fondo salió el dinero.
  Es la `unit` del egreso. Columna "Fondo" + bloque "Pagos por fondo" en el PDF.
- ⬜ Rediseño "profesional" del módulo (ver Fase 5).

### Datos cargados (confirmar contra las hojas)
| Préstamo | Total | Pagado | Saldo | Cuotas |
|---|---:|---:|---:|---:|
| Yesenia | 12,600.00 | 7,875.00 | **4,725.00** | 15/24 × 525 |
| Auto/Moto | 21,709.78 | 16,019.09 | **5,690.69** | 59/79 × 271.51 |
| Carlos | 13,440.00 | 10,080.00 | **3,360.00** | 24/32 × 420 |
| Finca Emperador | 98,436.00 | 66,000.00 | **32,436.00** | 26/40 × 1,500 |

Supuestos que hay que validar:
- **Yesenia**: la hoja lista julio–diciembre sin año → se asumió 2025. El pago de
  1,575 (03-sep-25) se tomó como 3 cuotas.
- **Auto**: el banco no da el detalle fecha por fecha; las 59 cuotas se generaron
  mensuales desde el primer pago (5-jul-2021). `totalAmount` se fijó en
  21,709.78 (= 59×271.51 + saldo 5,690.69), algo más que 79×271.51 = 21,449.29,
  por intereses y cargos.
- **Carlos**: la hoja no trae fechas → las 24 cuotas pagadas van consolidadas en
  una sola fila de 10,080.
- **Finca**: una fila de la hoja es ilegible ("13 FEB-12 SEP") → se asumió
  13-nov-24. Saldo 32,436 confirmado por el dueño (no 11,000).
- Los pagos históricos **no** generan egresos retroactivos en el libro: meter ~55
  movimientos de 2024-2026 distorsionaría los reportes mensuales existentes.
  Solo los pagos nuevos desde la app postean al diario.

## Fase 3 — Operaciones / Contenedores Valdai 🚧

Requiere H3. Sin esto, "cuánto deja cada contenedor" no es calculable.
El P&L de una operación cuenta solo `status=PAGADO` y `scope=NEGOCIO`: el gasto
personal que pasó por la bolsa del negocio nunca debe caer en el P&L de un
contenedor.

1. Modelo `PersonalOperation`: nombre, código de contenedor, ETA, estado
   (ABIERTA/CERRADA), notas.
2. `PersonalLedgerEntry.operationId` (opcional, FK). El campo `reference` de
   texto se conserva como está — no se toca el histórico.
3. Selector de Operación en el formulario de movimiento.
4. **Asistente de migración**: agrupa los `reference` existentes por similitud
   (normalizando espacios y mayúsculas), propone las operaciones detectadas
   (9507100400, colchones/triciclos) y deja que el dueño confirme la mezcla.
   Nada se reasigna automáticamente.
5. Vista **Operaciones**: una fila por contenedor con Invertido / Ingresado /
   **Ganancia** / Margen %, y el detalle de movimientos al abrir.
6. Validar contra los números a mano de H3 (+1,040.00 y +256.94).

## Fase 4 — Contabilidad separada por rubro 🚧

1. ✅ **Decisión (16-jul-2026): eje `scope` NEGOCIO/PERSONAL.** El dueño eligió
   la opción (b): la unidad queda como está y no se toca el histórico. El
   backfill de la migración `20260716000002_add_ledger_scope` marca PERSONAL
   solo lo inequívoco (13 de 23 movimientos de Valdai). Se dejaron
   deliberadamente como NEGOCIO los 4 ambiguos, para que los reclasifique a
   mano: `BAC 0720` (500), `couta 15 y 30 de junio` (80.33), `gasolina` (76.28),
   `freidepot` (39.03). Adivinarlos corrompería el P&L en silencio.
2. **Resumen por unidad**: una tarjeta por unidad (Shippy, TrackingPTY, CNC,
   Salario Personal, Dividendos Empresa, Contenedores Valdai, …) con Ingresos,
   Egresos y Neto. Reemplaza el resumen global mezclado.
3. **Salario Personal mes a mes**: tabla 12 meses × (entra / sale / neto).
4. **Dividendos Empresa mes a mes**: igual.
5. **De dónde sale el dinero**: egresos por unidad y por categoría, con % del
   total. Responde "en qué se gasta y desde qué fondo".
6. Los pagos de préstamos ya entran aquí vía `sourceUnit` (Fase 2).

## Fase 5 — Rediseño profesional ⬜
Aplicar a Préstamos, Deudas y a las vistas nuevas: jerarquía visual clara (el
saldo manda), tipografía y espaciado consistentes con el resto del panel,
amarillo #FACC15 / negro #0A0A0A, rojo solo para el semántico de egreso.

---

## Orden sugerido
1. Fase 0 + Fase 1 (bugs + catálogo) — desplegar ya.
2. Fase 2 (préstamos) — desplegar tras migrar y sembrar.
3. Decidir H2 (opción a o b) → Fase 4.
4. Fase 3 (operaciones) → cierra el P&L por contenedor.
5. Fase 5 transversal.
