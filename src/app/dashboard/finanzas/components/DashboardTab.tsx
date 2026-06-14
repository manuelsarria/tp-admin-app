'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Stack,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded';
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
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

const INK = '#0A0A0A';
const GRAY = '#78716C';
const ACCENT = '#FACC15';
const GREEN = '#10B981';
const RED = '#EF4444';
const BLUE = '#3B82F6';

const CARD_SX = {
  borderRadius: '16px',
  border: '1px solid rgba(10,10,10,0.06)',
  background: '#FFFFFF',
} as const;

const TITLE_FONT = '"Poppins", sans-serif';

type KpiTone = 'green' | 'red' | 'blue' | 'neutral';

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
    tone === 'green'
      ? GREEN
      : tone === 'red'
      ? RED
      : tone === 'blue'
      ? BLUE
      : INK;

  return (
    <Paper elevation={0} sx={{ ...CARD_SX, p: 2.5, height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${toneColor}14`,
            color: toneColor,
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{ color: GRAY, fontSize: 13, fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontFamily: TITLE_FONT,
          fontWeight: 700,
          fontSize: 24,
          lineHeight: 1.1,
          color: toneColor,
        }}
      >
        {value}
      </Typography>
      {sub ? (
        <Typography sx={{ color: GRAY, fontSize: 12, mt: 0.5 }}>{sub}</Typography>
      ) : null}
    </Paper>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ ...CARD_SX, p: 2.5 }}>
      <Typography
        sx={{
          fontFamily: TITLE_FONT,
          fontWeight: 600,
          fontSize: 16,
          color: INK,
          mb: 2,
        }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default function DashboardTab({
  year,
  onQuickAdd,
}: {
  year: number;
  onQuickAdd: () => void;
}) {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/finanzas/summary?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el resumen');
        return res.json();
      })
      .then((json: FinanceSummary) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Error al cargar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const header = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Typography
        sx={{
          fontFamily: TITLE_FONT,
          fontWeight: 700,
          fontSize: 20,
          color: INK,
        }}
      >
        Resumen {year}
      </Typography>
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
          '&:hover': { background: '#EAB308' },
        }}
      >
        Registrar movimiento
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <Box>
        {header}
        <LinearProgress
          sx={{
            borderRadius: 4,
            height: 6,
            '& .MuiLinearProgress-bar': { background: ACCENT },
            background: 'rgba(10,10,10,0.06)',
          }}
        />
        <Typography sx={{ color: GRAY, fontSize: 13, mt: 2 }}>
          Cargando resumen financiero...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {header}
        <Paper elevation={0} sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: RED, fontWeight: 600 }}>{error}</Typography>
        </Paper>
      </Box>
    );
  }

  const isEmpty =
    !data ||
    (data.kpis.transacciones === 0 &&
      data.kpis.ingresos === 0 &&
      data.kpis.egresos === 0);

  if (isEmpty) {
    return (
      <Box>
        {header}
        <Paper
          elevation={0}
          sx={{ ...CARD_SX, p: 6, textAlign: 'center' }}
        >
          <AccountBalanceWalletRoundedIcon
            sx={{ fontSize: 48, color: GRAY, opacity: 0.5, mb: 1 }}
          />
          <Typography
            sx={{
              fontFamily: TITLE_FONT,
              fontWeight: 600,
              color: INK,
              fontSize: 18,
            }}
          >
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
      </Box>
    );
  }

  const { kpis, monthly, byUnit } = data;
  const flujoTone: KpiTone = kpis.flujoNeto >= 0 ? 'green' : 'red';

  const unitsByEgresos = [...byUnit].sort((a, b) => b.egresos - a.egresos);

  return (
    <Box>
      {header}

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Ingresos"
            value={formatMoney(kpis.ingresos)}
            tone="green"
            icon={<TrendingUpRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Egresos"
            value={formatMoney(kpis.egresos)}
            tone="red"
            icon={<TrendingDownRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Flujo Neto"
            value={formatMoney(kpis.flujoNeto)}
            tone={flujoTone}
            icon={<AccountBalanceWalletRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Por Cobrar"
            value={formatMoney(kpis.porCobrar)}
            tone="blue"
            icon={<CallReceivedRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Por Pagar"
            value={formatMoney(kpis.porPagar)}
            tone="neutral"
            icon={<CallMadeRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            label="Mejor Mes"
            value={kpis.mejorMes ? kpis.mejorMes.label : '—'}
            sub={
              kpis.mejorMes ? formatMoney(kpis.mejorMes.neto) : 'Sin datos'
            }
            tone="neutral"
            icon={<EmojiEventsRoundedIcon />}
          />
        </Grid>
      </Grid>

      {/* Charts */}
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
                    formatter={(value: any) =>
                      formatMoney(Number(value))
                    }
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
                      formatter={(value: any) =>
                        formatMoney(Number(value))
                      }
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
    </Box>
  );
}
