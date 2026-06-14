'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';
import { formatMoney } from '@/lib/finance';

const INK = '#0A0A0A';
const GRAY = '#78716C';
const GREEN = '#10B981';
const RED = '#EF4444';

const CARD_SX = {
  borderRadius: '16px',
  border: '1px solid rgba(10,10,10,0.06)',
  background: '#FFFFFF',
} as const;

const HEADER_FONT = {
  fontFamily: 'Poppins, sans-serif',
} as const;

type UnitRow = {
  unit: string;
  ingresos: number;
  egresos: number;
  neto: number;
  pctIngresos: number;
  pctEgresos: number;
};

type SummaryResponse = {
  byUnit: UnitRow[];
};

function pct(n: number): string {
  return `${(((n || 0) * 100)).toFixed(1)}%`;
}

export default function PorUnidadTab({ year }: { year: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UnitRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/finanzas/summary?year=${year}`);
        if (!res.ok) throw new Error('No se pudo cargar el resumen por unidad');
        const data: SummaryResponse = await res.json();
        if (!cancelled) setRows(Array.isArray(data.byUnit) ? data.byUnit : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error inesperado');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const totals = rows.reduce(
    (acc, r) => {
      acc.ingresos += r.ingresos || 0;
      acc.egresos += r.egresos || 0;
      acc.neto += r.neto || 0;
      acc.pctIngresos += r.pctIngresos || 0;
      acc.pctEgresos += r.pctEgresos || 0;
      return acc;
    },
    { ingresos: 0, egresos: 0, neto: 0, pctIngresos: 0, pctEgresos: 0 },
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#FACC15' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: RED }}>{error}</Typography>
      </Paper>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: GRAY }}>No hay datos por unidad para {year}.</Typography>
      </Paper>
    );
  }

  const headCellSx = {
    ...HEADER_FONT,
    fontWeight: 600,
    color: INK,
    borderBottom: '1px solid rgba(10,10,10,0.06)',
  } as const;

  return (
    <Paper sx={{ ...CARD_SX, overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="h6" sx={{ ...HEADER_FONT, fontWeight: 600, color: INK }}>
          Por unidad de negocio {year}
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Unidad</TableCell>
              <TableCell align="right" sx={headCellSx}>Ingresos</TableCell>
              <TableCell align="right" sx={headCellSx}>Egresos</TableCell>
              <TableCell align="right" sx={headCellSx}>Neto</TableCell>
              <TableCell align="right" sx={headCellSx}>% Ingresos</TableCell>
              <TableCell sx={{ ...headCellSx, minWidth: 180 }}>% Egresos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const negative = (r.neto || 0) < 0;
              const egresosPctValue = Math.min(Math.max((r.pctEgresos || 0) * 100, 0), 100);
              return (
                <TableRow
                  key={r.unit}
                  hover
                  sx={negative ? { background: 'rgba(239,68,68,0.08)' } : undefined}
                >
                  <TableCell sx={{ color: INK, fontWeight: 500 }}>{r.unit}</TableCell>
                  <TableCell align="right" sx={{ color: GREEN, fontWeight: 500 }}>
                    {formatMoney(r.ingresos)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: RED, fontWeight: 500 }}>
                    {formatMoney(r.egresos)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: negative ? RED : GREEN, fontWeight: 600 }}
                  >
                    {formatMoney(r.neto)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: INK }}>
                    {pct(r.pctIngresos)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={egresosPctValue}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(10,10,10,0.06)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: RED,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: GRAY, minWidth: 44, textAlign: 'right' }}
                      >
                        {pct(r.pctEgresos)}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ background: 'rgba(250,204,21,0.08)' }}>
              <TableCell sx={{ ...HEADER_FONT, fontWeight: 700, color: INK }}>TOTALES</TableCell>
              <TableCell align="right" sx={{ color: GREEN, fontWeight: 700 }}>
                {formatMoney(totals.ingresos)}
              </TableCell>
              <TableCell align="right" sx={{ color: RED, fontWeight: 700 }}>
                {formatMoney(totals.egresos)}
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: totals.neto >= 0 ? GREEN : RED, fontWeight: 700 }}
              >
                {formatMoney(totals.neto)}
              </TableCell>
              <TableCell align="right" sx={{ color: INK, fontWeight: 700 }}>
                {pct(totals.pctIngresos)}
              </TableCell>
              <TableCell sx={{ color: INK, fontWeight: 700 }}>
                {pct(totals.pctEgresos)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
