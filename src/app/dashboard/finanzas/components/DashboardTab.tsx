'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { TrendingUp, TrendingDown, FilterAlt } from '@mui/icons-material';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatMoney, type FinanceSummary } from '@/lib/finance';
import PendientesAlert from './PendientesAlert';

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

const INK = '#0A0A0A';
const GRAY = '#78716C';
const ACCENT = '#FACC15';
const GREEN = '#047857';
const RED = '#B91C1C';
const BLUE = '#3B82F6';

const CARD_SX = {
  borderRadius: '16px',
  border: '1px solid rgba(10,10,10,0.06)',
  background: '#FFFFFF',
} as const;

const TITLE_FONT = '"Poppins", sans-serif';
const HEADER_FONT = { fontFamily: TITLE_FONT } as const;

const HEAD_CELL_SX = {
  ...HEADER_FONT,
  fontWeight: 600,
  color: INK,
  borderBottom: '1px solid rgba(10,10,10,0.06)',
} as const;

const UNIT_SALARIO = 'Salario Personal';
const UNIT_DIVIDENDOS = 'Dividendos Empresa';

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Scope = 'TODOS' | 'NEGOCIO' | 'PERSONAL';

type KpiTone = 'green' | 'red' | 'blue' | 'neutral';

type UnitRow = {
  unit: string;
  ingresos: number;
  egresos: number;
  neto: number;
  movimientos: number;
};

type ByUnitResponse = {
  data: UnitRow[];
  totales: { ingresos: number; egresos: number; neto: number };
};

type MonthlyRow = {
  month: number;
  ingresos: number;
  egresos: number;
  neto: number;
};

type SpendingRow = {
  key: string;
  total: number;
  pct: number;
  movimientos: number;
};

type SpendingResponse = {
  byUnit: SpendingRow[];
  byCategory: SpendingRow[];
  totalEgresos: number;
};

type OperationRow = {
  id: string;
  name: string;
  containerNumber?: string | null;
  ganancia: number;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** API `pct` may arrive as a fraction (0..1) or already as 0..100. Normalize to 0..100. */
function toPercent(pct: unknown, total: number, totalEgresos: number): number {
  const raw = typeof pct === 'number' && Number.isFinite(pct) ? pct : NaN;
  if (Number.isNaN(raw)) {
    return totalEgresos > 0 ? (total / totalEgresos) * 100 : 0;
  }
  return raw <= 1 ? raw * 100 : raw;
}

const clampBar = (v: number) => Math.min(Math.max(v, 0), 100);

function scopeParam(scope: Scope): string {
  return scope === 'TODOS' ? '' : `&scope=${scope}`;
}

async function getJson<T>(url: string, errMsg: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errMsg);
  return (await res.json()) as T;
}

function normalizeUnitRows(raw: unknown): UnitRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      unit: typeof r.unit === 'string' && r.unit ? r.unit : 'Sin unidad',
      ingresos: num(r.ingresos),
      egresos: num(r.egresos),
      neto: num(r.neto),
      movimientos: num(r.movimientos),
    }));
}

function normalizeMonthly(raw: unknown): MonthlyRow[] {
  const byMonth = new Map<number, MonthlyRow>();
  if (Array.isArray(raw)) {
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue;
      const row = r as Record<string, unknown>;
      const month = num(row.month);
      if (month < 1 || month > 12) continue;
      byMonth.set(month, {
        month,
        ingresos: num(row.ingresos),
        egresos: num(row.egresos),
        neto: num(row.neto),
      });
    }
  }
  // Always render the full 12 months so the table reads like a calendar year.
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return byMonth.get(m) ?? { month: m, ingresos: 0, egresos: 0, neto: 0 };
  });
}

function normalizeSpending(raw: unknown): SpendingRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      key: typeof r.key === 'string' && r.key ? r.key : 'Sin clasificar',
      total: num(r.total),
      pct: typeof r.pct === 'number' ? r.pct : NaN,
      movimientos: num(r.movimientos),
    }));
}

function normalizeOperations(raw: unknown): OperationRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r, i) => ({
      id: typeof r.id === 'string' ? r.id : String(i),
      name: typeof r.name === 'string' && r.name ? r.name : 'Operación sin nombre',
      containerNumber: typeof r.containerNumber === 'string' ? r.containerNumber : null,
      ganancia: num(r.ganancia),
    }));
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function DashboardTab({
  year,
  onQuickAdd,
}: {
  year: number;
  onQuickAdd: () => void;
}) {
  // El dueño pide la foto del negocio: por defecto filtramos a NEGOCIO.
  const [scope, setScope] = useState<Scope>('NEGOCIO');
  // Se incrementa al clasificar pendientes: estos totales acaban de cambiar.
  const [refreshKey, setRefreshKey] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [totales, setTotales] = useState({ ingresos: 0, egresos: 0, neto: 0 });
  const [salario, setSalario] = useState<MonthlyRow[]>([]);
  const [dividendos, setDividendos] = useState<MonthlyRow[]>([]);
  const [spending, setSpending] = useState<SpendingResponse | null>(null);
  const [operations, setOperations] = useState<OperationRow[]>([]);

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      setLoading(true);
      setError(null);
      const sp = scopeParam(scope);
      try {
        const [summaryRes, byUnit, salarioRes, divRes, spendingRes] = await Promise.all([
          getJson<FinanceSummary>(
            `/api/finanzas/summary?year=${year}${sp}`,
            'No se pudo cargar el resumen',
          ),
          getJson<ByUnitResponse>(
            `/api/finanzas/summary/by-unit?year=${year}${sp}`,
            'No se pudo cargar el resumen por rubro',
          ),
          getJson<{ data: MonthlyRow[] }>(
            `/api/finanzas/summary/monthly-by-unit?year=${year}&unit=${encodeURIComponent(UNIT_SALARIO)}${sp}`,
            'No se pudo cargar el detalle de Salario Personal',
          ),
          getJson<{ data: MonthlyRow[] }>(
            `/api/finanzas/summary/monthly-by-unit?year=${year}&unit=${encodeURIComponent(UNIT_DIVIDENDOS)}${sp}`,
            'No se pudo cargar el detalle de Dividendos',
          ),
          getJson<SpendingResponse>(
            `/api/finanzas/summary/spending?year=${year}${sp}`,
            'No se pudo cargar el desglose de egresos',
          ),
        ]);
        if (signal.cancelled) return;

        setSummary(summaryRes);
        setUnits(normalizeUnitRows(byUnit?.data));
        setTotales({
          ingresos: num(byUnit?.totales?.ingresos),
          egresos: num(byUnit?.totales?.egresos),
          neto: num(byUnit?.totales?.neto),
        });
        setSalario(normalizeMonthly(salarioRes?.data));
        setDividendos(normalizeMonthly(divRes?.data));
        setSpending({
          byUnit: normalizeSpending(spendingRes?.byUnit),
          byCategory: normalizeSpending(spendingRes?.byCategory),
          totalEgresos: num(spendingRes?.totalEgresos),
        });
      } catch (e) {
        if (!signal.cancelled) {
          setError(e instanceof Error ? e.message : 'Error inesperado');
        }
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    },
    [year, scope, refreshKey],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  // Teaser de operaciones: si falla o no hay, simplemente no se muestra.
  useEffect(() => {
    let cancelled = false;
    getJson<{ data: OperationRow[] }>('/api/finanzas/operations', 'sin operaciones')
      .then((json) => {
        if (!cancelled) setOperations(normalizeOperations(json?.data));
      })
      .catch(() => {
        if (!cancelled) setOperations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const maxAbsNeto = units.reduce((m, u) => Math.max(m, Math.abs(u.neto)), 0);

  const header = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
    >
      <Box>
        <Typography
          sx={{ ...HEADER_FONT, fontWeight: 700, fontSize: 20, color: INK }}
        >
          Resumen {year}
        </Typography>
        <Typography variant="body2" sx={{ color: GRAY, mt: 0.25 }}>
          Qué deja cada rubro, cuánto te llevas y de dónde sale el dinero.
        </Typography>
      </Box>
      <Button
        onClick={onQuickAdd}
        startIcon={<AddRoundedIcon />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '12px',
          background: ACCENT,
          color: INK,
          px: 2.5,
          flexShrink: 0,
          '&:hover': { background: '#EAB308' },
        }}
      >
        Registrar movimiento
      </Button>
    </Stack>
  );

  const kpis = summary?.kpis;
  const monthly = summary?.monthly ?? [];
  const unitsByEgresos = [...units].sort((a, b) => b.egresos - a.egresos);
  const isEmpty =
    !kpis || (kpis.transacciones === 0 && kpis.ingresos === 0 && kpis.egresos === 0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Arriba del todo: si hay movimientos sin clasificar, las cifras de
          abajo están contando gastos personales como si fueran del negocio. */}
      <PendientesAlert year={year} onChanged={() => setRefreshKey((k) => k + 1)} />

      <Paper elevation={0} sx={{ ...CARD_SX, p: { xs: 2, sm: 2.5 } }}>
        {header}
        <ScopeControl scope={scope} onScope={setScope} />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : isEmpty ? (
        <Paper elevation={0} sx={{ ...CARD_SX, p: 6, textAlign: 'center' }}>
          <AccountBalanceWalletRoundedIcon
            sx={{ fontSize: 48, color: GRAY, opacity: 0.5, mb: 1 }}
          />
          <Typography sx={{ ...HEADER_FONT, fontWeight: 600, color: INK, fontSize: 18 }}>
            Aún no hay movimientos registrados
          </Typography>
          <Typography sx={{ color: GRAY, fontSize: 14, mt: 1 }}>
            Comienza registrando tu primer ingreso o egreso del {year}.
          </Typography>
          <Button
            onClick={onQuickAdd}
            startIcon={<AddRoundedIcon />}
            sx={{
              mt: 3,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '12px',
              background: ACCENT,
              color: INK,
              px: 3,
              '&:hover': { background: '#EAB308' },
            }}
          >
            Registrar movimiento
          </Button>
        </Paper>
      ) : (
        <>
          {/* 0 — La línea de resumen: los KPIs globales, en pequeño. */}
          <KpiStrip kpis={kpis} />

          {/* 1 — LO PRINCIPAL: cuánto deja cada rubro */}
          <Section
            title="Cuánto deja cada rubro"
            subtitle={`Ingresos, egresos y utilidad neta por unidad · ${year}`}
          >
            {units.length === 0 ? (
              <EmptyNote>No hay movimientos por rubro para {year} en este ámbito.</EmptyNote>
            ) : (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      lg: 'repeat(3, 1fr)',
                    },
                  }}
                >
                  {units.map((u) => (
                    <RubroCard key={u.unit} row={u} maxAbsNeto={maxAbsNeto} />
                  ))}
                </Box>
                <TotalsStrip totales={totales} />
              </>
            )}
          </Section>

          {/* 2 — Gráficas */}
          <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
              <SectionCard title="Ingresos vs. Egresos por mes">
                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={monthly}
                      margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(10,10,10,0.06)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: GRAY }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: GRAY }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatMoney(Number(v))}
                        width={90}
                      />
                      <Tooltip
                        formatter={(value: any) => formatMoney(Number(value))}
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(10,10,10,0.08)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar
                        dataKey="ingresos"
                        name="Ingresos"
                        fill={GREEN}
                        radius={[4, 4, 0, 0]}
                        barSize={14}
                      />
                      <Bar
                        dataKey="egresos"
                        name="Egresos"
                        fill={RED}
                        radius={[4, 4, 0, 0]}
                        barSize={14}
                      />
                      <Line
                        type="monotone"
                        dataKey="neto"
                        name="Flujo Neto"
                        stroke={BLUE}
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={5}>
              <SectionCard title="Egresos por unidad">
                {unitsByEgresos.length === 0 ? (
                  <Typography sx={{ color: GRAY, fontSize: 14 }}>
                    Sin egresos por unidad.
                  </Typography>
                ) : (
                  <Box sx={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={unitsByEgresos}
                        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(10,10,10,0.06)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: GRAY }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => formatMoney(Number(v))}
                        />
                        <YAxis
                          type="category"
                          dataKey="unit"
                          tick={{ fontSize: 12, fill: INK }}
                          tickLine={false}
                          axisLine={false}
                          width={110}
                        />
                        <Tooltip
                          formatter={(value: any) => formatMoney(Number(value))}
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid rgba(10,10,10,0.08)',
                          }}
                        />
                        <Bar
                          dataKey="egresos"
                          name="Egresos"
                          fill={RED}
                          radius={[0, 6, 6, 0]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </SectionCard>
            </Grid>
          </Grid>

          {/* 3 — Teaser de operaciones */}
          <OperacionesTeaser rows={operations} />

          {/* 4 — De dónde sale el dinero */}
          <Section
            title="De dónde sale el dinero"
            subtitle={`Egresos de ${year} repartidos por unidad y por categoría`}
          >
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              }}
            >
              <SpendingBreakdown
                heading="Por unidad"
                rows={spending?.byUnit ?? []}
                totalEgresos={spending?.totalEgresos ?? 0}
              />
              <SpendingBreakdown
                heading="Por categoría"
                rows={spending?.byCategory ?? []}
                totalEgresos={spending?.totalEgresos ?? 0}
              />
            </Box>
            {!!spending && (
              <Typography variant="caption" sx={{ color: GRAY, mt: 1.5, display: 'block' }}>
                Total de egresos considerados: <strong>{formatMoney(spending.totalEgresos)}</strong>
              </Typography>
            )}
          </Section>

          {/* 5 — Salario Personal mes a mes */}
          <MonthlyUnitTable
            title="Salario Personal mes a mes"
            subtitle={`Lo que entra y sale por la bolsa "${UNIT_SALARIO}" · ${year}`}
            rows={salario}
          />

          {/* 6 — Dividendos mes a mes */}
          <MonthlyUnitTable
            title="Dividendos mes a mes"
            subtitle={`Lo que entra y sale por la bolsa "${UNIT_DIVIDENDOS}" · ${year}`}
            rows={dividendos}
          />
        </>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Ámbito                                                              */
/* ------------------------------------------------------------------ */

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'NEGOCIO', label: 'Negocio' },
  { value: 'PERSONAL', label: 'Personal' },
];

const SCOPE_NOTE: Record<Scope, string> = {
  TODOS: 'Mostrando TODO: negocio y gastos personales mezclados.',
  NEGOCIO: 'Mostrando solo lo del NEGOCIO. Los gastos personales pagados desde las bolsas del negocio quedan fuera.',
  PERSONAL: 'Mostrando solo lo PERSONAL.',
};

function ScopeControl({ scope, onScope }: { scope: Scope; onScope: (s: Scope) => void }) {
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
        <Typography
          variant="caption"
          sx={{ ...HEADER_FONT, fontWeight: 700, color: INK, letterSpacing: 0.4 }}
        >
          ÁMBITO
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={scope}
          onChange={(_e, v: Scope | null) => {
            if (v) onScope(v);
          }}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              color: INK,
              borderColor: 'rgba(10,10,10,0.12)',
              px: 2,
            },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: ACCENT,
              color: INK,
              '&:hover': { bgcolor: '#FDE047' },
            },
          }}
        >
          {SCOPE_OPTIONS.map((o) => (
            <ToggleButton key={o.value} value={o.value}>
              {o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: 2,
          background: 'rgba(250,204,21,0.12)',
          border: '1px solid rgba(250,204,21,0.45)',
        }}
      >
        <FilterAlt sx={{ fontSize: 18, color: INK }} />
        <Typography variant="caption" sx={{ color: INK, fontWeight: 600 }}>
          {SCOPE_NOTE[scope]}
        </Typography>
      </Box>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* KPIs globales (la línea de resumen, no la historia completa)        */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: KpiTone;
}) {
  const toneColor =
    tone === 'green' ? GREEN : tone === 'red' ? RED : tone === 'blue' ? BLUE : INK;

  return (
    <Box
      sx={{
        borderRadius: '12px',
        border: '1px solid rgba(10,10,10,0.06)',
        p: 1.5,
        height: '100%',
        background: '#FFFFFF',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${toneColor}14`,
            color: toneColor,
            '& svg': { fontSize: 16 },
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ color: GRAY, fontSize: 12, fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography
        sx={{
          ...HEADER_FONT,
          fontWeight: 700,
          fontSize: 17,
          lineHeight: 1.15,
          color: toneColor,
        }}
      >
        {value}
      </Typography>
      {sub ? (
        <Typography sx={{ color: GRAY, fontSize: 11, mt: 0.25 }}>{sub}</Typography>
      ) : null}
    </Box>
  );
}

function KpiStrip({ kpis }: { kpis: FinanceSummary['kpis'] }) {
  const flujoTone: KpiTone = kpis.flujoNeto >= 0 ? 'green' : 'red';
  return (
    <Section title="La foto general" subtitle="El total de todos los rubros juntos">
      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Ingresos"
            value={formatMoney(kpis.ingresos)}
            tone="green"
            icon={<TrendingUpRoundedIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Egresos"
            value={formatMoney(kpis.egresos)}
            tone="red"
            icon={<TrendingDownRoundedIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Flujo Neto"
            value={formatMoney(kpis.flujoNeto)}
            tone={flujoTone}
            icon={<AccountBalanceWalletRoundedIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Por Cobrar"
            value={formatMoney(kpis.porCobrar)}
            tone="blue"
            icon={<CallReceivedRoundedIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Por Pagar"
            value={formatMoney(kpis.porPagar)}
            tone="neutral"
            icon={<CallMadeRoundedIcon />}
          />
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <StatCard
            label="Mejor Mes"
            value={kpis.mejorMes ? kpis.mejorMes.label : '—'}
            sub={kpis.mejorMes ? formatMoney(kpis.mejorMes.neto) : 'Sin datos'}
            tone="neutral"
            icon={<EmojiEventsRoundedIcon />}
          />
        </Grid>
      </Grid>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ ...CARD_SX, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ ...HEADER_FONT, fontWeight: 600, color: INK }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: GRAY }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Paper>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ ...CARD_SX, p: 2.5 }}>
      <Typography
        sx={{ ...HEADER_FONT, fontWeight: 600, fontSize: 16, color: INK, mb: 2 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="body2" sx={{ color: GRAY }}>
        {children}
      </Typography>
    </Box>
  );
}

function RubroCard({ row, maxAbsNeto }: { row: UnitRow; maxAbsNeto: number }) {
  const positive = row.neto >= 0;
  const color = positive ? GREEN : RED;
  const barValue = maxAbsNeto > 0 ? clampBar((Math.abs(row.neto) / maxAbsNeto) * 100) : 0;

  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid rgba(10,10,10,0.08)',
        borderLeft: `4px solid ${color}`,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        background: '#FFFFFF',
        transition: 'box-shadow .15s ease',
        '&:hover': { boxShadow: '0 6px 20px rgba(10,10,10,0.07)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          sx={{ ...HEADER_FONT, fontWeight: 700, color: INK, fontSize: 15, lineHeight: 1.3 }}
        >
          {row.unit}
        </Typography>
        <Chip
          size="small"
          label={`${row.movimientos} mov.`}
          sx={{
            bgcolor: 'rgba(10,10,10,0.05)',
            color: GRAY,
            fontWeight: 600,
            height: 22,
            fontSize: 11,
          }}
        />
      </Box>

      {/* Neto — la cifra dominante */}
      <Box>
        <Typography variant="caption" sx={{ color: GRAY, fontWeight: 600 }}>
          NETO
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {positive ? (
            <TrendingUp sx={{ color, fontSize: 22 }} />
          ) : (
            <TrendingDown sx={{ color, fontSize: 22 }} />
          )}
          <Typography
            sx={{
              ...HEADER_FONT,
              fontWeight: 700,
              color,
              fontSize: { xs: 24, sm: 26 },
              lineHeight: 1.15,
            }}
          >
            {formatMoney(row.neto)}
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={barValue}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(10,10,10,0.06)',
          '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 3 },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, pt: 0.25 }}>
        <Box>
          <Typography variant="caption" sx={{ color: GRAY, display: 'block' }}>
            Ingresos
          </Typography>
          <Typography sx={{ color: GREEN, fontWeight: 600, fontSize: 14 }}>
            {formatMoney(row.ingresos)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: GRAY, display: 'block' }}>
            Egresos
          </Typography>
          <Typography sx={{ color: RED, fontWeight: 600, fontSize: 14 }}>
            {formatMoney(row.egresos)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function TotalsStrip({ totales }: { totales: { ingresos: number; egresos: number; neto: number } }) {
  const items = [
    { label: 'Ingresos totales', value: totales.ingresos, color: GREEN },
    { label: 'Egresos totales', value: totales.egresos, color: RED },
    { label: 'Neto total', value: totales.neto, color: totales.neto >= 0 ? GREEN : RED },
  ];
  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        borderRadius: '14px',
        background: 'rgba(250,204,21,0.10)',
        border: '1px solid rgba(250,204,21,0.4)',
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      {items.map((it) => (
        <Box key={it.label}>
          <Typography variant="caption" sx={{ color: GRAY, fontWeight: 600, display: 'block' }}>
            {it.label}
          </Typography>
          <Typography sx={{ ...HEADER_FONT, fontWeight: 700, color: it.color, fontSize: 18 }}>
            {formatMoney(it.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function OperacionesTeaser({ rows }: { rows: OperationRow[] }) {
  if (rows.length === 0) return null;
  const top = [...rows].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);

  return (
    <Section
      title="Ganancia por operación"
      subtitle="Resumen rápido · el detalle completo está en la pestaña Operaciones"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {top.map((op) => (
          <Box
            key={op.id}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 2,
              py: 1,
              borderBottom: '1px solid rgba(10,10,10,0.06)',
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>
              {op.name}
              {op.containerNumber ? (
                <Typography component="span" variant="caption" sx={{ color: GRAY, ml: 1 }}>
                  {op.containerNumber}
                </Typography>
              ) : null}
            </Typography>
            <Typography
              sx={{
                ...HEADER_FONT,
                fontWeight: 700,
                fontSize: 14,
                color: op.ganancia >= 0 ? GREEN : RED,
                flexShrink: 0,
              }}
            >
              {formatMoney(op.ganancia)}
            </Typography>
          </Box>
        ))}
      </Box>
      {rows.length > top.length && (
        <Typography variant="caption" sx={{ color: GRAY, mt: 1.5, display: 'block' }}>
          Mostrando las {top.length} de mayor ganancia de {rows.length} operaciones.
        </Typography>
      )}
    </Section>
  );
}

function MonthlyUnitTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: MonthlyRow[];
}) {
  const totals = rows.reduce(
    (acc, r) => {
      acc.ingresos += r.ingresos;
      acc.egresos += r.egresos;
      acc.neto += r.neto;
      return acc;
    },
    { ingresos: 0, egresos: 0, neto: 0 },
  );

  return (
    <Paper elevation={0} sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h6" sx={{ ...HEADER_FONT, fontWeight: 600, color: INK }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: GRAY }}>
          {subtitle}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={HEAD_CELL_SX}>Mes</TableCell>
              <TableCell align="right" sx={HEAD_CELL_SX}>Entra</TableCell>
              <TableCell align="right" sx={HEAD_CELL_SX}>Sale</TableCell>
              <TableCell align="right" sx={HEAD_CELL_SX}>Neto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const empty = r.ingresos === 0 && r.egresos === 0 && r.neto === 0;
              return (
                <TableRow key={r.month} hover>
                  <TableCell sx={{ color: empty ? GRAY : INK }}>
                    {MONTH_LABELS[r.month - 1] ?? `Mes ${r.month}`}
                  </TableCell>
                  <TableCell align="right" sx={{ color: empty ? GRAY : GREEN, fontWeight: 500 }}>
                    {formatMoney(r.ingresos)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: empty ? GRAY : RED, fontWeight: 500 }}>
                    {formatMoney(r.egresos)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: empty ? GRAY : r.neto >= 0 ? GREEN : RED, fontWeight: 700 }}
                  >
                    {formatMoney(r.neto)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ background: 'rgba(250,204,21,0.08)' }}>
              <TableCell sx={{ ...HEADER_FONT, fontWeight: 700, color: INK }}>TOTAL</TableCell>
              <TableCell align="right" sx={{ color: GREEN, fontWeight: 700 }}>
                {formatMoney(totals.ingresos)}
              </TableCell>
              <TableCell align="right" sx={{ color: RED, fontWeight: 700 }}>
                {formatMoney(totals.egresos)}
              </TableCell>
              <TableCell align="right" sx={{ color: totals.neto >= 0 ? GREEN : RED, fontWeight: 700 }}>
                {formatMoney(totals.neto)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function SpendingBreakdown({
  heading,
  rows,
  totalEgresos,
}: {
  heading: string;
  rows: SpendingRow[];
  totalEgresos: number;
}) {
  return (
    <Box
      sx={{
        borderRadius: '14px',
        border: '1px solid rgba(10,10,10,0.08)',
        p: 2,
      }}
    >
      <Typography sx={{ ...HEADER_FONT, fontWeight: 700, color: INK, mb: 1.5, fontSize: 14 }}>
        {heading}
      </Typography>

      {rows.length === 0 ? (
        <EmptyNote>Sin egresos registrados.</EmptyNote>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {rows.map((r) => {
            const percent = toPercent(r.pct, r.total, totalEgresos);
            return (
              <Box key={r.key}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>
                    {r.key}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
                    <Typography sx={{ color: RED, fontWeight: 700, fontSize: 13 }}>
                      {formatMoney(r.total)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: GRAY, minWidth: 42, textAlign: 'right' }}>
                      {percent.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={clampBar(percent)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(10,10,10,0.06)',
                    '& .MuiLinearProgress-bar': { backgroundColor: RED, borderRadius: 4 },
                  }}
                />
                <Typography variant="caption" sx={{ color: GRAY }}>
                  {r.movimientos} movimiento{r.movimientos === 1 ? '' : 's'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
