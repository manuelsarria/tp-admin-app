'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, TextField,
  Select, MenuItem, FormControl, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel,
} from '@mui/material'
import {
  ArrowBack, Add, Delete, Save, Edit, CheckCircle,
} from '@mui/icons-material'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ORIGEN:    { label: 'ORIGEN',    color: '#B45309', bg: '#FEF3C7' },
  DESTINO:   { label: 'DESTINO',   color: '#1D4ED8', bg: '#DBEAFE' },
  INDIRECTO: { label: 'INDIRECTO', color: '#6B7280', bg: '#F3F4F6' },
}
const MEDIDAS = ['GLOBAL', 'EVENTO', 'KG', 'CBM', 'TON', 'METRO', 'HORA']
const COUNTRY_LABELS: Record<string, string> = { CHINA: 'China', PANAMA: 'Panamá', COSTA_RICA: 'Costa Rica', USA: 'USA', OTHER: 'Otro' }

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const daysBetween = (a: string | null, b: string | null) => {
  if (!a || !b) return null
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

type Item = {
  id: string; tipo: string; descripcion: string; medida: string;
  cantidad: number; costoUnit: number; costoTotal: number; isHighlighted: boolean; order: number; notes?: string
}
type Op = {
  id: string; title: string; clientName: string; clientCountry: string;
  clientPhone: string; shipmentRef: string; shipmentType: string;
  pol: string; pod: string; polDate: string; podDate: string;
  cbm: number; ingresoTotal: number; notes: string; items: Item[]
}

const EMPTY_ITEM = { tipo: 'ORIGEN', descripcion: '', medida: 'EVENTO', cantidad: 1, costoUnit: 0, isHighlighted: false }

export default function OperacionDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [op, setOp] = useState<Op | null>(null)
  const [loading, setLoading] = useState(true)
  const [editHeader, setEditHeader] = useState(false)
  const [headerForm, setHeaderForm] = useState<Partial<Op>>({})
  const [savingHeader, setSavingHeader] = useState(false)

  // New item dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newItem, setNewItem] = useState(EMPTY_ITEM)
  const [addingItem, setAddingItem] = useState(false)

  // Edit item inline
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<Partial<Item>>({})

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) router.replace('/dashboard')
  }, [session, status])

  const loadOp = useCallback(() => {
    setLoading(true)
    fetch(`/api/contabilidad/operations/${id}`)
      .then(r => r.json())
      .then(d => { setOp(d); setHeaderForm(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadOp() }, [loadOp])

  const saveHeader = async () => {
    setSavingHeader(true)
    try {
      const res = await fetch(`/api/contabilidad/operations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(headerForm),
      })
      const updated = await res.json()
      setOp(updated)
      setEditHeader(false)
    } finally { setSavingHeader(false) }
  }

  const addItem = async () => {
    setAddingItem(true)
    try {
      const res = await fetch(`/api/contabilidad/operations/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, order: (op?.items.length || 0) }),
      })
      const item = await res.json()
      setOp(prev => prev ? { ...prev, items: [...prev.items, item] } : prev)
      setAddOpen(false)
      setNewItem(EMPTY_ITEM)
    } finally { setAddingItem(false) }
  }

  const deleteItem = async (itemId: string) => {
    await fetch(`/api/contabilidad/operations/${id}/items/${itemId}`, { method: 'DELETE' })
    setOp(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev)
  }

  const saveItemEdit = async (itemId: string) => {
    const res = await fetch(`/api/contabilidad/operations/${id}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingItemData),
    })
    const updated = await res.json()
    setOp(prev => prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? updated : i) } : prev)
    setEditingItemId(null)
  }

  if (status === 'loading' || !session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) return null
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
  if (!op) return <Box sx={{ py: 8, textAlign: 'center' }}><Typography>Operación no encontrada</Typography></Box>

  // ── Calculated values ──
  const origenItems = op.items.filter(i => i.tipo === 'ORIGEN')
  const destinoItems = op.items.filter(i => i.tipo === 'DESTINO')
  const indirectoItems = op.items.filter(i => i.tipo === 'INDIRECTO')
  const totalOrigen = origenItems.reduce((s, i) => s + i.costoTotal, 0)
  const totalDestino = destinoItems.reduce((s, i) => s + i.costoTotal, 0)
  const totalIndirecto = indirectoItems.reduce((s, i) => s + i.costoTotal, 0)
  const totalCost = totalOrigen + totalDestino + totalIndirecto
  const utilidad = op.ingresoTotal - totalCost
  const cbmCost = op.cbm && totalCost > 0 ? totalCost / op.cbm : null
  const dias = daysBetween(op.polDate, op.podDate)

  return (
    <Box>
      {/* Back */}
      <Button startIcon={<ArrowBack />} onClick={() => router.push('/dashboard/contabilidad/operaciones')}
        sx={{ mb: 2, textTransform: 'none', color: '#6B7280' }}>
        Volver a Operaciones
      </Button>

      {/* ── Header Card (the yellow-header Excel style) ── */}
      <Card sx={{ borderRadius: 3, border: '2px solid #FACC15', boxShadow: 'none', mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {/* Yellow title bar */}
          <Box sx={{ bgcolor: '#FEF08A', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              {editHeader ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField size="small" label="Título" value={headerForm.title || ''} onChange={e => setHeaderForm(p => ({ ...p, title: e.target.value }))} sx={{ minWidth: 200 }} />
                  <TextField size="small" label="Cliente" value={headerForm.clientName || ''} onChange={e => setHeaderForm(p => ({ ...p, clientName: e.target.value }))} sx={{ minWidth: 180 }} />
                  <TextField size="small" label="Teléfono" value={headerForm.clientPhone || ''} onChange={e => setHeaderForm(p => ({ ...p, clientPhone: e.target.value }))} sx={{ minWidth: 140 }} />
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <Select value={headerForm.clientCountry || 'PANAMA'} onChange={e => setHeaderForm(p => ({ ...p, clientCountry: e.target.value }))}>
                      {Object.entries(COUNTRY_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#FACC15' }}>
                    {COUNTRY_LABELS[op.clientCountry]} / {op.clientName} / Carga: {op.polDate ? new Date(op.polDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'} Llegó: {op.podDate ? new Date(op.podDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>
                    {op.title} {op.clientPhone ? `· ${op.clientPhone}` : ''}
                  </Typography>
                </>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {editHeader ? (
                <>
                  <Button size="small" onClick={() => setEditHeader(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
                  <Button size="small" variant="contained" startIcon={savingHeader ? <CircularProgress size={14} color="inherit" /> : <Save />}
                    onClick={saveHeader} disabled={savingHeader}
                    sx={{ bgcolor: '#FACC15', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                    Guardar
                  </Button>
                </>
              ) : (
                <IconButton size="small" onClick={() => setEditHeader(true)}><Edit sx={{ fontSize: 18 }} /></IconButton>
              )}
            </Box>
          </Box>

          {/* Two-column info panel */}
          <Box sx={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {/* Left: table of items */}
            <Box sx={{ flex: 3, minWidth: 0 }}>
              {/* Items table header */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '60px 90px 1fr 90px 70px 110px 110px 50px', gap: 0, bgcolor: '#DC2626' }}>
                {['ITEM', 'TIPO', 'DESCRIPCIÓN', 'MEDIDA', 'CANT.', 'COSTO UNIT.', 'COSTO TOTAL', ''].map(h => (
                  <Box key={h} sx={{ px: 1, py: 0.75, color: 'white', fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.05em' }}>{h}</Box>
                ))}
              </Box>

              {/* Items */}
              {op.items.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: '#9CA3AF' }}>
                  <Typography variant="body2">Sin items. Agrega el primer gasto.</Typography>
                </Box>
              ) : op.items.map((item, idx) => {
                const tc = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.ORIGEN
                const isEditing = editingItemId === item.id
                if (isEditing) {
                  return (
                    <Box key={item.id} sx={{ display: 'grid', gridTemplateColumns: '60px 90px 1fr 90px 70px 110px 110px 50px', bgcolor: '#FFFBEB', borderBottom: '1px solid #E5E7EB' }}>
                      <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: '#9CA3AF' }}>{idx + 1}</Box>
                      <Box sx={{ px: 0.5, py: 0.5 }}>
                        <Select size="small" value={editingItemData.tipo || item.tipo} onChange={e => setEditingItemData(p => ({ ...p, tipo: e.target.value }))} sx={{ fontSize: '0.72rem', height: 32 }}>
                          {['ORIGEN', 'DESTINO', 'INDIRECTO'].map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>{t}</MenuItem>)}
                        </Select>
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.5 }}>
                        <TextField size="small" value={editingItemData.descripcion ?? item.descripcion} onChange={e => setEditingItemData(p => ({ ...p, descripcion: e.target.value }))} inputProps={{ style: { fontSize: '0.78rem', padding: '4px 8px' } }} fullWidth />
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.5 }}>
                        <Select size="small" value={editingItemData.medida || item.medida} onChange={e => setEditingItemData(p => ({ ...p, medida: e.target.value }))} sx={{ fontSize: '0.72rem', height: 32 }}>
                          {MEDIDAS.map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.72rem' }}>{m}</MenuItem>)}
                        </Select>
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.5 }}>
                        <TextField size="small" type="number" value={editingItemData.cantidad ?? item.cantidad} onChange={e => setEditingItemData(p => ({ ...p, cantidad: parseFloat(e.target.value) }))} inputProps={{ style: { fontSize: '0.78rem', padding: '4px 8px' } }} />
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.5 }}>
                        <TextField size="small" type="number" value={editingItemData.costoUnit ?? item.costoUnit} onChange={e => setEditingItemData(p => ({ ...p, costoUnit: parseFloat(e.target.value) }))} inputProps={{ style: { fontSize: '0.78rem', padding: '4px 8px' } }} />
                      </Box>
                      <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#DC2626' }}>
                        {fmt(((editingItemData.cantidad ?? item.cantidad) * (editingItemData.costoUnit ?? item.costoUnit)) || 0)}
                      </Box>
                      <Box sx={{ px: 0.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="small" sx={{ color: '#16A34A' }} onClick={() => saveItemEdit(item.id)}><CheckCircle sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => setEditingItemId(null)}><ArrowBack sx={{ fontSize: 14 }} /></IconButton>
                      </Box>
                    </Box>
                  )
                }
                return (
                  <Box key={item.id} sx={{
                    display: 'grid', gridTemplateColumns: '60px 90px 1fr 90px 70px 110px 110px 50px',
                    bgcolor: item.isHighlighted ? 'rgba(245,158,11,0.08)' : (idx % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)'),
                    borderBottom: '1px solid rgba(10,10,10,0.05)',
                    '&:hover': { bgcolor: 'rgba(10, 10, 10, 0.05)' },
                  }}>
                    <Box sx={{ px: 1, py: 0.75, fontSize: '0.75rem', color: '#9CA3AF' }}>{idx + 1}</Box>
                    <Box sx={{ px: 1, py: 0.5 }}>
                      <Chip label={tc.label} size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', bgcolor: tc.bg, color: tc.color, height: 20 }} />
                    </Box>
                    <Box sx={{ px: 1, py: 0.75, fontSize: '0.82rem', fontWeight: item.isHighlighted ? 700 : 400, color: item.isHighlighted ? '#DC2626' : '#1F2937' }}>{item.descripcion}</Box>
                    <Box sx={{ px: 1, py: 0.75, fontSize: '0.75rem', color: '#6B7280' }}>{item.medida}</Box>
                    <Box sx={{ px: 1, py: 0.75, fontSize: '0.82rem', textAlign: 'center' }}>{item.cantidad}</Box>
                    <Box sx={{ px: 1, py: 0.75, fontSize: '0.82rem', color: item.costoUnit > 0 ? '#DC2626' : '#9CA3AF' }}>
                      {item.costoUnit > 0 ? fmt(item.costoUnit) : '$   -'}
                    </Box>
                    <Box sx={{ px: 1, py: 0.75, fontWeight: 700, fontSize: '0.85rem', color: item.costoTotal > 0 ? '#1F2937' : '#9CA3AF' }}>
                      {item.costoTotal > 0 ? fmt(item.costoTotal) : '$   -'}
                    </Box>
                    <Box sx={{ px: 0.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <IconButton size="small" onClick={() => { setEditingItemId(item.id); setEditingItemData({}) }}><Edit sx={{ fontSize: 14, color: '#9CA3AF' }} /></IconButton>
                      <IconButton size="small" onClick={() => deleteItem(item.id)}><Delete sx={{ fontSize: 14, color: '#DC2626' }} /></IconButton>
                    </Box>
                  </Box>
                )
              })}

              {/* Total row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '60px 90px 1fr 90px 70px 110px 110px 50px', bgcolor: '#F8FAFC', borderTop: '2px solid #E5E7EB' }}>
                <Box sx={{ px: 1, py: 1, gridColumn: '1 / 7', fontWeight: 800, fontSize: '0.8rem', color: '#374151' }}>Total</Box>
                <Box sx={{ px: 1, py: 1, fontWeight: 900, fontSize: '0.9rem', color: '#FACC15' }}>{fmt(totalCost)}</Box>
                <Box />
              </Box>

              {/* Add item button */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Button size="small" startIcon={<Add />} onClick={() => setAddOpen(true)}
                  sx={{ textTransform: 'none', color: '#6B7280', fontSize: '0.78rem' }}>
                  Agregar línea
                </Button>
              </Box>
            </Box>

            {/* Right: Summary panel */}
            <Box sx={{ width: { xs: '100%', md: 220 }, borderLeft: { md: '1px solid #E5E7EB' }, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Origen/Destino/Indirecto breakdown */}
              <Box>
                {[
                  { label: 'ORIGEN', value: totalOrigen, color: '#B45309' },
                  { label: 'DESTINO', value: totalDestino, color: '#1D4ED8' },
                  { label: 'INDIRECTO', value: totalIndirecto, color: '#6B7280' },
                ].map(r => (
                  <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #F3F4F6' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.72rem', color: r.color }}>{r.label}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151' }}>{fmt(r.value)}</Typography>
                  </Box>
                ))}
              </Box>

              {/* COSTO TOTAL */}
              <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo Total</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#DC2626' }}>{fmt(totalCost)}</Typography>
                {cbmCost && <Typography sx={{ fontSize: '0.65rem', color: '#9CA3AF', mt: 0.25 }}>CBM Cost: {fmt(cbmCost)}</Typography>}
              </Box>

              {/* POL / POD */}
              {(op.pol || op.pod || op.polDate || op.podDate) && (
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 0.5 }}>
                    <Box sx={{ bgcolor: '#DBEAFE', borderRadius: 1, p: 0.75, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#1D4ED8' }}>POL</Typography>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{op.pol || '—'}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{fmtDate(op.polDate)}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 1, p: 0.75, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#16A34A' }}>POD</Typography>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{op.pod || '—'}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#6B7280' }}>{fmtDate(op.podDate)}</Typography>
                    </Box>
                  </Box>
                  {dias !== null && <Typography sx={{ fontSize: '0.65rem', textAlign: 'center', color: '#9CA3AF' }}>Tiempo: {dias} días</Typography>}
                </Box>
              )}

              {/* INGRESO + UTILIDAD */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#6B7280' }}>INGRESO</Typography>
                  {editHeader ? null : (
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700 }}>{fmt(op.ingresoTotal)}</Typography>
                  )}
                </Box>
                {editHeader && (
                  <TextField size="small" type="number" label="Ingreso total $" fullWidth
                    value={headerForm.ingresoTotal || 0}
                    onChange={e => setHeaderForm(p => ({ ...p, ingresoTotal: parseFloat(e.target.value) }))}
                    sx={{ mb: 1 }} />
                )}
                <Box sx={{ bgcolor: '#DCFCE7', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>Utilidad</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: utilidad >= 0 ? '#16A34A' : '#DC2626' }}>
                    {fmt(utilidad)}
                  </Typography>
                  {op.ingresoTotal > 0 && (
                    <Typography sx={{ fontSize: '0.65rem', color: '#9CA3AF' }}>
                      {((utilidad / op.ingresoTotal) * 100).toFixed(1)}% rentabilidad
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Extra header fields when editing */}
              {editHeader && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField size="small" label="Referencia" value={headerForm.shipmentRef || ''} onChange={e => setHeaderForm(p => ({ ...p, shipmentRef: e.target.value }))} />
                  <FormControl size="small" fullWidth>
                    <Select value={headerForm.shipmentType || 'FCL'} onChange={e => setHeaderForm(p => ({ ...p, shipmentType: e.target.value }))}>
                      {['FCL', 'LCL', 'AIR', 'OTROS'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField size="small" label="POL" value={headerForm.pol || ''} onChange={e => setHeaderForm(p => ({ ...p, pol: e.target.value }))} />
                  <TextField size="small" label="POD" value={headerForm.pod || ''} onChange={e => setHeaderForm(p => ({ ...p, pod: e.target.value }))} />
                  <TextField size="small" type="date" label="Fecha POL" InputLabelProps={{ shrink: true }} value={headerForm.polDate ? String(headerForm.polDate).slice(0, 10) : ''} onChange={e => setHeaderForm(p => ({ ...p, polDate: e.target.value }))} />
                  <TextField size="small" type="date" label="Fecha POD" InputLabelProps={{ shrink: true }} value={headerForm.podDate ? String(headerForm.podDate).slice(0, 10) : ''} onChange={e => setHeaderForm(p => ({ ...p, podDate: e.target.value }))} />
                  <TextField size="small" type="number" label="CBM" value={headerForm.cbm || ''} onChange={e => setHeaderForm(p => ({ ...p, cbm: parseFloat(e.target.value) }))} />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Add item dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Agregar Línea de Costo</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={newItem.tipo} onChange={e => setNewItem(p => ({ ...p, tipo: e.target.value }))}>
                  {['ORIGEN', 'DESTINO', 'INDIRECTO'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={newItem.medida} onChange={e => setNewItem(p => ({ ...p, medida: e.target.value }))}>
                  {MEDIDAS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField size="small" label="Descripción *" value={newItem.descripcion} onChange={e => setNewItem(p => ({ ...p, descripcion: e.target.value }))} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" label="Cantidad" type="number" value={newItem.cantidad} onChange={e => setNewItem(p => ({ ...p, cantidad: parseFloat(e.target.value) || 1 }))} sx={{ flex: 1 }} />
              <TextField size="small" label="Costo Unit. $" type="number" value={newItem.costoUnit} onChange={e => setNewItem(p => ({ ...p, costoUnit: parseFloat(e.target.value) || 0 }))} sx={{ flex: 1 }} />
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700, color: '#FACC15' }}>= {fmt(newItem.cantidad * newItem.costoUnit)}</Typography>
              </Box>
            </Box>
            <FormControlLabel control={<Switch checked={newItem.isHighlighted} onChange={e => setNewItem(p => ({ ...p, isHighlighted: e.target.checked }))} />}
              label={<Typography variant="body2">Resaltar fila (amarillo)</Typography>} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={addItem} variant="contained" disabled={addingItem || !newItem.descripcion.trim()}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {addingItem ? 'Guardando...' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
