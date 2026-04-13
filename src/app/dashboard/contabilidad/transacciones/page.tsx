'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid,
  Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material'
import { Receipt, Add, Delete, Edit } from '@mui/icons-material'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']

const CATEGORIES: Record<string, string> = {
  FLETE_MARITIMO: 'Flete Marítimo', FLETE_AEREO: 'Flete Aéreo',
  TRAMITES_ADUANEROS: 'Trámites Aduaneros', HONORARIOS_AGENTE: 'Honorarios Agente',
  SERVICIOS_PORTUARIOS: 'Servicios Portuarios', TRANSPORTE_LOCAL: 'Transporte Local',
  SEGURO_CARGA: 'Seguro de Carga', BANCARIOS: 'Bancarios',
  IMPUESTOS: 'Impuestos', ALMACENAJE: 'Almacenaje',
  OTROS_LOGISTICA: 'Otros Logística', INGRESOS_SERVICIO: 'Ingresos Servicio', OTROS: 'Otros',
}
const ACCOUNT_TYPES: Record<string, string> = {
  REVENUE: 'Ingresos', COGS: 'COGS', OPERATING_EXPENSE: 'Gasto Operativo',
  OTHER_INCOME: 'Otro Ingreso', OTHER_EXPENSE: 'Otro Gasto',
}
const ORIGINS: Record<string, string> = { CHINA: 'China', PANAMA: 'Panamá', COSTA_RICA: 'Costa Rica', USA: 'USA', OTHER: 'Otro' }

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })

const EMPTY_FORM = {
  type: 'EXPENSE', category: 'OTROS', accountType: 'OPERATING_EXPENSE',
  origin: 'PANAMA', description: '', amount: '', currency: 'USD',
  date: new Date().toISOString().slice(0, 10), reference: '',
}

export default function TransaccionesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')
  const [filterOrigin, setFilterOrigin] = useState('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) router.replace('/dashboard')
  }, [session, status])

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams()
    if (filterType !== 'ALL') p.set('type', filterType)
    if (filterOrigin !== 'ALL') p.set('origin', filterOrigin)
    fetch(`/api/contabilidad/transactions?${p}`)
      .then(r => r.json())
      .then(d => setTxs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterType, filterOrigin])

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setDialogOpen(true) }
  const openEdit = (tx: any) => {
    setEditing(tx)
    setForm({ type: tx.type, category: tx.category, accountType: tx.accountType, origin: tx.origin,
      description: tx.description, amount: String(tx.amount), currency: tx.currency,
      date: String(tx.date).slice(0, 10), reference: tx.reference || '' })
    setError(''); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) { setError('Descripción y monto requeridos'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/contabilidad/transactions/${editing.id}` : '/api/contabilidad/transactions'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const e = await res.json(); setError(e.error || 'Error'); return }
      setDialogOpen(false); load()
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar transacción?')) return
    await fetch(`/api/contabilidad/transactions/${id}`, { method: 'DELETE' })
    setTxs(prev => prev.filter(t => t.id !== id))
  }

  const totalIncome = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const set = (field: string) => (e: any) => setForm(p => ({ ...p, [field]: e.target.value }))

  if (status === 'loading' || !session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Receipt sx={{ color: '#FACC15', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Libro de Transacciones</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>Ingresos y gastos generales del negocio</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
          Nueva Transacción
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#F0FDF4' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#16A34A' }}>{fmt(totalIncome)}</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Ingresos (filtro actual)</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#FEF2F2' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626' }}>{fmt(totalExpense)}</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Gastos (filtro actual)</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#EFF6FF' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: totalIncome - totalExpense >= 0 ? '#16A34A' : '#DC2626' }}>
              {fmt(totalIncome - totalExpense)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Resultado Neto</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} label="Tipo" onChange={e => setFilterType(e.target.value)}>
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="INCOME">Ingresos</MenuItem>
            <MenuItem value="EXPENSE">Gastos</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>País</InputLabel>
          <Select value={filterOrigin} label="País" onChange={e => setFilterOrigin(e.target.value)}>
            <MenuItem value="ALL">Todos</MenuItem>
            {Object.entries(ORIGINS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : txs.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: '#6B7280' }}>No hay transacciones</Typography>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Tipo Cuenta', 'País', 'Monto', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {txs.map(tx => (
                <TableRow key={tx.id} sx={{ '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.06)' } }}>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</TableCell>
                  <TableCell>
                    <Chip label={tx.type === 'INCOME' ? 'Ingreso' : 'Gasto'} size="small"
                      sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: tx.type === 'INCOME' ? '#F0FDF4' : '#FEF2F2', color: tx.type === 'INCOME' ? '#16A34A' : '#DC2626' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{tx.description}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280' }}>{CATEGORIES[tx.category] || tx.category}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280' }}>{ACCOUNT_TYPES[tx.accountType] || tx.accountType}</TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280' }}>{ORIGINS[tx.origin] || tx.origin}</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: tx.type === 'INCOME' ? '#16A34A' : '#DC2626' }}>
                    {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(tx)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      <Tooltip title="Eliminar"><IconButton size="small" sx={{ color: '#DC2626' }} onClick={() => handleDelete(tx.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select value={form.type} label="Tipo" onChange={set('type')}>
                  <MenuItem value="INCOME">Ingreso</MenuItem>
                  <MenuItem value="EXPENSE">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField type="date" label="Fecha" value={form.date} onChange={set('date')} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descripción *" value={form.description} onChange={set('description')} fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Monto *" type="number" value={form.amount} onChange={set('amount')} fullWidth size="small" />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>País</InputLabel>
                <Select value={form.origin} label="País" onChange={set('origin')}>
                  {Object.entries(ORIGINS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select value={form.category} label="Categoría" onChange={set('category')}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select value={form.accountType} label="Tipo de Cuenta" onChange={set('accountType')}>
                  {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Referencia (opcional)" value={form.reference} onChange={set('reference')} fullWidth size="small" placeholder="# factura, # cheque..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
