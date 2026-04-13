'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, CircularProgress, Alert, Switch, FormControlLabel,
  Chip, Tooltip, IconButton,
} from '@mui/material'
import { ArrowBack, Add, Delete, Save, CheckCircle } from '@mui/icons-material'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']

const COUNTRIES = [
  { value: 'PANAMA', label: 'Panamá' }, { value: 'COSTA_RICA', label: 'Costa Rica' },
  { value: 'CHINA', label: 'China' }, { value: 'USA', label: 'USA' }, { value: 'OTHER', label: 'Otro' },
]
const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ORIGEN:    { label: 'ORIGEN',    color: '#B45309', bg: '#FEF3C7' },
  DESTINO:   { label: 'DESTINO',   color: '#1D4ED8', bg: '#DBEAFE' },
  INDIRECTO: { label: 'INDIRECTO', color: '#6B7280', bg: '#F3F4F6' },
}
const MEDIDAS = ['GLOBAL', 'EVENTO', 'KG', 'CBM', 'TON', 'METRO', 'HORA']
const COUNTRY_LABELS: Record<string, string> = {
  CHINA: 'China', PANAMA: 'Panamá', COSTA_RICA: 'Costa Rica', USA: 'USA', OTHER: 'Otro',
}

const fmt = (n: number) =>
  n === 0 ? '$   -' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type LineItem = {
  _id: string
  tipo: string
  descripcion: string
  medida: string
  cantidad: number
  costoUnit: number
  isHighlighted: boolean
}

const blankLine = (): LineItem => ({
  _id: Math.random().toString(36).slice(2),
  tipo: 'ORIGEN', descripcion: '', medida: 'EVENTO',
  cantidad: 1, costoUnit: 0, isHighlighted: false,
})

const blankHeader = {
  title: '', clientName: '', clientCountry: 'PANAMA', clientPhone: '',
  shipmentRef: '', shipmentType: 'FCL', pol: '', pod: '',
  polDate: '', podDate: '', cbm: '', ingresoTotal: '',
}

export default function NuevaOperacionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [header, setHeader] = useState(blankHeader)
  const [lines, setLines] = useState<LineItem[]>([blankLine()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) router.replace('/dashboard')
  }, [session, status])

  const setH = (field: string) => (e: any) =>
    setHeader(p => ({ ...p, [field]: e.target.value }))

  const updateLine = <K extends keyof LineItem>(id: string, field: K, value: LineItem[K]) =>
    setLines(prev => prev.map(l => l._id === id ? { ...l, [field]: value } : l))

  const addLine = (tipo: string = 'ORIGEN') =>
    setLines(prev => [...prev, { ...blankLine(), tipo }])

  const removeLine = (id: string) =>
    setLines(prev => prev.filter(l => l._id !== id))

  // ── Live calculations ──
  const calcTotal = (l: LineItem) => l.cantidad * l.costoUnit
  const origenLines  = lines.filter(l => l.tipo === 'ORIGEN')
  const destinoLines = lines.filter(l => l.tipo === 'DESTINO')
  const indirectoLines = lines.filter(l => l.tipo === 'INDIRECTO')
  const totalOrigen    = origenLines.reduce((s, l) => s + calcTotal(l), 0)
  const totalDestino   = destinoLines.reduce((s, l) => s + calcTotal(l), 0)
  const totalIndirecto = indirectoLines.reduce((s, l) => s + calcTotal(l), 0)
  const totalCost = totalOrigen + totalDestino + totalIndirecto
  const ingreso = parseFloat(header.ingresoTotal) || 0
  const utilidad = ingreso - totalCost
  const cbm = parseFloat(header.cbm) || 0
  const cbmCost = cbm > 0 && totalCost > 0 ? totalCost / cbm : null
  const dias = header.polDate && header.podDate
    ? Math.round((new Date(header.podDate).getTime() - new Date(header.polDate).getTime()) / 86400000)
    : null

  const handleSave = async () => {
    if (!header.title.trim() || !header.clientName.trim()) {
      setError('Título y nombre del cliente son requeridos')
      return
    }
    setSaving(true); setError('')
    try {
      // 1. Create operation
      const opRes = await fetch('/api/contabilidad/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...header,
          cbm: cbm || null,
          ingresoTotal: ingreso,
        }),
      })
      if (!opRes.ok) { const e = await opRes.json(); setError(e.error || 'Error'); return }
      const op = await opRes.json()

      // 2. Create all items
      const validLines = lines.filter(l => l.descripcion.trim())
      await Promise.all(validLines.map((l, i) =>
        fetch(`/api/contabilidad/operations/${op.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: l.tipo, descripcion: l.descripcion, medida: l.medida,
            cantidad: l.cantidad, costoUnit: l.costoUnit,
            isHighlighted: l.isHighlighted, order: i,
          }),
        })
      ))

      router.push(`/dashboard/contabilidad/operaciones/${op.id}`)
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  if (status === 'loading' || !session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) return null

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => router.back()}
        sx={{ mb: 2, textTransform: 'none', color: '#6B7280' }}>
        Volver
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Main card — same visual as detail page ── */}
      <Box sx={{ borderRadius: 3, border: '2px solid #FACC15', overflow: 'hidden', bgcolor: 'white' }}>

        {/* ── Yellow header bar ── */}
        <Box sx={{ bgcolor: '#FEF08A', px: { xs: 2, sm: 3 }, py: 2 }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* País */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={header.clientCountry} onChange={setH('clientCountry')}
                sx={{ fontWeight: 700, bgcolor: 'transparent' }}>
                {COUNTRIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
            {/* Título */}
            <TextField size="small" placeholder="Título de la operación *"
              value={header.title} onChange={setH('title')}
              sx={{ flex: 2, minWidth: 200 }}
              inputProps={{ style: { fontWeight: 700 } }} />
            {/* Cliente */}
            <TextField size="small" placeholder="Nombre del cliente *"
              value={header.clientName} onChange={setH('clientName')}
              sx={{ flex: 2, minWidth: 160 }} />
            {/* Teléfono */}
            <TextField size="small" placeholder="Teléfono"
              value={header.clientPhone} onChange={setH('clientPhone')}
              sx={{ minWidth: 130 }} />
            {/* Tipo */}
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select value={header.shipmentType} onChange={setH('shipmentType')}>
                {['FCL', 'LCL', 'AIR', 'OTROS'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            {/* Referencia */}
            <TextField size="small" placeholder="Referencia / Contenedor"
              value={header.shipmentRef} onChange={setH('shipmentRef')}
              sx={{ minWidth: 160 }} />
          </Box>
        </Box>

        {/* ── Two-column body: table left, summary right ── */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>

          {/* ─────────── LEFT: Line items table ─────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Table header row */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '44px 96px 1fr 84px 64px 120px 120px 44px',
              bgcolor: '#DC2626',
            }}>
              {['ITEM', 'TIPO', 'DESCRIPCIÓN', 'MEDIDA', 'CANT.', 'COSTO UNIT.', 'COSTO TOTAL', ''].map(h => (
                <Box key={h} sx={{ px: 1, py: 0.75, color: 'white', fontWeight: 800, fontSize: '0.63rem', letterSpacing: '0.05em' }}>{h}</Box>
              ))}
            </Box>

            {/* Editable rows */}
            {lines.map((line, idx) => {
              const total = calcTotal(line)
              const tc = TIPO_CONFIG[line.tipo] || TIPO_CONFIG.ORIGEN
              return (
                <Box key={line._id} sx={{
                  display: 'grid',
                  gridTemplateColumns: '44px 96px 1fr 84px 64px 120px 120px 44px',
                  bgcolor: line.isHighlighted ? 'rgba(245,158,11,0.08)' : (idx % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.03)'),
                  borderBottom: '1px solid rgba(148,163,184,0.06)',
                  '&:hover': { bgcolor: line.isHighlighted ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.06)' },
                }}>
                  {/* # */}
                  <Box sx={{ px: 1, display: 'flex', alignItems: 'center', fontSize: '0.72rem', color: '#9CA3AF' }}>
                    {idx + 1}
                  </Box>
                  {/* TIPO */}
                  <Box sx={{ px: 0.5, py: 0.4, display: 'flex', alignItems: 'center' }}>
                    <Select size="small" value={line.tipo}
                      onChange={e => updateLine(line._id, 'tipo', e.target.value)}
                      sx={{ fontSize: '0.7rem', height: 30, '& .MuiSelect-select': { py: 0.4, px: 0.75 } }}>
                      {['ORIGEN', 'DESTINO', 'INDIRECTO'].map(t => (
                        <MenuItem key={t} value={t} sx={{ fontSize: '0.72rem' }}>
                          <Chip label={t} size="small" sx={{ fontWeight: 700, fontSize: '0.58rem', bgcolor: TIPO_CONFIG[t].bg, color: TIPO_CONFIG[t].color, height: 18 }} />
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  {/* DESCRIPCIÓN */}
                  <Box sx={{ px: 0.5, py: 0.4, display: 'flex', alignItems: 'center' }}>
                    <TextField size="small" fullWidth placeholder="Descripción del costo"
                      value={line.descripcion}
                      onChange={e => updateLine(line._id, 'descripcion', e.target.value)}
                      inputProps={{ style: { fontSize: '0.8rem', padding: '4px 8px', fontWeight: line.isHighlighted ? 700 : 400 } }}
                      sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid #E5E7EB' } }} />
                  </Box>
                  {/* MEDIDA */}
                  <Box sx={{ px: 0.5, py: 0.4, display: 'flex', alignItems: 'center' }}>
                    <Select size="small" value={line.medida}
                      onChange={e => updateLine(line._id, 'medida', e.target.value)}
                      sx={{ fontSize: '0.72rem', height: 30, '& .MuiSelect-select': { py: 0.4, px: 0.75 } }}>
                      {MEDIDAS.map(m => <MenuItem key={m} value={m} sx={{ fontSize: '0.72rem' }}>{m}</MenuItem>)}
                    </Select>
                  </Box>
                  {/* CANT */}
                  <Box sx={{ px: 0.5, py: 0.4, display: 'flex', alignItems: 'center' }}>
                    <TextField size="small" type="number"
                      value={line.cantidad}
                      onChange={e => updateLine(line._id, 'cantidad', Math.max(0, parseFloat(e.target.value) || 0))}
                      inputProps={{ style: { fontSize: '0.8rem', padding: '4px 6px', textAlign: 'center' }, min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid #E5E7EB' } }} />
                  </Box>
                  {/* COSTO UNIT */}
                  <Box sx={{ px: 0.5, py: 0.4, display: 'flex', alignItems: 'center' }}>
                    <TextField size="small" type="number"
                      value={line.costoUnit || ''}
                      placeholder="0.00"
                      onChange={e => updateLine(line._id, 'costoUnit', parseFloat(e.target.value) || 0)}
                      inputProps={{ style: { fontSize: '0.8rem', padding: '4px 8px', color: '#DC2626', fontWeight: 600 }, min: 0, step: 0.01 }}
                      sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid #E5E7EB' } }} />
                  </Box>
                  {/* COSTO TOTAL */}
                  <Box sx={{ px: 1, display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '0.85rem', color: total > 0 ? '#1F2937' : '#D1D5DB' }}>
                    {fmt(total)}
                  </Box>
                  {/* Actions */}
                  <Box sx={{ px: 0.25, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Tooltip title={line.isHighlighted ? 'Quitar resaltado' : 'Resaltar (amarillo)'}>
                      <IconButton size="small" onClick={() => updateLine(line._id, 'isHighlighted', !line.isHighlighted)}
                        sx={{ color: line.isHighlighted ? '#F59E0B' : '#D1D5DB', p: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => removeLine(line._id)}
                      sx={{ color: '#DC2626', p: 0.5 }} disabled={lines.length === 1}>
                      <Delete sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                </Box>
              )
            })}

            {/* Empty filler rows (like Excel) */}
            {[...Array(Math.max(0, 5 - lines.length))].map((_, i) => (
              <Box key={i} sx={{
                display: 'grid', gridTemplateColumns: '44px 96px 1fr 84px 64px 120px 120px 44px',
                borderBottom: '1px solid #F3F4F6',
                bgcolor: (lines.length + i) % 2 === 0 ? 'white' : '#FAFAFA',
              }}>
                <Box sx={{ px: 1, py: 1.25, fontSize: '0.72rem', color: '#E5E7EB' }}>{lines.length + i + 1}</Box>
                {[...Array(6)].map((_, j) => <Box key={j} sx={{ borderLeft: j === 0 ? '1px solid #F3F4F6' : 'none' }} />)}
                <Box />
              </Box>
            ))}

            {/* Total row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '44px 96px 1fr 84px 64px 120px 120px 44px', bgcolor: '#F8FAFC', borderTop: '2px solid #E5E7EB' }}>
              <Box sx={{ px: 1, py: 1, gridColumn: '1 / 7', fontWeight: 800, fontSize: '0.8rem', color: '#374151' }}>Total</Box>
              <Box sx={{ px: 1, py: 1, fontWeight: 900, fontSize: '0.9rem', color: '#FACC15' }}>{fmt(totalCost)}</Box>
              <Box />
            </Box>

            {/* Add line buttons */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', borderTop: '1px solid #F3F4F6' }}>
              {['ORIGEN', 'DESTINO', 'INDIRECTO'].map(tipo => {
                const tc = TIPO_CONFIG[tipo]
                return (
                  <Button key={tipo} size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
                    onClick={() => addLine(tipo)}
                    sx={{
                      textTransform: 'none', fontWeight: 700, fontSize: '0.72rem',
                      bgcolor: tc.bg, color: tc.color, borderRadius: 2,
                      '&:hover': { bgcolor: tc.bg, opacity: 0.85 },
                    }}>
                    + {tipo}
                  </Button>
                )
              })}
            </Box>
          </Box>

          {/* ─────────── RIGHT: Summary panel ─────────── */}
          <Box sx={{
            width: { xs: '100%', lg: 230 },
            borderLeft: { lg: '1px solid #E5E7EB' },
            borderTop: { xs: '1px solid #E5E7EB', lg: 'none' },
            p: 2,
            display: 'flex', flexDirection: 'column', gap: 2,
            bgcolor: '#FAFAFA',
          }}>

            {/* Origen / Destino / Indirecto */}
            <Box>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                Desglose de Costos
              </Typography>
              {[
                { label: 'ORIGEN',    value: totalOrigen,    color: '#B45309', bg: '#FEF3C7' },
                { label: 'DESTINO',   value: totalDestino,   color: '#1D4ED8', bg: '#DBEAFE' },
                { label: 'INDIRECTO', value: totalIndirecto, color: '#6B7280', bg: '#F3F4F6' },
              ].map(r => (
                <Box key={r.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.6, borderBottom: '1px solid #F3F4F6' }}>
                  <Chip label={r.label} size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', bgcolor: r.bg, color: r.color, height: 18 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#374151' }}>{fmt(r.value)}</Typography>
                </Box>
              ))}
            </Box>

            {/* Costo total + CBM */}
            <Box sx={{ bgcolor: '#FEF2F2', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo Total</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: '#DC2626', lineHeight: 1.3 }}>{fmt(totalCost)}</Typography>
              {cbmCost !== null && (
                <Typography sx={{ fontSize: '0.65rem', color: '#9CA3AF', mt: 0.25 }}>CBM Cost: {fmt(cbmCost)}</Typography>
              )}
            </Box>

            {/* POL / POD */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box sx={{ bgcolor: '#DBEAFE', borderRadius: 1.5, p: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#1D4ED8', mb: 0.5 }}>POL</Typography>
                  <TextField size="small" placeholder="Origen" value={header.pol} onChange={setH('pol')}
                    inputProps={{ style: { fontSize: '0.72rem', padding: '2px 4px' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #BFDBFE' } }} />
                  <TextField size="small" type="date" value={header.polDate} onChange={setH('polDate')}
                    inputProps={{ style: { fontSize: '0.68rem', padding: '2px 4px' } }}
                    sx={{ mt: 0.5, '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #BFDBFE' } }} />
                </Box>
                <Box sx={{ bgcolor: '#D1FAE5', borderRadius: 1.5, p: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#16A34A', mb: 0.5 }}>POD</Typography>
                  <TextField size="small" placeholder="Destino" value={header.pod} onChange={setH('pod')}
                    inputProps={{ style: { fontSize: '0.72rem', padding: '2px 4px' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #A7F3D0' } }} />
                  <TextField size="small" type="date" value={header.podDate} onChange={setH('podDate')}
                    inputProps={{ style: { fontSize: '0.68rem', padding: '2px 4px' } }}
                    sx={{ mt: 0.5, '& .MuiOutlinedInput-notchedOutline': { border: '1px solid #A7F3D0' } }} />
                </Box>
              </Box>
              {dias !== null && (
                <Typography sx={{ fontSize: '0.65rem', color: '#6B7280', textAlign: 'center' }}>⏱ {dias} días de tránsito</Typography>
              )}
              <TextField size="small" label="CBM" type="number" value={header.cbm} onChange={setH('cbm')}
                inputProps={{ style: { fontSize: '0.8rem' }, min: 0, step: 0.01 }} />
            </Box>

            {/* Ingreso + Utilidad */}
            <Box>
              <TextField size="small" label="Ingreso Total (cobrado al cliente) $"
                type="number" value={header.ingresoTotal} onChange={setH('ingresoTotal')}
                fullWidth inputProps={{ min: 0, step: 0.01 }} sx={{ mb: 1 }} />
              <Box sx={{ bgcolor: utilidad >= 0 ? '#DCFCE7' : '#FEF2F2', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: utilidad >= 0 ? '#16A34A' : '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Utilidad Estimada
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: utilidad >= 0 ? '#16A34A' : '#DC2626', lineHeight: 1.3 }}>
                  {fmt(utilidad)}
                </Typography>
                {ingreso > 0 && (
                  <Typography sx={{ fontSize: '0.65rem', color: '#9CA3AF' }}>
                    {((utilidad / ingreso) * 100).toFixed(1)}% rentabilidad
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Save button */}
      <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={() => router.back()} sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={handleSave} disabled={saving}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3 }}>
          {saving ? 'Guardando...' : 'Guardar Operación'}
        </Button>
      </Box>
    </Box>
  )
}
