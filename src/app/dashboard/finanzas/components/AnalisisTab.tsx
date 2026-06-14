'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { formatMoney, type FinanceInsights } from '@/lib/finance';

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

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
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
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ color: GRAY, fontSize: 13, mt: 0.5, mb: 2 }}>
          {subtitle}
        </Typography>
      ) : (
        <Box sx={{ mb: 2 }} />
      )}
      {children}
    </Paper>
  );
}

function pickRecommendationStyle(text: string): {
  icon: React.ReactNode;
  color: string;
} {
  const lower = text.toLowerCase();
  if (lower.includes('ahorrar')) {
    return { icon: <LightbulbOutlinedIcon />, color: GREEN };
  }
  if (lower.includes('subió') || lower.includes('subio')) {
    return { icon: <TrendingUpRoundedIcon />, color: RED };
  }
  if (lower.includes('rojos') || lower.includes('rojo')) {
    return { icon: <WarningAmberRoundedIcon />, color: RED };
  }
  return { icon: <InsightsRoundedIcon />, color: BLUE };
}

function EmptyState({ message }: { message: string }) {
  return (
    <Typography sx={{ color: GRAY, fontSize: 14 }}>{message}</Typography>
  );
}

export default function AnalisisTab({ year }: { year: number }) {
  const [data, setData] = useState<FinanceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/finanzas/insights?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudieron cargar los análisis');
        return res.json();
      })
      .then((json: FinanceInsights) => {
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

  if (loading) {
    return (
      <Box>
        <LinearProgress
          sx={{
            borderRadius: 4,
            height: 6,
            '& .MuiLinearProgress-bar': { background: ACCENT },
            background: 'rgba(10,10,10,0.06)',
          }}
        />
        <Typography sx={{ color: GRAY, fontSize: 13, mt: 2 }}>
          Analizando tus finanzas...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: RED, fontWeight: 600 }}>{error}</Typography>
      </Paper>
    );
  }

  const isEmpty =
    !data ||
    (data.recommendations.length === 0 &&
      data.topCategories.length === 0 &&
      data.antExpenses.length === 0 &&
      data.trend.length === 0 &&
      data.unitConcerns.length === 0);

  if (isEmpty) {
    return (
      <Paper elevation={0} sx={{ ...CARD_SX, p: 6, textAlign: 'center' }}>
        <InsightsRoundedIcon
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
          Todavía no hay suficiente información para analizar
        </Typography>
        <Typography sx={{ color: GRAY, fontSize: 14, mt: 1 }}>
          Registra más movimientos en {year} y aquí verás consejos y
          tendencias.
        </Typography>
      </Paper>
    );
  }

  const {
    topCategories,
    antExpenses,
    unitConcerns,
    trend,
    recommendations,
  } = data;

  const antByTotal = [...antExpenses].sort((a, b) => b.total - a.total);
  const catsByTotal = [...topCategories].sort((a, b) => b.total - a.total);
  const maxCatPct = Math.max(1, ...catsByTotal.map((c) => c.pct));

  return (
    <Stack spacing={2}>
      {/* Consejos del contador */}
      <SectionCard title="Consejos del contador">
        {recommendations.length === 0 ? (
          <EmptyState message="Sin recomendaciones por ahora." />
        ) : (
          <Stack spacing={1.5}>
            {recommendations.map((rec, i) => {
              const { icon, color } = pickRecommendationStyle(rec);
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 2,
                    borderRadius: '12px',
                    background: `${color}0F`,
                    border: `1px solid ${color}33`,
                  }}
                >
                  <Box sx={{ color, mt: '2px', display: 'flex' }}>{icon}</Box>
                  <Typography
                    sx={{ color: INK, fontSize: 14, fontWeight: 500 }}
                  >
                    {rec}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </SectionCard>

      {/* Gastos hormiga */}
      <SectionCard
        title="Gastos hormiga"
        subtitle="Gastos pequeños y recurrentes que suman a fin de año."
      >
        {antByTotal.length === 0 ? (
          <EmptyState message="No se detectaron gastos hormiga." />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: GRAY, fontWeight: 600 }}>
                    Concepto
                  </TableCell>
                  <TableCell align="right" sx={{ color: GRAY, fontWeight: 600 }}>
                    # mov.
                  </TableCell>
                  <TableCell align="right" sx={{ color: GRAY, fontWeight: 600 }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ color: GRAY, fontWeight: 600 }}>
                    Promedio
                  </TableCell>
                  <TableCell align="right" sx={{ color: GRAY, fontWeight: 600 }}>
                    Por mes
                  </TableCell>
                  <TableCell align="right" sx={{ color: GRAY, fontWeight: 600 }}>
                    Proyección anual
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {antByTotal.map((row, i) => (
                  <TableRow key={`${row.concept}-${i}`}>
                    <TableCell sx={{ color: INK, fontWeight: 500 }}>
                      {row.concept}
                    </TableCell>
                    <TableCell align="right" sx={{ color: INK }}>
                      {row.count}
                    </TableCell>
                    <TableCell align="right" sx={{ color: INK }}>
                      {formatMoney(row.total)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: GRAY }}>
                      {formatMoney(row.avg)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: GRAY }}>
                      {formatMoney(row.perMonth)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatMoney(row.projectedYear)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          background: `${RED}14`,
                          color: RED,
                          borderRadius: '8px',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      {/* Dónde gastas más */}
      <SectionCard title="Dónde gastas más">
        {catsByTotal.length === 0 ? (
          <EmptyState message="Sin categorías de gasto registradas." />
        ) : (
          <Stack spacing={1.75}>
            {catsByTotal.map((cat, i) => (
              <Box key={`${cat.category}-${i}`}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="baseline"
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    sx={{ color: INK, fontSize: 14, fontWeight: 500 }}
                  >
                    {cat.category}
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="baseline">
                    <Typography sx={{ color: GRAY, fontSize: 13 }}>
                      {cat.pct.toFixed(1)}%
                    </Typography>
                    <Typography
                      sx={{ color: INK, fontSize: 14, fontWeight: 600 }}
                    >
                      {formatMoney(cat.total)}
                    </Typography>
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    height: 10,
                    borderRadius: 6,
                    background: 'rgba(10,10,10,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${Math.min(100, (cat.pct / maxCatPct) * 100)}%`,
                      borderRadius: 6,
                      background: BLUE,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </SectionCard>

      {/* Tendencia */}
      <SectionCard
        title="Tendencia (mes vs. mes anterior)"
        subtitle="Comparación del último mes con el anterior por categoría."
      >
        {trend.length === 0 ? (
          <EmptyState message="Aún no hay suficiente histórico para comparar." />
        ) : (
          <Stack spacing={1.25}>
            {trend.map((t, i) => {
              const up = t.deltaPct > 0;
              const deltaColor = up ? RED : GREEN;
              return (
                <Stack
                  key={`${t.category}-${i}`}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    border: '1px solid rgba(10,10,10,0.06)',
                  }}
                >
                  <Typography
                    sx={{ color: INK, fontSize: 14, fontWeight: 500 }}
                  >
                    {t.category}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ color: GRAY, fontSize: 13 }}>
                      {formatMoney(t.prev)} → {formatMoney(t.last)}
                    </Typography>
                    <Chip
                      icon={
                        up ? (
                          <TrendingUpRoundedIcon
                            sx={{ fontSize: 16, color: `${deltaColor} !important` }}
                          />
                        ) : (
                          <TrendingDownRoundedIcon
                            sx={{ fontSize: 16, color: `${deltaColor} !important` }}
                          />
                        )
                      }
                      label={`${up ? '+' : ''}${t.deltaPct.toFixed(1)}%`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        background: `${deltaColor}14`,
                        color: deltaColor,
                        borderRadius: '8px',
                      }}
                    />
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </SectionCard>

      {/* Unidades en rojo */}
      <SectionCard
        title="Unidades en rojo"
        subtitle="Unidades con flujo neto negativo en el periodo."
      >
        {unitConcerns.length === 0 ? (
          <EmptyState message="Ninguna unidad está en rojo. ¡Bien hecho!" />
        ) : (
          <Grid container spacing={2}>
            {unitConcerns.map((u, i) => (
              <Grid item xs={12} sm={6} md={4} key={`${u.unit}-${i}`}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: `${RED}0F`,
                    border: `1px solid ${RED}33`,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <WarningAmberRoundedIcon
                      sx={{ color: RED, fontSize: 18 }}
                    />
                    <Typography
                      sx={{ color: INK, fontWeight: 600, fontSize: 14 }}
                    >
                      {u.unit}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: RED, fontWeight: 700, fontSize: 18 }}>
                    {formatMoney(u.neto)}
                  </Typography>
                  <Typography sx={{ color: GRAY, fontSize: 12, mt: 0.5 }}>
                    Egresos: {formatMoney(u.egresos)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </SectionCard>
    </Stack>
  );
}
