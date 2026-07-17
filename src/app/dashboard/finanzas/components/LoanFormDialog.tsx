'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Autocomplete, Alert, CircularProgress, Typography,
} from '@mui/material'
import { DEFAULT_UNITS, DEFAULT_CATEGORIES } from '@/lib/finance'
import type {
  CatalogValues, Loan, LoanKind, LoanStatus,
} from './types'
import { LOAN_KIND_LABEL, LOAN_STATUS_LABEL } from './types'

interface FormState {
  name: string
  kind: LoanKind
  status: LoanStatus
  counterparty: string
  reference: string
  principal: string
  interest: string
  totalAmount: string
  downPayment: string
  installmentAmount: string
  installmentsTotal: string
  interestRate: string
  startDate: string
  firstPaymentDate: string
  dueDate: string
  unit: string
  category: string
  notes: string
}

const emptyForm = (): FormState => ({
  name: '',
  kind: 'PERSONAL',
  status: 'ACTIVO',
  counterparty: '',
  reference: '',
  principal: '',
  interest: '',
  totalAmount: '',
  downPayment: '',
  installmentAmount: '',
  installmentsTotal: '',
  interestRate: '',
  startDate: '',
  firstPaymentDate: '',
  dueDate: '',
  unit: '',
  category: '',
  notes: '',
})

const num = (v: string): number | null => {
  if (v.trim() === '') return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

const int = (v: string): number | null => {
  if (v.trim() === '') return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

export default function LoanFormDialog({
  open, onClose, onSaved, loan,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  loan?: Loan | null
}) {
  const [catalog, setCatalog] = useState<CatalogValues>({
    unit: DEFAULT_UNITS, category: DEFAULT_CATEGORIES, method: [],
  })
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
        const values: CatalogValues = data?.values || { unit: DEFAULT_UNITS, category: DEFAULT_CATEGORIES, method: [] }
        setCatalog(values)
      })
      .catch(() => {})
    if (loan) {
      setForm({
        name: loan.name,
        kind: loan.kind,
        status: loan.status,
        counterparty: loan.counterparty || '',
        reference: loan.reference || '',
        principal: String(loan.principal ?? ''),
        interest: String(loan.interest ?? ''),
        totalAmount: String(loan.totalAmount ?? ''),
        downPayment: String(loan.downPayment ?? ''),
        installmentAmount: loan.installmentAmount != null ? String(loan.installmentAmount) : '',
        installmentsTotal: loan.installmentsTotal != null ? String(loan.installmentsTotal) : '',
        interestRate: loan.interestRate != null ? String(loan.interestRate) : '',
        startDate: loan.startDate ? loan.startDate.slice(0, 10) : '',
        firstPaymentDate: loan.firstPaymentDate ? loan.firstPaymentDate.slice(0, 10) : '',
        dueDate: loan.dueDate ? loan.dueDate.slice(0, 10) : '',
        unit: loan.unit || '',
        category: loan.category || '',
        notes: loan.notes || '',
      })
    } else {
      setForm(emptyForm())
    }
    return () => { alive = false }
  }, [open, loan])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null)
    if (!form.name.trim()) return setError('Indica un nombre para el préstamo')
    const principal = num(form.principal)
    const total = num(form.totalAmount)
    if (principal == null || principal <= 0) return setError('El capital debe ser mayor a 0')
    if (total == null || total <= 0) return setError('El total a pagar debe ser mayor a 0')

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        kind: form.kind,
        status: form.status,
        counterparty: form.counterparty || null,
        reference: form.reference || null,
        principal,
        interest: num(form.interest) ?? 0,
        totalAmount: total,
        downPayment: num(form.downPayment) ?? 0,
        installmentAmount: num(form.installmentAmount),
        installmentsTotal: int(form.installmentsTotal),
        interestRate: num(form.interestRate),
        startDate: form.startDate || null,
        firstPaymentDate: form.firstPaymentDate || null,
        dueDate: form.dueDate || null,
        unit: form.unit || null,
        category: form.category.trim() || null,
        notes: form.notes || null,
      }
      const url = loan?.id ? `/api/finanzas/loans/${loan.id}` : '/api/finanzas/loans'
      const res = await fetch(url, {
        method: loan?.id ? 'PATCH' : 'POST',
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
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
        {loan?.id ? 'Editar préstamo' : 'Nuevo préstamo'}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre" fullWidth size="small" autoFocus
              value={form.name} onChange={e => set('name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select label="Tipo" fullWidth size="small"
              value={form.kind} onChange={e => set('kind', e.target.value)}>
              {(Object.keys(LOAN_KIND_LABEL) as LoanKind[]).map(k => (
                <MenuItem key={k} value={k}>{LOAN_KIND_LABEL[k]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select label="Estado" fullWidth size="small"
              value={form.status} onChange={e => set('status', e.target.value)}>
              {(Object.keys(LOAN_STATUS_LABEL) as LoanStatus[]).map(s => (
                <MenuItem key={s} value={s}>{LOAN_STATUS_LABEL[s]}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Acreedor / Contraparte" fullWidth size="small"
              value={form.counterparty} onChange={e => set('counterparty', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Referencia / Contrato" fullWidth size="small"
              value={form.reference} onChange={e => set('reference', e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#78716C', letterSpacing: 0.4 }}>
              PLAN DE PAGO
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Capital (USD)" type="number" fullWidth size="small"
              value={form.principal} onChange={e => set('principal', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Interés y cargos (USD)" type="number" fullWidth size="small"
              value={form.interest} onChange={e => set('interest', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Total a pagar (USD)" type="number" fullWidth size="small"
              value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Abono inicial (USD)" type="number" fullWidth size="small"
              value={form.downPayment} onChange={e => set('downPayment', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField label="Cuota (USD)" type="number" fullWidth size="small"
              value={form.installmentAmount} onChange={e => set('installmentAmount', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Nº de cuotas" type="number" fullWidth size="small"
              value={form.installmentsTotal} onChange={e => set('installmentsTotal', e.target.value)}
              inputProps={{ min: 0, step: 1 }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Tasa de interés (%)" type="number" fullWidth size="small"
              value={form.interestRate} onChange={e => set('interestRate', e.target.value)}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField label="Inicio" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Primera cuota" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.firstPaymentDate} onChange={e => set('firstPaymentDate', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Vencimiento" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }}
              value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#78716C', letterSpacing: 0.4 }}>
              DEFECTOS PARA EL EGRESO EN EL REGISTRO DIARIO
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Unidad" fullWidth size="small"
              value={form.unit} onChange={e => set('unit', e.target.value)}>
              <MenuItem value="">—</MenuItem>
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
          {loan?.id ? 'Guardar cambios' : 'Crear préstamo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
