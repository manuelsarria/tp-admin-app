'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Alert, CircularProgress,
} from '@mui/material'
import { DEFAULT_UNITS } from '@/lib/finance'
import type { Operation, OperationStatus } from './OperacionesTab'
import { OPERATION_STATUS_LABEL } from './OperacionesTab'

interface FormState {
  name: string
  containerNumber: string
  unit: string
  status: OperationStatus
  eta: string
  startDate: string
  notes: string
}

const emptyForm = (): FormState => ({
  name: '',
  containerNumber: '',
  unit: 'Contenedores Valdai',
  status: 'ABIERTA',
  eta: '',
  startDate: '',
  notes: '',
})

const dateInput = (v?: string | null): string => {
  if (!v) return ''
  const s = String(v)
  return s.length >= 10 ? s.slice(0, 10) : ''
}

export default function OperacionFormDialog({
  open, onClose, onSaved, operation,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  operation?: Operation | null
}) {
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    let alive = true
    fetch('/api/finanzas/catalog')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive) return
        const list = data?.values?.unit
        if (Array.isArray(list) && list.length) setUnits(list)
      })
      .catch(() => {})

    if (operation) {
      setForm({
        name: operation.name || '',
        containerNumber: operation.containerNumber || '',
        unit: operation.unit || '',
        status: (operation.status || 'ABIERTA') as OperationStatus,
        eta: dateInput(operation.eta),
        startDate: dateInput(operation.startDate),
        notes: operation.notes || '',
      })
    } else {
      setForm(emptyForm())
    }
    return () => { alive = false }
  }, [open, operation])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null)
    if (!form.name.trim()) return setError('Indica un nombre para la operación')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        containerNumber: form.containerNumber.trim() || null,
        unit: form.unit || null,
        status: form.status,
        eta: form.eta || null,
        startDate: form.startDate || null,
        notes: form.notes.trim() || null,
      }
      const url = operation?.id ? `/api/finanzas/operations/${operation.id}` : '/api/finanzas/operations'
      const res = await fetch(url, {
        method: operation?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'No se pudo guardar la operación')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
        {operation?.id ? 'Editar operación' : 'Nueva operación'}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Nombre" fullWidth size="small" autoFocus
              placeholder="Contenedor 9507100400 — Colchones"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Nº de contenedor" fullWidth size="small"
              value={form.containerNumber} onChange={e => set('containerNumber', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Unidad" fullWidth size="small"
              value={form.unit} onChange={e => set('unit', e.target.value)}>
              <MenuItem value="">—</MenuItem>
              {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Estado" fullWidth size="small"
              value={form.status} onChange={e => set('status', e.target.value)}>
              {(Object.keys(OPERATION_STATUS_LABEL) as OperationStatus[]).map(s => (
                <MenuItem key={s} value={s}>{OPERATION_STATUS_LABEL[s]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Inicio" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="ETA" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.eta} onChange={e => set('eta', e.target.value)} />
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
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}
        >
          {operation?.id ? 'Guardar cambios' : 'Crear operación'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
