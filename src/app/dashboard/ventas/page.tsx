'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Card, CardContent, Grid, Button, IconButton,
  Chip, Select, MenuItem, FormControl, InputLabel, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, LinearProgress,
  Menu, Switch, Snackbar,
} from '@mui/material'
import {
  TrendingUp, Plus, Trash2, DollarSign, Clock, CheckCircle2,
  Settings, Wallet, X, Pencil,
} from 'lucide-react'

// ---- TP light theme tokens ----
const C = {
  pageBg: '#FAFAF9',
  cardBg: '#FFFFFF',
  border: '#E7E5E4',
  text: '#0A0A0A',
  textSec: '#57534E',
  textMut: '#A8A29E',
  hover: '#F5F5F4',
  yellow: '#FACC15',
  yellowHover: '#EAB308',
  yellowBg: '#FEF3C7',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  red: '#DC2626',
}

const HEADING_FONT = '"Space Grotesk","Inter",sans-serif'

const cardSx = {
  bgcolor: C.cardBg,
  border: `1px solid ${C.border}`,
  borderRadius: '16px',
  boxShadow: 'none',
}

const usd = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (s: string) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

type Rule = { id: string; saleType: string; label: string; mode: 'FIXED' | 'PERCENT'; value: number; active: boolean; sortOrder: number }
type Sale = {
  id: string; createdAt: string; saleType: string; saleLabel: string; clientName: string;
  description: string; saleAmount: number; commissionMode: 'FIXED' | 'PERCENT'; commissionValue: number;
  commissionAmount: number; status: 'PENDING' | 'PAID'; paidAt: string | null;
  workerId: string; workerName: string; workerEmail: string;
}
type Payment = { id: string; workerId: string; workerName: string; amount: number; createdAt: string; note: string }

const EMPTY_SALE = { saleType: '', clientName: '', description: '', saleAmount: '', customLabel: '', customCommission: '' }
const EMPTY_RULE = { saleType: '', label: '', mode: 'FIXED' as 'FIXED' | 'PERCENT', value: '', active: true, sortOrder: 0 }

export default function VentasPage() {
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0 })
  const [payments, setPayments] = useState<Payment[]>([])
  const [toast, setToast] = useState('')

  // Sale dialog
  const [saleOpen, setSaleOpen] = useState(false)
  const [saleForm, setSaleForm] = useState(EMPTY_SALE)
  const [saleSaving, setSaleSaving] = useState(false)
  const [saleError, setSaleError] = useState('')

  // Status menu (admin)
  const [statusAnchor, setStatusAnchor] = useState<null | HTMLElement>(null)
  const [statusSale, setStatusSale] = useState<Sale | null>(null)

  // Rules dialog
  const [rulesOpen, setRulesOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE)
  const [ruleEditing, setRuleEditing] = useState<Rule | null>(null)
  const [ruleSaving, setRuleSaving] = useState(false)
  const [ruleError, setRuleError] = useState('')

  // Payment dialog
  const [payOpen, setPayOpen] = useState(false)
  const [payWorkerId, setPayWorkerId] = useState('')
  const [payNote, setPayNote] = useState('')
  const [paySaving, setPaySaving] = useState(false)
  const [payError, setPayError] = useState('')

  const loadData = async () => {
    try {
      const res = await fetch('/api/comisiones')
      const data = await res.json()
      const admin = !!data.isAdmin
      setIsAdmin(admin)
      setSales(Array.isArray(data.sales) ? data.sales : [])
      setRules(Array.isArray(data.rules) ? data.rules : [])
      setStats(data.stats || { totalSales: 0, totalCommission: 0, pendingCommission: 0, paidCommission: 0 })
      if (admin) {
        try {
          const pr = await fetch('/api/comisiones/payments')
          const pd = await pr.json()
          setPayments(Array.isArray(pd) ? pd : (pd.payments || []))
        } catch { setPayments([]) }
      }
    } catch {
      setSales([]); setRules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    loadData()
  }, [status])

  const activeRules = rules.filter(r => r.active)

  // Workers derived from sales, with pending balance
  const workers = (() => {
    const map = new Map<string, { id: string; name: string; pending: number }>()
    for (const s of sales) {
      if (!s.workerId) continue
      const cur = map.get(s.workerId) || { id: s.workerId, name: s.workerName || s.workerEmail || 'Trabajador', pending: 0 }
      if (s.status === 'PENDING') cur.pending += Number(s.commissionAmount || 0)
      map.set(s.workerId, cur)
    }
    return Array.from(map.values())
  })()

  // ---- Sale dialog ----
  const openSale = () => {
    setSaleForm({ ...EMPTY_SALE, saleType: activeRules[0]?.saleType || '' })
    setSaleError('')
    setSaleOpen(true)
  }

  const selectedRule = activeRules.find(r => r.saleType === saleForm.saleType)
  const isOtro = selectedRule?.saleType === 'OTRO'
  const commissionPreview = (() => {
    if (!selectedRule) return ''
    if (isOtro) {
      const c = Number(saleForm.customCommission)
      if (saleForm.customCommission === '' || isNaN(c)) return 'Comisión: indica el monto'
      return `Comisión: ${usd(c)}`
    }
    if (selectedRule.mode === 'FIXED') return `Comisión: ${usd(selectedRule.value)}`
    return `Comisión: ${selectedRule.value}% del monto`
  })()

  const handleSaveSale = async () => {
    if (!saleForm.saleType) { setSaleError('Selecciona un tipo de venta'); return }
    if (!saleForm.clientName.trim()) { setSaleError('El cliente es requerido'); return }
    const amount = Number(saleForm.saleAmount)
    if (saleForm.saleAmount === '' || isNaN(amount) || amount < 0) { setSaleError('Monto de venta inválido'); return }
    let customCommission = NaN
    if (isOtro) {
      customCommission = Number(saleForm.customCommission)
      if (saleForm.customCommission === '' || isNaN(customCommission) || customCommission < 0) {
        setSaleError('Para "Otro" debes indicar el monto de comisión'); return
      }
    }
    setSaleSaving(true); setSaleError('')
    try {
      const body: Record<string, unknown> = {
        saleType: saleForm.saleType,
        clientName: saleForm.clientName.trim(),
        description: saleForm.description,
        saleAmount: amount,
      }
      if (isOtro) {
        body.customCommission = Number(customCommission)
        body.customLabel = saleForm.customLabel.trim()
      }
      const res = await fetch('/api/comisiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); setSaleError(e.error || 'Error al registrar la venta'); return }
      setSaleOpen(false)
      setToast('Venta registrada')
      await loadData()
    } catch {
      setSaleError('Error de conexión')
    } finally {
      setSaleSaving(false)
    }
  }

  // ---- Delete sale ----
  const handleDeleteSale = async (s: Sale) => {
    if (!confirm(`¿Eliminar la venta de "${s.clientName}"?`)) return
    try {
      await fetch(`/api/comisiones/${s.id}`, { method: 'DELETE' })
      setToast('Venta eliminada')
      await loadData()
    } catch { /* noop */ }
  }

  // ---- Toggle status (admin) ----
  const openStatusMenu = (e: React.MouseEvent<HTMLElement>, s: Sale) => {
    if (!isAdmin) return
    setStatusAnchor(e.currentTarget)
    setStatusSale(s)
  }
  const setStatus = async (newStatus: 'PENDING' | 'PAID') => {
    const s = statusSale
    setStatusAnchor(null)
    if (!s || s.status === newStatus) return
    try {
      await fetch(`/api/comisiones/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await loadData()
    } catch { /* noop */ }
  }

  // ---- Rules CRUD ----
  const resetRuleForm = () => { setRuleEditing(null); setRuleForm(EMPTY_RULE); setRuleError('') }
  const editRule = (r: Rule) => {
    setRuleEditing(r)
    setRuleForm({ saleType: r.saleType, label: r.label, mode: r.mode, value: String(r.value), active: r.active, sortOrder: r.sortOrder || 0 })
    setRuleError('')
  }
  const handleSaveRule = async () => {
    if (!ruleForm.saleType.trim() || !ruleForm.label.trim()) { setRuleError('Tipo y etiqueta son requeridos'); return }
    const value = Number(ruleForm.value)
    if (ruleForm.value === '' || isNaN(value) || value < 0) { setRuleError('Valor inválido'); return }
    setRuleSaving(true); setRuleError('')
    const payload = {
      saleType: ruleForm.saleType.trim(),
      label: ruleForm.label.trim(),
      mode: ruleForm.mode,
      value,
      active: ruleForm.active,
      sortOrder: Number(ruleForm.sortOrder) || 0,
    }
    try {
      const url = ruleEditing ? `/api/comisiones/rules/${ruleEditing.id}` : '/api/comisiones/rules'
      const method = ruleEditing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); setRuleError(e.error || 'Error al guardar la regla'); return }
      resetRuleForm()
      await loadData()
    } catch {
      setRuleError('Error de conexión')
    } finally {
      setRuleSaving(false)
    }
  }
  const handleDeleteRule = async (r: Rule) => {
    if (!confirm(`¿Eliminar la regla "${r.label}"?`)) return
    try {
      await fetch(`/api/comisiones/rules/${r.id}`, { method: 'DELETE' })
      if (ruleEditing?.id === r.id) resetRuleForm()
      await loadData()
    } catch { /* noop */ }
  }

  // ---- Payment ----
  const openPayment = () => {
    setPayWorkerId(workers.find(w => w.pending > 0)?.id || workers[0]?.id || '')
    setPayNote('')
    setPayError('')
    setPayOpen(true)
  }
  const handleSavePayment = async () => {
    if (!payWorkerId) { setPayError('Selecciona un trabajador'); return }
    setPaySaving(true); setPayError('')
    try {
      const res = await fetch('/api/comisiones/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: payWorkerId, note: payNote }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); setPayError(e.error || 'Error al registrar el pago'); return }
      setPayOpen(false)
      setToast('Pago registrado')
      await loadData()
    } catch {
      setPayError('Error de conexión')
    } finally {
      setPaySaving(false)
    }
  }

  if (status === 'loading') {
    return <Box sx={{ pt: 6 }}><LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: C.yellow } }} /></Box>
  }

  const statCards = [
    { label: 'VENTAS TOTALES', value: usd(stats.totalSales), color: C.text, icon: <TrendingUp size={18} />, iconColor: C.textSec, bg: C.cardBg },
    { label: 'COMISIÓN TOTAL', value: usd(stats.totalCommission), color: C.text, icon: <DollarSign size={18} />, iconColor: C.textSec, bg: C.cardBg },
    { label: 'COMISIÓN PENDIENTE', value: usd(stats.pendingCommission), color: C.amber, icon: <Clock size={18} />, iconColor: C.amber, bg: C.amberBg },
    { label: 'COMISIÓN PAGADA', value: usd(stats.paidCommission), color: C.green, icon: <CheckCircle2 size={18} />, iconColor: C.green, bg: C.greenBg },
  ]

  const colCount = isAdmin ? 8 : 7

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.7rem', letterSpacing: '-0.02em', color: C.text }}>
            Ventas y Comisiones
          </Typography>
          <Typography variant="body2" sx={{ color: C.textSec, mt: 0.5 }}>
            Registra tus ventas y revisa tus comisiones.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {isAdmin && (
            <Button variant="outlined" startIcon={<Settings size={16} />} onClick={() => { resetRuleForm(); setRulesOpen(true) }}
              sx={{ borderColor: C.border, color: C.textSec, textTransform: 'none', fontWeight: 600, borderRadius: 2,
                '&:hover': { borderColor: C.textMut, bgcolor: C.hover } }}>
              Reglas
            </Button>
          )}
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={openSale}
            sx={{ bgcolor: C.yellow, color: C.text, '&:hover': { bgcolor: C.yellowHover }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Registrar venta
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ pt: 2 }}><LinearProgress sx={{ '& .MuiLinearProgress-bar': { bgcolor: C.yellow } }} /></Box>
      ) : (
        <>
          {/* Stat cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {statCards.map(s => (
              <Grid item xs={6} md={3} key={s.label}>
                <Card sx={{ ...cardSx, bgcolor: s.bg, height: '100%' }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: s.iconColor, mb: 1 }}>
                      {s.icon}
                      <Typography sx={{ fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.02em', color: C.textSec }}>
                        {s.label}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: s.color }}>
                      {s.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Ventas table */}
          <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: C.text, mb: 1.5 }}>
            Ventas
          </Typography>
          {sales.length === 0 ? (
            <Card sx={{ ...cardSx, border: `2px dashed ${C.border}`, py: 8, textAlign: 'center', mb: 4 }}>
              <TrendingUp size={44} color={C.border} />
              <Typography variant="body1" sx={{ color: C.textSec, fontWeight: 500, mt: 1 }}>
                Aún no hay ventas registradas.
              </Typography>
            </Card>
          ) : (
            <Paper sx={{ ...cardSx, overflowX: 'auto', mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: C.hover }}>
                    {['Fecha', 'Tipo', 'Cliente', ...(isAdmin ? ['Trabajador'] : []), 'Venta', '%/Valor', 'Comisión', 'Estado', ''].map((h, i) => (
                      <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.72rem', color: C.textSec, borderColor: C.border, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map(s => {
                    const isPaid = s.status === 'PAID'
                    return (
                      <TableRow key={s.id} sx={{ '&:hover': { bgcolor: C.hover }, '& td': { borderColor: C.border } }}>
                        <TableCell sx={{ fontSize: '0.8rem', color: C.textSec, whiteSpace: 'nowrap' }}>{fmtDate(s.createdAt)}</TableCell>
                        <TableCell>
                          <Chip label={s.saleLabel || s.saleType} size="small"
                            sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: C.yellowBg, color: C.amber }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.text }}>{s.clientName}</TableCell>
                        {isAdmin && (
                          <TableCell sx={{ fontSize: '0.8rem', color: C.textSec }}>
                            {s.workerName || s.workerEmail || '—'}
                          </TableCell>
                        )}
                        <TableCell sx={{ fontSize: '0.85rem', color: C.text, whiteSpace: 'nowrap' }}>{usd(s.saleAmount)}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: C.textSec, whiteSpace: 'nowrap' }}>
                          {s.commissionMode === 'PERCENT' ? `${s.commissionValue}%` : `Fijo ${usd(s.commissionValue)}`}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{usd(s.commissionAmount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={isPaid ? 'Pagada' : 'Pendiente'}
                            size="small"
                            onClick={isAdmin ? (e) => openStatusMenu(e, s) : undefined}
                            sx={{
                              fontWeight: 700, fontSize: '0.68rem',
                              bgcolor: isPaid ? C.greenBg : C.amberBg,
                              color: isPaid ? C.green : C.amber,
                              cursor: isAdmin ? 'pointer' : 'default',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDeleteSale(s)} sx={{ color: C.red }}>
                              <Trash2 size={15} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Status toggle menu (admin) */}
          <Menu anchorEl={statusAnchor} open={!!statusAnchor} onClose={() => setStatusAnchor(null)}>
            <MenuItem onClick={() => setStatus('PENDING')} sx={{ fontSize: '0.85rem' }}>
              <Clock size={15} style={{ marginRight: 8, color: C.amber }} /> Marcar pendiente
            </MenuItem>
            <MenuItem onClick={() => setStatus('PAID')} sx={{ fontSize: '0.85rem' }}>
              <CheckCircle2 size={15} style={{ marginRight: 8, color: C.green }} /> Marcar pagada
            </MenuItem>
          </Menu>

          {/* Payment history (admin) */}
          {isAdmin && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontFamily: HEADING_FONT, fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: C.text }}>
                  Historial de pagos de comisión
                </Typography>
                <Button variant="outlined" startIcon={<Wallet size={16} />} onClick={openPayment}
                  disabled={workers.length === 0}
                  sx={{ borderColor: C.border, color: C.textSec, textTransform: 'none', fontWeight: 600, borderRadius: 2,
                    '&:hover': { borderColor: C.textMut, bgcolor: C.hover } }}>
                  Registrar pago
                </Button>
              </Box>
              <Paper sx={{ ...cardSx, overflowX: 'auto' }}>
                {payments.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center', color: C.textMut }}>
                    <Typography variant="body2">Aún no hay pagos registrados.</Typography>
                  </Box>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: C.hover }}>
                        {['Trabajador', 'Monto', 'Fecha', 'Nota'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: C.textSec, borderColor: C.border, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map(p => (
                        <TableRow key={p.id} sx={{ '&:hover': { bgcolor: C.hover }, '& td': { borderColor: C.border } }}>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.text }}>{p.workerName || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: C.green, whiteSpace: 'nowrap' }}>{usd(p.amount)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: C.textSec, whiteSpace: 'nowrap' }}>{fmtDate(p.createdAt)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: C.textSec }}>{p.note || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>
            </>
          )}
        </>
      )}

      {/* ---- Registrar venta dialog ---- */}
      <Dialog open={saleOpen} onClose={() => setSaleOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: '-0.02em', color: C.text }}>
          Registrar venta
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {saleError && <Alert severity="error" sx={{ mb: 2 }}>{saleError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de venta</InputLabel>
                <Select label="Tipo de venta" value={saleForm.saleType}
                  onChange={e => setSaleForm(p => ({ ...p, saleType: e.target.value }))}>
                  {activeRules.length === 0 && <MenuItem value="" disabled>No hay tipos disponibles</MenuItem>}
                  {activeRules.map(r => <MenuItem key={r.id} value={r.saleType}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
              {commissionPreview && (
                <Typography variant="caption" sx={{ color: C.amber, fontWeight: 600, mt: 0.75, display: 'block' }}>
                  {commissionPreview}
                </Typography>
              )}
            </Grid>
            {isOtro && (
              <>
                <Grid item xs={12}>
                  <TextField label="Servicio (descripción corta)" value={saleForm.customLabel} fullWidth size="small"
                    onChange={e => setSaleForm(p => ({ ...p, customLabel: e.target.value }))} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Comisión ($)" value={saleForm.customCommission} fullWidth size="small" type="number" required
                    inputProps={{ min: 0, step: '0.01' }}
                    onChange={e => setSaleForm(p => ({ ...p, customCommission: e.target.value }))} />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField label="Cliente" value={saleForm.clientName} fullWidth size="small" required
                onChange={e => setSaleForm(p => ({ ...p, clientName: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Descripción (opcional)" value={saleForm.description} fullWidth size="small" multiline rows={2}
                onChange={e => setSaleForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Monto de venta" value={saleForm.saleAmount} fullWidth size="small" type="number" required
                inputProps={{ min: 0, step: '0.01' }}
                onChange={e => setSaleForm(p => ({ ...p, saleAmount: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSaleOpen(false)} sx={{ textTransform: 'none', color: C.textSec }}>Cancelar</Button>
          <Button onClick={handleSaveSale} variant="contained"
            disabled={saleSaving || (isOtro && (saleForm.customCommission === '' || isNaN(Number(saleForm.customCommission)) || Number(saleForm.customCommission) < 0))}
            sx={{ bgcolor: C.yellow, color: C.text, '&:hover': { bgcolor: C.yellowHover }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {saleSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- Reglas dialog (admin) ---- */}
      <Dialog open={rulesOpen} onClose={() => setRulesOpen(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: '-0.02em', color: C.text }}>
          Reglas de comisión
          <IconButton size="small" onClick={() => setRulesOpen(false)} sx={{ color: C.textSec }}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent>
          {/* existing rules */}
          <Box sx={{ mb: 3 }}>
            {rules.length === 0 ? (
              <Typography variant="body2" sx={{ color: C.textMut, py: 2 }}>No hay reglas configuradas.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: C.hover }}>
                    {['Tipo', 'Etiqueta', 'Modo', 'Valor', 'Activa', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: C.textSec, borderColor: C.border }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.map(r => (
                    <TableRow key={r.id} sx={{ '& td': { borderColor: C.border } }}>
                      <TableCell sx={{ fontSize: '0.78rem', color: C.textSec }}>{r.saleType}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: C.text }}>{r.label}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: C.textSec }}>{r.mode === 'PERCENT' ? 'Porcentaje' : 'Fijo'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: C.text }}>{r.mode === 'PERCENT' ? `${r.value}%` : usd(r.value)}</TableCell>
                      <TableCell>
                        <Chip label={r.active ? 'Sí' : 'No'} size="small"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: r.active ? C.greenBg : C.hover, color: r.active ? C.green : C.textMut }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => editRule(r)}><Pencil size={14} /></IconButton></Tooltip>
                          <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDeleteRule(r)} sx={{ color: C.red }}><Trash2 size={14} /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          {/* add / edit form */}
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: C.text, mb: 1.5 }}>
            {ruleEditing ? 'Editar regla' : 'Agregar regla'}
          </Typography>
          {ruleError && <Alert severity="error" sx={{ mb: 2 }}>{ruleError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField label="Tipo (saleType)" value={ruleForm.saleType} fullWidth size="small"
                onChange={e => setRuleForm(p => ({ ...p, saleType: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Etiqueta" value={ruleForm.label} fullWidth size="small"
                onChange={e => setRuleForm(p => ({ ...p, label: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Modo</InputLabel>
                <Select label="Modo" value={ruleForm.mode}
                  onChange={e => setRuleForm(p => ({ ...p, mode: e.target.value as 'FIXED' | 'PERCENT' }))}>
                  <MenuItem value="FIXED">Fijo</MenuItem>
                  <MenuItem value="PERCENT">Porcentaje</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField label="Valor" value={ruleForm.value} fullWidth size="small" type="number"
                inputProps={{ min: 0, step: '0.01' }}
                onChange={e => setRuleForm(p => ({ ...p, value: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Orden" value={ruleForm.sortOrder} fullWidth size="small" type="number"
                onChange={e => setRuleForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch checked={ruleForm.active}
                  onChange={e => setRuleForm(p => ({ ...p, active: e.target.checked }))}
                  sx={{ '& .Mui-checked': { color: C.yellow }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: C.yellow } }} />
                <Typography variant="body2" sx={{ color: C.textSec }}>Activa</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {ruleEditing && (
                <Button onClick={resetRuleForm} sx={{ textTransform: 'none', color: C.textSec }}>Cancelar</Button>
              )}
              <Button onClick={handleSaveRule} variant="contained" disabled={ruleSaving}
                sx={{ bgcolor: C.yellow, color: C.text, '&:hover': { bgcolor: C.yellowHover }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                {ruleSaving ? 'Guardando...' : ruleEditing ? 'Actualizar' : 'Agregar'}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRulesOpen(false)} sx={{ textTransform: 'none', color: C.textSec }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ---- Registrar pago dialog (admin) ---- */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontFamily: HEADING_FONT, fontWeight: 700, letterSpacing: '-0.02em', color: C.text }}>
          Registrar pago de comisión
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Trabajador</InputLabel>
            <Select label="Trabajador" value={payWorkerId} onChange={e => setPayWorkerId(e.target.value)}>
              {workers.length === 0 && <MenuItem value="" disabled>No hay trabajadores</MenuItem>}
              {workers.map(w => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}{w.pending > 0 ? ` — pendiente ${usd(w.pending)}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Nota (opcional)" value={payNote} fullWidth size="small" multiline rows={2}
            onChange={e => setPayNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPayOpen(false)} sx={{ textTransform: 'none', color: C.textSec }}>Cancelar</Button>
          <Button onClick={handleSavePayment} variant="contained" disabled={paySaving}
            sx={{ bgcolor: C.yellow, color: C.text, '&:hover': { bgcolor: C.yellowHover }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {paySaving ? 'Guardando...' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setToast('')} sx={{ width: '100%' }}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
