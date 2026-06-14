'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const INK = '#0A0A0A';
const GRAY = '#78716C';
const RED = '#EF4444';
const ACCENT = '#FACC15';

const CARD_SX = {
  borderRadius: '16px',
  border: '1px solid rgba(10,10,10,0.06)',
  background: '#FFFFFF',
} as const;

const HEADER_FONT = {
  fontFamily: 'Poppins, sans-serif',
} as const;

type Kind = 'unit' | 'category' | 'method';

type CatalogItem = { id: string; value: string };

type CatalogResponse = {
  values: { unit: string[]; category: string[]; method: string[] };
  items: { unit: CatalogItem[]; category: CatalogItem[]; method: CatalogItem[] };
};

const SECTIONS: { kind: Kind; title: string }[] = [
  { kind: 'unit', title: 'Unidades' },
  { kind: 'category', title: 'Categorías' },
  { kind: 'method', title: 'Métodos' },
];

export default function CatalogosTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CatalogResponse | null>(null);

  const [inputs, setInputs] = useState<Record<Kind, string>>({
    unit: '',
    category: '',
    method: '',
  });
  const [busy, setBusy] = useState<Kind | null>(null);
  const [sectionError, setSectionError] = useState<Record<Kind, string | null>>({
    unit: null,
    category: null,
    method: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/finanzas/catalog');
      if (!res.ok) throw new Error('No se pudo cargar el catálogo');
      const json: CatalogResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (kind: Kind) => {
    const value = inputs[kind].trim();
    if (!value) return;
    setBusy(kind);
    setSectionError((s) => ({ ...s, [kind]: null }));
    try {
      const res = await fetch('/api/finanzas/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, value }),
      });
      if (res.status === 409) {
        setSectionError((s) => ({ ...s, [kind]: 'Ya existe' }));
        return;
      }
      if (!res.ok) throw new Error('No se pudo agregar');
      setInputs((s) => ({ ...s, [kind]: '' }));
      await load();
    } catch (e) {
      setSectionError((s) => ({
        ...s,
        [kind]: e instanceof Error ? e.message : 'Error al agregar',
      }));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (kind: Kind, id: string) => {
    setBusy(kind);
    setSectionError((s) => ({ ...s, [kind]: null }));
    try {
      const res = await fetch(`/api/finanzas/catalog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo borrar');
      await load();
    } catch (e) {
      setSectionError((s) => ({
        ...s,
        [kind]: e instanceof Error ? e.message : 'Error al borrar',
      }));
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: ACCENT }} />
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

  if (!data) return null;

  return (
    <Grid container spacing={3}>
      {SECTIONS.map(({ kind, title }) => {
        const items = data.items?.[kind] ?? [];
        const defaults = data.values?.[kind] ?? [];
        const hasItems = items.length > 0;
        return (
          <Grid item xs={12} md={4} key={kind}>
            <Paper sx={{ ...CARD_SX, p: 3, height: '100%' }}>
              <Typography
                variant="h6"
                sx={{ ...HEADER_FONT, fontWeight: 600, color: INK, mb: 2 }}
              >
                {title}
              </Typography>

              {hasItems ? (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '10px',
                        border: '1px solid rgba(10,10,10,0.06)',
                      }}
                    >
                      <Typography sx={{ color: INK }}>{item.value}</Typography>
                      <IconButton
                        size="small"
                        aria-label={`Borrar ${item.value}`}
                        disabled={busy === kind}
                        onClick={() => handleDelete(kind, item.id)}
                        sx={{ color: RED }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                    {defaults.map((v) => (
                      <Chip
                        key={v}
                        label={v}
                        size="small"
                        sx={{
                          color: GRAY,
                          background: 'rgba(10,10,10,0.04)',
                          fontWeight: 400,
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: GRAY, fontStyle: 'italic' }}>
                    valores por defecto (agrega uno para personalizar)
                  </Typography>
                </Box>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={`Nuevo valor`}
                  value={inputs[kind]}
                  onChange={(e) =>
                    setInputs((s) => ({ ...s, [kind]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd(kind);
                    }
                  }}
                  disabled={busy === kind}
                />
                <Button
                  variant="contained"
                  onClick={() => handleAdd(kind)}
                  disabled={busy === kind || !inputs[kind].trim()}
                  sx={{
                    whiteSpace: 'nowrap',
                    background: ACCENT,
                    color: INK,
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': { background: '#EAB308', boxShadow: 'none' },
                  }}
                >
                  Agregar
                </Button>
              </Stack>

              {sectionError[kind] && (
                <Typography variant="caption" sx={{ color: RED, mt: 1, display: 'block' }}>
                  {sectionError[kind]}
                </Typography>
              )}
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
