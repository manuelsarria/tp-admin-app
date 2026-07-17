'use client'

// Diálogo para resolver los movimientos "pendientes de clasificar" de una
// sentada: una fila por movimiento, Negocio/Personal a un clic, y un solo
// Guardar que manda todo junto.

import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import { formatMoney } from '@/lib/finance'
import type { Entry, LedgerScope } from './types'

const INK = '#0A0A0A'
const GRAY = '#78716C'
const RED = '#B91C1C'
const YELLOW = '#FACC15'
const GREEN = '#047857'

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function ClasificarDialog({
  open,
  year,
  onClose,
  onSaved,
}: {
  open: boolean
  /** Si viene, solo se clasifican los pendientes de ese año. */
  year?: number
  onClose: () => void
  onSaved?: () => void
}) {
  const [rows, setRows] = useState<Entry[]>([])
  const [choices, setChoices] = useState<Record<string, LedgerScope>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const qs = year !== undefined ? `?year=${year}` : ''
    fetch(`/api/finanzas/entries/pending${qs}`)
      .then(async r => {
        if (!r.ok) throw new Error('No se pudieron cargar los movimientos pendientes')
        return r.json()
      })
      .then((d: { data?: Entry[] }) => {
        const data = d.data || []
        setRows(data)
        setChoices(Object.fromEntries(data.map(e => [e.id, e.scope])))
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error inesperado'))
      .finally(() => setLoading(false))
  }, [year])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const setAll = (scope: LedgerScope) =>
    setChoices(Object.fromEntries(rows.map(e => [e.id, scope])))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const items = rows.map(e => ({ id: e.id, scope: choices[e.id] ?? e.scope }))
      const res = await fetch('/api/finanzas/entries/pending', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        throw new Error(d?.error || 'No se pudo guardar la clasificación')
      }
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: INK, pb: 1 }}>
        Clasificar movimientos
        <Typography variant="body2" sx={{ color: GRAY, fontWeight: 400, mt: 0.25 }}>
          Ahora mismo todos cuentan como Negocio. Marca cuáles son personales para que los totales cuadren.
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: '60vh', p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: YELLOW }} />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: GRAY }}>
              No queda nada por clasificar.
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
                px: 2, py: 1.5, position: 'sticky', top: 0, zIndex: 1,
                bgcolor: '#FAFAF9', borderBottom: '1px solid rgba(10,10,10,0.06)',
              }}
            >
              <Typography variant="caption" sx={{ color: GRAY, fontWeight: 600, mr: 0.5 }}>
                {rows.length} movimiento{rows.length === 1 ? '' : 's'}
              </Typography>
              <Button
                size="small" variant="outlined" onClick={() => setAll('NEGOCIO')} disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600, color: INK, borderColor: 'rgba(10,10,10,0.2)' }}
              >
                Marcar todos como Negocio
              </Button>
              <Button
                size="small" variant="outlined" onClick={() => setAll('PERSONAL')} disabled={saving}
                sx={{ textTransform: 'none', fontWeight: 600, color: INK, borderColor: 'rgba(10,10,10,0.2)' }}
              >
                Marcar todos como Personal
              </Button>
            </Box>

            {rows.map((e, i) => (
              <Box key={e.id}>
                {i > 0 && <Divider />}
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 2, px: 2, py: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' },
                    '&:hover': { bgcolor: 'rgba(10,10,10,0.02)' },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }} noWrap>
                      {e.description || e.category}
                    </Typography>
                    <Typography variant="caption" sx={{ color: GRAY }} noWrap component="div">
                      {formatDate(e.date)} · {e.unit} · {e.category}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 700, fontSize: 14, flexShrink: 0,
                      color: e.type === 'INGRESO' ? GREEN : RED,
                    }}
                  >
                    {e.type === 'INGRESO' ? '+' : '−'}{formatMoney(Math.abs(e.amount))}
                  </Typography>

                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    disabled={saving}
                    value={choices[e.id] ?? e.scope}
                    onChange={(_ev, v: LedgerScope | null) => {
                      if (v) setChoices(c => ({ ...c, [e.id]: v }))
                    }}
                    sx={{
                      flexShrink: 0,
                      '& .MuiToggleButton-root': {
                        textTransform: 'none', fontWeight: 600, color: INK, py: 0.35, px: 1.5,
                        borderColor: 'rgba(10,10,10,0.12)',
                      },
                      '& .MuiToggleButton-root.Mui-selected': {
                        bgcolor: YELLOW, color: INK, '&:hover': { bgcolor: '#FDE047' },
                      },
                    }}
                  >
                    <ToggleButton value="NEGOCIO">Negocio</ToggleButton>
                    <ToggleButton value="PERSONAL">Personal</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
            ))}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, bgcolor: '#FFFFFF' }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, color: GRAY }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || rows.length === 0}
          startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : undefined}
          sx={{
            textTransform: 'none', fontWeight: 700,
            bgcolor: INK, color: '#fff', '&:hover': { bgcolor: '#262626' },
          }}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
