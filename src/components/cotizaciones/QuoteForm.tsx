'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  MenuItem, Select, FormControl, InputLabel, InputAdornment,
  IconButton, Table, TableHead, TableRow, TableCell, TableBody,
  Divider, Chip, Alert, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { Add, Delete, PictureAsPdf, Save } from '@mui/icons-material'
import { UserAssignmentSelector } from './UserAssignmentSelector'

// ── Field helper (must be outside component to avoid remount on each render) ──
function TF({ label, value, onChange, type = 'text', ...rest }: any) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      fullWidth
      size="small"
      type={type}
      {...rest}
    />
  )
}

// ── Service presets ───────────────────────────────────────────────────────────
const SERVICE_PRESETS = [
  'OCEAN FREIGHT - 20 GP',
  'OCEAN FREIGHT - 40 GP',
  'OCEAN FREIGHT - 40 HC',
  'OCEAN FREIGHT - BASIC (LCL)',
  'DHTC - DESTINATION TERMINAL HANDLING CHARGES',
  'HANDLING & SHIPPING CHARGES DEST.',
  'LOCAL DOCUMENTATION FEE',
  'TRANSPORTE EN DESTINO - PANAMA CENTRO',
  'TRANSPORTE EN DESTINO - PANAMA OESTE',
  'TRANSPORTE EN DESTINO - CHIRIQUI',
  'TRANSPORTE EN DESTINO - COLON',
  'CUSTOM BROKER / HONORARIOS ADUANEROS',
  'SERVICIO DE ALMACENAMIENTO EN 30 DIAS 20 GP',
  'SERVICIO DE ALMACENAMIENTO EN 30 DIAS 40 HC',
  'SEGURO DE CARGA',
  'ENTREGA - GRUA PLATAFORMA',
  'HANDLING & DELIVERY CHARGES',
]

const PACKAGE_TYPES = ['Unit', 'CBM/TON', 'BL', 'Container', 'Kg', 'Lote']

const TERMINACIONES = ['FOB', 'EXW', 'CIF', 'CFR', 'DAP', 'DDP', 'FCA']

interface ServiceLine {
  service: string
  package: string
  price: string
  qty: string
  amount: number
}

function emptyLine(): ServiceLine {
  return { service: '', package: 'Unit', price: '', qty: '1', amount: 0 }
}

function computeAmount(price: string, qty: string): number {
  return (parseFloat(price) || 0) * (parseFloat(qty) || 0)
}

interface Props {
  initial?: any
}

export function QuoteForm({ initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Quote type ──────────────────────────────────────────────────────────────
  const [quoteType, setQuoteType] = useState<'FCL' | 'LCL'>(initial?.quoteType ?? 'FCL')

  // ── Header fields ───────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

  const [tipoServicio, setTipoServicio]     = useState(initial?.tipoServicio ?? 'Maritimo')
  const [validoDesde, setValidoDesde]       = useState(initial?.validoDesde ? new Date(initial.validoDesde).toISOString().slice(0, 10) : today)
  const [validoHasta, setValidoHasta]       = useState(initial?.validoHasta ? new Date(initial.validoHasta).toISOString().slice(0, 10) : nextWeek)
  const [frecuencia, setFrecuencia]         = useState(initial?.frecuencia ?? '')
  const [tiempoTransito, setTiempoTransito] = useState(initial?.tiempoTransito ?? '')
  const [lineaNaviera, setLineaNaviera]     = useState(initial?.lineaNaviera ?? '')
  const [ruta, setRuta]                     = useState(initial?.ruta ?? '')

  // ── Shipment fields ─────────────────────────────────────────────────────────
  const [assignedToId, setAssignedToId]                   = useState<string | null>(initial?.assignedToId || null)
  const [cliente, setCliente]                           = useState(initial?.cliente ?? '')
  const [referenciasAdicionales, setReferenciasAdicionales] = useState(initial?.referenciasAdicionales ?? '')
  const [pesoBruto, setPesoBruto]                       = useState(initial?.pesoBruto ?? '')
  const [volumen, setVolumen]                           = useState(initial?.volumen ?? '')
  const [pesoCargable, setPesoCargable]                 = useState(initial?.pesoCargable ?? '')
  const [terminoNegociacion, setTerminoNegociacion]     = useState(initial?.terminoNegociacion ?? 'FOB')
  const [mercaderia, setMercaderia]                     = useState(initial?.mercaderia ?? '')
  const [valorMercancia, setValorMercancia]             = useState(initial?.valorMercancia ?? '')
  const [valorSeguro, setValorSeguro]                   = useState(initial?.valorSeguro ?? '')
  const [piezas, setPiezas]                             = useState(initial?.piezas ?? '')
  const [tipoEmbalaje, setTipoEmbalaje]                 = useState(initial?.tipoEmbalaje ?? 'GENERAL')
  const [dimensiones, setDimensiones]                   = useState(initial?.dimensiones ?? '')
  const [tipoContenedor, setTipoContenedor]             = useState(initial?.tipoContenedor ?? quoteType === 'FCL' ? '20 GP' : 'LCL')
  const [direccionRecogida, setDireccionRecogida]       = useState(initial?.direccionRecogida ?? '')
  const [direccionEntrega, setDireccionEntrega]         = useState(initial?.direccionEntrega ?? '')
  const [comentarios, setComentarios]                   = useState(initial?.comentarios ?? '')

  // ── Service lines ───────────────────────────────────────────────────────────
  const [lines, setLines] = useState<ServiceLine[]>(
    initial?.servicios?.length
      ? initial.servicios.map((l: any) => ({ ...l, price: String(l.price), qty: String(l.qty) }))
      : [emptyLine()]
  )

  const updateLine = (i: number, field: keyof ServiceLine, value: string) => {
    setLines(prev => {
      const updated = [...prev]
      updated[i] = { ...updated[i], [field]: value }
      if (field === 'price' || field === 'qty') {
        updated[i].amount = computeAmount(
          field === 'price' ? value : updated[i].price,
          field === 'qty' ? value : updated[i].qty
        )
      }
      return updated
    })
  }

  const addLine = () => setLines(prev => [...prev, emptyLine()])
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i))

  const total = lines.reduce((s, l) => s + l.amount, 0)

  // ── Save ────────────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    quoteType,
    tipoServicio,
    validoDesde,
    validoHasta,
    frecuencia,
    tiempoTransito,
    lineaNaviera,
    ruta,
    cliente,
    referenciasAdicionales,
    pesoBruto: pesoBruto ? parseFloat(pesoBruto) : null,
    volumen,
    pesoCargable: pesoCargable ? parseFloat(pesoCargable) : null,
    terminoNegociacion,
    mercaderia,
    valorMercancia: valorMercancia ? parseFloat(valorMercancia) : null,
    valorSeguro: valorSeguro ? parseFloat(valorSeguro) : null,
    piezas: piezas ? parseFloat(piezas) : null,
    tipoEmbalaje,
    dimensiones,
    tipoContenedor,
    direccionRecogida,
    direccionEntrega,
    comentarios,
    servicios: lines.map(l => ({
      service: l.service,
      package: l.package,
      price: parseFloat(l.price) || 0,
      qty: parseFloat(l.qty) || 0,
      amount: l.amount,
    })),
    total,
    assignedToId,
  })

  const handleSave = async (redirectToList = true) => {
    if (!cliente.trim()) { setError('El cliente es requerido'); return }
    if (!validoDesde || !validoHasta) { setError('Las fechas de validez son requeridas'); return }

    setLoading(true)
    setError('')
    try {
      const url = initial?.id ? `/api/quotes/${initial.id}` : '/api/quotes'
      const method = initial?.id ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) })
      if (!res.ok) throw new Error('Error saving')
      const saved = await res.json()
      if (redirectToList) {
        router.push('/dashboard/cotizaciones/quotes')
      } else {
        return saved
      }
    } catch {
      setError('Error al guardar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndPDF = async () => {
    if (!cliente.trim()) { setError('El cliente es requerido'); return }
    setLoading(true)
    setError('')
    try {
      let id = initial?.id
      if (!id) {
        const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) })
        if (!res.ok) throw new Error('Error saving')
        const saved = await res.json()
        id = saved.id
      } else {
        await fetch(`/api/quotes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) })
      }
      window.open(`/api/quotes/${id}/pdf`, '_blank')
      router.push('/dashboard/cotizaciones/quotes')
    } catch {
      setError('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Type toggle ── */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#374151' }}>Tipo de Servicio:</Typography>
            <ToggleButtonGroup
              value={quoteType}
              exclusive
              onChange={(_, v) => v && setQuoteType(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root.Mui-selected': { bgcolor: '#FACC15', color: 'white', '&:hover': { bgcolor: '#C00510' } } }}
            >
              <ToggleButton value="FCL" sx={{ fontWeight: 700, px: 3 }}>FCL — Full Container</ToggleButton>
              <ToggleButton value="LCL" sx={{ fontWeight: 700, px: 3 }}>LCL — Carga Suelta</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>

        {/* ── LEFT COLUMN ── */}
        <Grid item xs={12} lg={6}>

          {/* Quote header */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#FAFAF9' }}>Encabezado de la Cotización</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TF label="Tipo de Servicio" value={tipoServicio} onChange={setTipoServicio} /></Grid>
                <Grid item xs={6}><TF label="Línea Naviera" value={lineaNaviera} onChange={setLineaNaviera} /></Grid>
                <Grid item xs={6}><TF label="Válido Desde" value={validoDesde} onChange={setValidoDesde} type="date" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TF label="Válido Hasta" value={validoHasta} onChange={setValidoHasta} type="date" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TF label="Frecuencia" value={frecuencia} onChange={setFrecuencia} /></Grid>
                <Grid item xs={6}><TF label="Tiempo de Tránsito" value={tiempoTransito} onChange={setTiempoTransito} /></Grid>
                <Grid item xs={12}><TF label="Ruta (Ej: YANTIAN - BALBOA)" value={ruta} onChange={setRuta} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Client & shipment */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#FAFAF9' }}>Cliente</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <UserAssignmentSelector
                    value={assignedToId}
                    onChange={(userId, userName) => {
                      setAssignedToId(userId)
                      if (userName) setCliente(userName)
                    }}
                  />
                </Grid>
                <Grid item xs={6}><TF label="Cliente *" value={cliente} onChange={setCliente} /></Grid>
                <Grid item xs={6}><TF label="Referencias Adicionales" value={referenciasAdicionales} onChange={setReferenciasAdicionales} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#FAFAF9' }}>Direcciones</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TF label="Dirección de Recogida" value={direccionRecogida} onChange={setDireccionRecogida} /></Grid>
                <Grid item xs={6}><TF label="Dirección de Entrega" value={direccionEntrega} onChange={setDireccionEntrega} /></Grid>
              </Grid>
            </CardContent>
          </Card>

        </Grid>

        {/* ── RIGHT COLUMN ── */}
        <Grid item xs={12} lg={6}>

          {/* Shipment info */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#FAFAF9' }}>Información de Embarque</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}><TF label="Peso Bruto" value={pesoBruto} onChange={setPesoBruto} type="number" /></Grid>
                <Grid item xs={6}><TF label="Volumen (Ej: 6.5 CBM)" value={volumen} onChange={setVolumen} /></Grid>
                <Grid item xs={6}><TF label="Peso Cargable" value={pesoCargable} onChange={setPesoCargable} type="number" /></Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Término de Negociación</InputLabel>
                    <Select value={terminoNegociacion} label="Término de Negociación" onChange={e => setTerminoNegociacion(e.target.value)}>
                      {TERMINACIONES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}><TF label="Mercadería" value={mercaderia} onChange={setMercaderia} /></Grid>
                <Grid item xs={3}>
                  <TF label="Valor Mercancía" value={valorMercancia} onChange={setValorMercancia} type="number"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                </Grid>
                <Grid item xs={3}>
                  <TF label="Valor del Seguro" value={valorSeguro} onChange={setValorSeguro} type="number"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                </Grid>
                <Grid item xs={3}><TF label="# Piezas" value={piezas} onChange={setPiezas} type="number" /></Grid>
                <Grid item xs={3}><TF label="Tipo de Embalaje" value={tipoEmbalaje} onChange={setTipoEmbalaje} /></Grid>
                <Grid item xs={3}><TF label="Dimensiones" value={dimensiones} onChange={setDimensiones} /></Grid>
                <Grid item xs={3}><TF label="Tipo Contenedor / Servicio" value={tipoContenedor} onChange={setTipoContenedor} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#FAFAF9' }}>Comentarios</Typography>
              <TextField
                value={comentarios}
                onChange={e => setComentarios(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
                placeholder="Esperamos esta tarifa este acorde a su requeriento."
              />
            </CardContent>
          </Card>

        </Grid>

        {/* ── SERVICE LINES — full width ── */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
                  Detalles de Cotización — Líneas de Servicio
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={addLine}
                  sx={{ color: '#FACC15', fontWeight: 600, textTransform: 'none' }}>
                  Agregar línea
                </Button>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAFAF9' }}>
                    {['Service', 'Package', 'Price (USD)', 'QTY', 'Amount', ''].map(h => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.78rem', py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, i) => (
                    <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: '#F9FAFB' } }}>
                      {/* Service autocomplete */}
                      <TableCell sx={{ minWidth: 280 }}>
                        <TextField
                          value={line.service}
                          onChange={e => updateLine(i, 'service', e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="Nombre del servicio"
                          select={false}
                          inputProps={{ list: 'service-presets' }}
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                        />
                        <datalist id="service-presets">
                          {SERVICE_PRESETS.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </TableCell>
                      {/* Package */}
                      <TableCell sx={{ minWidth: 100 }}>
                        <TextField
                          select value={line.package}
                          onChange={e => updateLine(i, 'package', e.target.value)}
                          size="small" fullWidth
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                        >
                          {PACKAGE_TYPES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      {/* Price */}
                      <TableCell sx={{ minWidth: 110 }}>
                        <TextField
                          value={line.price}
                          onChange={e => updateLine(i, 'price', e.target.value)}
                          size="small" fullWidth type="number"
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                        />
                      </TableCell>
                      {/* QTY */}
                      <TableCell sx={{ minWidth: 80 }}>
                        <TextField
                          value={line.qty}
                          onChange={e => updateLine(i, 'qty', e.target.value)}
                          size="small" fullWidth type="number"
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                        />
                      </TableCell>
                      {/* Amount */}
                      <TableCell sx={{ minWidth: 110 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>
                          USD {line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      {/* Delete */}
                      <TableCell>
                        <IconButton size="small" onClick={() => removeLine(i)} sx={{ color: '#EF4444' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pr: 6 }}>
                <Box sx={{ bgcolor: '#FAFAF9', px: 3, py: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Total (USD)</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                    $ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Action buttons ── */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={() => router.push('/dashboard/cotizaciones/quotes')}
              sx={{ borderRadius: 2, px: 3, textTransform: 'none', color: '#6B7280', borderColor: '#D1D5DB' }}>
              Cancelar
            </Button>
            <Button variant="outlined" startIcon={<Save />} onClick={() => handleSave(true)} disabled={loading}
              sx={{ borderRadius: 2, px: 3, textTransform: 'none', borderColor: '#FACC15', color: '#FACC15', fontWeight: 700 }}>
              Guardar
            </Button>
            <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleSaveAndPDF} disabled={loading}
              sx={{ borderRadius: 2, px: 3, textTransform: 'none', bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, fontWeight: 700 }}>
              {loading ? 'Generando...' : 'Guardar y Generar PDF'}
            </Button>
          </Box>
        </Grid>

      </Grid>
    </Box>
  )
}
