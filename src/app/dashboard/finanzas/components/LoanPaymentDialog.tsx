'use client'

import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Alert, CircularProgress, Typography, Box,
} from '@mui/material'
import { DEFAULT_METHODS, DEFAULT_UNITS, formatMoney } from '@/lib/finance'
import type { CatalogValues, Loan, LoanPayment, LoanPaymentKind } from './types'
import { LOAN_PAYMENT_KIND_LABEL } from './types'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface FormState {
  date: string
  amount: string
  kind: LoanPaymentKind
  sourceUnit: string
  method: string
  reference: string
  notes: string
}

export default function LoanPaymentDialog({
  open, onClose, onSaved, loan, payment,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  loan: Loan | null
  payment?: LoanPayment | null
}) {
  const [methods, setMethods] = useState<string[]>(DEFAULT_METHODS)
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS)
  const [form, setForm] = useState<FormState>({
    date: todayISO(), amount: '', kind: 'CUOTA', sourceUnit: '', method: '', reference: '', notes: '',
  })
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
        const values: CatalogValues | undefined = data?.values
        if (values?.method?.length) setMethods(values.method)
        if (values?.unit?.length) setUnits(values.unit)
      })
      .catch(() => {})
    if (payment) {
      setForm({
        date: payment.date ? payment.date.slice(0, 10) : todayISO(),
        amount: String(payment.amount ?? ''),
        kind: payment.kind,
        sourceUnit: payment.sourceUnit || '',
        method: payment.method || '',
        reference: payment.reference || '',
        notes: payment.notes || '',
      })
    } else {
      setForm({
        date: todayISO(),
        amount: loan?.installmentAmount != null ? String(loan.installmentAmount) : '',
        kind: 'CUOTA',
        sourceUnit: loan?.unit || '',
        method: '',
        reference: '',
        notes: '',
      })
    }
    return () => { alive = false }
  }, [open, payment, loan])

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setError(null)
    if (!loan) return
    const amt = parseFloat(form.amount)
    if (!Number.isFinite(amt) || amt <= 0) return setError('El monto debe ser mayor a 0')

    setSaving(true)
    try {
      const payload = {
        date: form.date,
        amount: amt,
        kind: form.kind,
        sourceUnit: form.sourceUnit || null,
        method: form.method || null,
        reference: form.reference || null,
        notes: form.notes || null,
      }
      const url = payment?.id
        ? `/api/finanzas/loans/${loan.id}/payments/${payment.id}`
        : `/api/finanzas/loans/${loan.id}/payments`
      const res = await fetch(url, {
        method: payment?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudo guardar el pago')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const amt = parseFloat(form.amount)
  const newBalance = loan && Number.isFinite(amt)
    ? loan.balance - (payment ? amt - payment.amount : amt)
    : loan?.balance ?? 0

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', pb: 0.5 }}>
        {payment?.id ? 'Editar pago' : 'Registrar pago'}
      </DialogTitle>
      {loan && (
        <Typography variant="caption" sx={{ px: 3, pb: 1.5, color: '#78716C' }}>
          {loan.name}{loan.counterparty ? ` · ${loan.counterparty}` : ''} · Saldo actual {formatMoney(loan.balance)}
        </Typography>
      )}
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Este pago también registrará un <strong>egreso</strong> en el Registro Diario, a nombre del
          fondo <strong>{form.sourceUnit || loan?.unit || 'Salario Personal'}</strong>
          {loan?.category ? ` (categoría ${loan.category})` : ''}.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Fecha" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={form.date} onChange={e => set('date', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Monto (USD)" type="number" fullWidth size="small" autoFocus
              value={form.amount} onChange={e => set('amount', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              inputProps={{ min: 0, step: '0.01' }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Tipo de pago" fullWidth size="small"
              value={form.kind} onChange={e => set('kind', e.target.value)}>
              {(Object.keys(LOAN_PAYMENT_KIND_LABEL) as LoanPaymentKind[]).map(k => (
                <MenuItem key={k} value={k}>{LOAN_PAYMENT_KIND_LABEL[k]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Método" fullWidth size="small"
              value={form.method} onChange={e => set('method', e.target.value)}>
              <MenuItem value="">—</MenuItem>
              {methods.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField select label="Fondo (de dónde sale el dinero)" fullWidth size="small"
              value={form.sourceUnit} onChange={e => set('sourceUnit', e.target.value)}
              helperText="Es la unidad con la que se registra el egreso en el Registro Diario.">
              {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Referencia" fullWidth size="small"
              value={form.reference} onChange={e => set('reference', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Observaciones" fullWidth size="small" multiline minRows={2}
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </Grid>
        </Grid>

        {loan && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#FAFAF9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#78716C' }}>Saldo después de este pago</Typography>
            <Typography sx={{ fontWeight: 800, fontFamily: '"Poppins", sans-serif' }}>
              {formatMoney(Math.max(newBalance, 0))}
            </Typography>
          </Box>
        )}
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
          {payment?.id ? 'Guardar cambios' : 'Registrar pago'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
