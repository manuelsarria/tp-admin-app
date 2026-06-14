'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Autocomplete, Alert, Box, ToggleButton, ToggleButtonGroup, CircularProgress,
} from '@mui/material'
import { STATUSES, STATUS_LABEL, DEFAULT_UNITS, DEFAULT_CATEGORIES, DEFAULT_METHODS } from '@/lib/finance'
import type { Entry, CatalogValues } from './types'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface FormState {
  date: string
  unit: string
  type: 'INGRESO' | 'EGRESO'
  category: string
  subcategory: string
  method: string
  status: 'PAGADO' | 'PENDIENTE' | 'PARCIAL' | 'ANULADO'
  counterparty: string
  reference: string
  description: string
  amount: string
  notes: string
}

const emptyForm = (catalog: CatalogValues): FormState => ({
  date: todayISO(),
  unit: catalog.unit[0] || DEFAULT_UNITS[0],
  type: 'EGRESO',
  category: '',
  subcategory: '',
  method: '',
  status: 'PAGADO',
  counterparty: '',
  reference: '',
  description: '',
  amount: '',
  notes: '',
})

export default function EntryFormDialog({
  open, onClose, onSaved, entry,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  entry?: Entry | null
}) {
  const [catalog, setCatalog] = useState<CatalogValues>({
    unit: DEFAULT_UNITS, category: DEFAULT_CATEGORIES, method: DEFAULT_METHODS,
  })
  const [form, setForm] = useState<FormState>(emptyForm(catalog))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  // Load catalog + seed the form whenever the dialog opens.
  useEffect(() => {
    if (!open) return
    setError(null)
    let alive = true
    fetch('/api/finanzas/catalog')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive) return
        const values: CatalogValues = data?.values || { unit: DEFAULT_UNITS, category: DEFAULT_CATEGORIES, method: DEFAULT_METHODS }
        setCatalog(values)
        if (entry) {
          setForm({
            date: entry.date ? entry.date.slice(0, 10) : todayISO(),
            unit: entry.unit,
            type: entry.type,
            category: entry.category,
            subcategory: entry.subcategory || '',
            method: entry.method || '',
            status: entry.status,
            counterparty: entry.counterparty || '',
            reference: entry.reference || '',
            description: entry.description || '',
            amount: String(entry.amount ?? ''),
            notes: entry.notes || '',
          })
        } else {
          setForm(emptyForm(values))
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [open, entry])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null)
    const amt = parseFloat(form.amount)
    if (!form.unit) return setError('Selecciona una unidad')
    if (!form.category.trim()) return setError('Indica una categoría')
    if (!Number.isFinite(amt) || amt <= 0) return setError('El monto debe ser mayor a 0')

    setSaving(true)
    try {
      const payload = {
        date: form.date,
        unit: form.unit,
        type: form.type,
        category: form.category.trim(),
        subcategory: form.subcategory || null,
        method: form.method || null,
        status: form.status,
        counterparty: form.counterparty || null,
        reference: form.reference || null,
        description: form.description || null,
        amount: amt,
        notes: form.notes || null,
      }
      const url = entry?.id ? `/api/finanzas/entries/${entry.id}` : '/api/finanzas/entries'
      const res = await fetch(url, {
        method: entry?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudo guardar')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
        {entry?.id ? 'Editar movimiento' : 'Registrar movimiento'}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={form.type}
            exclusive
            fullWidth
            onChange={(_e, v) => v && set('type', v)}
            size="small"
          >
            <ToggleButton value="INGRESO" sx={{ fontWeight: 700, '&.Mui-selected': { bgcolor: '#ECFDF5', color: '#047857' } }}>
              Ingreso
            </ToggleButton>
            <ToggleButton value="EGRESO" sx={{ fontWeight: 700, '&.Mui-selected': { bgcolor: '#FEF2F2', color: '#B91C1C' } }}>
              Egreso
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Fecha" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={form.date} onChange={e => set('date', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              inputRef={amountRef}
              label="Monto (USD)" type="number" fullWidth size="small" autoFocus
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Unidad" fullWidth size="small"
              value={form.unit} onChange={e => set('unit', e.target.value)}>
              {catalog.unit.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={catalog.category}
              value={form.category}
              onInputChange={(_e, v) => set('category', v || '')}
              renderInput={p => <TextField {...p} label="Categoría" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Método" fullWidth size="small"
              value={form.method} onChange={e => set('method', e.target.value)}>
              <MenuItem value="">—</MenuItem>
              {catalog.method.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Estado" fullWidth size="small"
              value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_LABEL[s]}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Cliente / Proveedor" fullWidth size="small"
              value={form.counterparty} onChange={e => set('counterparty', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Referencia / Contenedor" fullWidth size="small"
              value={form.reference} onChange={e => set('reference', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" fullWidth size="small"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Observaciones" fullWidth size="small" multiline minRows={2}
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', '&:hover': { bgcolor: '#262626' } }}
        >
          {entry?.id ? 'Guardar cambios' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
