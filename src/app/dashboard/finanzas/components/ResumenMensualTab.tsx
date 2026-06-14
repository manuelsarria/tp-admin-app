'use client';

import { useEffect, useState } from 'react';
import {
  Box,
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

type MonthlyRow = {
  key: string;
  label: string;
  ingresos: number;
  egresos: number;
  neto: number;
};

type SummaryResponse = {
  monthly: MonthlyRow[];
};

export default function ResumenMensualTab({ year }: { year: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/finanzas/summary?year=${year}`);
        if (!res.ok) throw new Error('No se pudo cargar el resumen');
        const data: SummaryResponse = await res.json();
        if (!cancelled) setMonthly(Array.isArray(data.monthly) ? data.monthly : []);
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

  const totals = monthly.reduce(
    (acc, m) => {
      acc.ingresos += m.ingresos || 0;
      acc.egresos += m.egresos || 0;
      acc.neto += m.neto || 0;
      return acc;
    },
    { ingresos: 0, egresos: 0, neto: 0 },
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

  if (monthly.length === 0) {
    return (
      <Paper sx={{ ...CARD_SX, p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: GRAY }}>
          No hay datos para {year}.
        </Typography>
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
          Resumen mensual {year}
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Mes</TableCell>
              <TableCell align="right" sx={headCellSx}>Ingresos</TableCell>
              <TableCell align="right" sx={headCellSx}>Egresos</TableCell>
              <TableCell align="right" sx={headCellSx}>Neto / Utilidad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monthly.map((m) => (
              <TableRow key={m.key} hover>
                <TableCell sx={{ color: INK }}>{m.label}</TableCell>
                <TableCell align="right" sx={{ color: GREEN, fontWeight: 500 }}>
                  {formatMoney(m.ingresos)}
                </TableCell>
                <TableCell align="right" sx={{ color: RED, fontWeight: 500 }}>
                  {formatMoney(m.egresos)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color: m.neto >= 0 ? GREEN : RED, fontWeight: 600 }}
                >
                  {formatMoney(m.neto)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ background: 'rgba(250,204,21,0.08)' }}>
              <TableCell sx={{ ...HEADER_FONT, fontWeight: 700, color: INK }}>
                TOTALES
              </TableCell>
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
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
