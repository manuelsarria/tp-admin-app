'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Divider, CircularProgress, Alert, InputAdornment, IconButton, Tooltip,
} from '@mui/material'
import { Save, FlashOn, Add, Delete } from '@mui/icons-material'
import { UserAssignmentSelector } from './UserAssignmentSelector'
import { ExtraManejoAlert } from '@/components/shared/ExtraManejoAlert'

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuoteItem {
  tipoCarga: string
  medidaLargo: string
  medidaAncho: string
  medidaAlto: string
  tipoEnvio: string
  cbmFt3: string
  unidadVolumen: string
  peso: string
  flete: string
}

interface FormState {
  cliente: string
  direccion: string
  items: QuoteItem[]
  tiempoTransito: string
  validezTarifa: string
  extraManejo: string
  extraManejoMotivo: string
  entregaPanama: string
  descuento: string
  comentarios: string
  hasExtraManejo: boolean
  hasEntregaPanama: boolean
  hasDescuento: boolean
}

const EMPTY_ITEM: QuoteItem = {
  tipoCarga: '', medidaLargo: '', medidaAncho: '', medidaAlto: '',
  tipoEnvio: 'MARITIMO', cbmFt3: '', unidadVolumen: 'CBM', peso: '', flete: '',
}

const EMPTY: FormState = {
  cliente: '', direccion: '',
  items: [{ ...EMPTY_ITEM }],
  tiempoTransito: '45', validezTarifa: '10',
  extraManejo: '', extraManejoMotivo: '', entregaPanama: '', descuento: '',
  comentarios: '',
  hasExtraManejo: false, hasEntregaPanama: false, hasDescuento: false,
}

function calcTotal(f: FormState): number {
  const fletes = f.items.reduce((s, it) => s + (parseFloat(it.flete) || 0), 0)
  const extra   = f.hasExtraManejo   ? (parseFloat(f.extraManejo)   || 0) : 0
  const entrega = f.hasEntregaPanama ? (parseFloat(f.entregaPanama) || 0) : 0
  const desc    = f.hasDescuento     ? (parseFloat(f.descuento)     || 0) : 0
  return fletes + extra + entrega - desc
}

function toNum(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

interface Props { id?: string; initial?: any }

export function FastQuoteForm({ id, initial }: Props) {
  const router = useRouter()
  const [form, setForm]       = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(!!initial)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [assignedToId, setAssignedToId] = useState<string | null>(initial?.assignedToId || null)
  const total = calcTotal(form)

  useEffect(() => {
    if (!initial) return
    const rawItems = Array.isArray(initial.items) && initial.items.length > 0
      ? initial.items.map((it: any) => ({
          tipoCarga:    it.tipoCarga    ?? '',
          medidaLargo:  it.medidaLargo  != null ? String(it.medidaLargo)  : '',
          medidaAncho:  it.medidaAncho  != null ? String(it.medidaAncho)  : '',
          medidaAlto:   it.medidaAlto   != null ? String(it.medidaAlto)   : '',
          tipoEnvio:    it.tipoEnvio    ?? 'MARITIMO',
          cbmFt3:       it.cbmFt3       != null ? String(it.cbmFt3)       : '',
          unidadVolumen: it.unidadVolumen ?? 'CBM',
          peso:         it.peso         != null ? String(it.peso)         : '',
          flete:        it.flete        != null ? String(it.flete)        : '',
        }))
      : [{
          tipoCarga:    initial.tipoCarga    ?? '',
          medidaLargo:  initial.medidaLargo  != null ? String(initial.medidaLargo)  : '',
          medidaAncho:  initial.medidaAncho  != null ? String(initial.medidaAncho)  : '',
          medidaAlto:   initial.medidaAlto   != null ? String(initial.medidaAlto)   : '',
          tipoEnvio:    initial.tipoEnvio    ?? 'MARITIMO',
          cbmFt3:       initial.cbmFt3       != null ? String(initial.cbmFt3)       : '',
          unidadVolumen: initial.unidadVolumen ?? 'CBM',
          peso:         initial.peso         != null ? String(initial.peso)         : '',
          flete:        String(initial.flete ?? 0),
        }]

    setAssignedToId(initial.assignedToId || null)
    setForm({
      cliente:        initial.cliente        ?? '',
      direccion:      initial.direccion      ?? '',
      items:          rawItems,
      tiempoTransito: String(initial.tiempoTransito ?? 45),
      validezTarifa:  String(initial.validezTarifa  ?? 10),
      extraManejo:    initial.extraManejo    != null ? String(initial.extraManejo)    : '',
      extraManejoMotivo: '',
      entregaPanama:  initial.entregaPanama  != null ? String(initial.entregaPanama)  : '',
      descuento:      initial.descuento      != null ? String(initial.descuento)      : '',
      comentarios:    initial.comentarios    ?? '',
      hasExtraManejo:   initial.extraManejo   != null,
      hasEntregaPanama: initial.entregaPanama != null,
      hasDescuento:     initial.descuento     != null,
    })
    setLoading(false)
  }, [initial])

  // ── Item helpers ──────────────────────────────────────────────────────────────
  const setItem = (index: number, field: keyof QuoteItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => {
        const items = prev.items.map((it, i) => i === index ? { ...it, [field]: e.target.value } : it)
        return { ...prev, items }
      })

  const setItemSelect = (index: number, field: keyof QuoteItem, value: string) =>
    setForm(prev => {
      const items = prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it)
      return { ...prev, items }
    })

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))

  const removeItem = (index: number) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))

  const set = (field: keyof Omit<FormState, 'items'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const toggle = (field: 'hasExtraManejo' | 'hasEntregaPanama' | 'hasDescuento') => () =>
    setForm(prev => ({ ...prev, [field]: !prev[field] }))

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente.trim()) { setError('El nombre del cliente es requerido'); return }
    if (form.items.some(it => !it.flete)) { setError('Todos los ítems deben tener un flete'); return }

    setSaving(true)
    setError('')

    const payload = {
      cliente:        form.cliente.trim(),
      direccion:      form.direccion.trim() || null,
      items:          form.items.map(it => ({
        tipoCarga:    it.tipoCarga.trim() || null,
        medidaLargo:  toNum(it.medidaLargo),
        medidaAncho:  toNum(it.medidaAncho),
        medidaAlto:   toNum(it.medidaAlto),
        tipoEnvio:    it.tipoEnvio,
        cbmFt3:       toNum(it.cbmFt3),
        unidadVolumen: it.unidadVolumen,
        peso:         toNum(it.peso),
        flete:        parseFloat(it.flete) || 0,
      })),
      // keep first item values at top-level for backward compat
      tipoCarga:     form.items[0]?.tipoCarga?.trim() || null,
      tipoEnvio:     form.items[0]?.tipoEnvio || 'MARITIMO',
      cbmFt3:        toNum(form.items[0]?.cbmFt3),
      unidadVolumen: form.items[0]?.unidadVolumen || 'CBM',
      tiempoTransito: parseInt(form.tiempoTransito) || 45,
      validezTarifa:  parseInt(form.validezTarifa)  || 10,
      extraManejo:    form.hasExtraManejo   ? toNum(form.extraManejo)   : null,
      entregaPanama:  form.hasEntregaPanama ? toNum(form.entregaPanama) : null,
      descuento:      form.hasDescuento     ? toNum(form.descuento)     : null,
      comentarios:    form.comentarios.trim() || null,
      assignedToId:   assignedToId,
      total,
    }

    try {
      const url    = id ? `/api/fast-quotes/${id}` : '/api/fast-quotes'
      const method = id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al guardar')
        return
      }
      const saved = await res.json()

      // Create ExtraManejo record if enabled
      if (form.hasExtraManejo && parseFloat(form.extraManejo) > 0) {
        await fetch('/api/extra-manejos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto: parseFloat(form.extraManejo),
            motivo: form.extraManejoMotivo || 'Extra manejo',
            clienteNombre: form.cliente,
            quoteNumber: saved.quoteNumber || '',
            quoteType: 'FAST_QUOTE',
            fastQuoteId: saved.id,
          }),
        }).catch(() => {}) // non-blocking
      }

      router.push('/dashboard/cotizaciones/fast-quotes')
    } catch {
      setError('Error de red al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
  }

  const sectionTitle = (title: string) => (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1.5, mt: 0.5, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {title}
    </Typography>
  )

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* ── Left column ── */}
        <Grid item xs={12} lg={8}>

          {/* Cliente */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle('Datos del Cliente')}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <UserAssignmentSelector
                    value={assignedToId}
                    onChange={(userId, userName) => {
                      setAssignedToId(userId)
                      if (userName) setForm(prev => ({ ...prev, cliente: userName }))
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={7}>
                  <TextField
                    label="Nombre del Cliente *"
                    value={form.cliente}
                    onChange={set('cliente')}
                    fullWidth size="small"
                    inputProps={{ maxLength: 120 }}
                  />
                  <ExtraManejoAlert clienteNombre={form.cliente} />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Dirección"
                    value={form.direccion}
                    onChange={set('direccion')}
                    fullWidth size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Items */}
          {form.items.map((item, index) => (
            <Card key={index} sx={{ mb: 2, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  {sectionTitle(`Ítem ${index + 1}`)}
                  {form.items.length > 1 && (
                    <Tooltip title="Eliminar ítem">
                      <IconButton size="small" onClick={() => removeItem(index)} sx={{ color: '#DC2626', mb: 1 }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Tipo de Carga"
                      value={item.tipoCarga}
                      onChange={setItem(index, 'tipoCarga')}
                      fullWidth size="small"
                      placeholder="Ej: Cajas, Pallets…"
                    />
                  </Grid>
                  <Grid item xs={4} sm={2.33}>
                    <TextField label="Largo (cm)" value={item.medidaLargo} onChange={setItem(index, 'medidaLargo')} fullWidth size="small" type="number" />
                  </Grid>
                  <Grid item xs={4} sm={2.33}>
                    <TextField label="Ancho (cm)" value={item.medidaAncho} onChange={setItem(index, 'medidaAncho')} fullWidth size="small" type="number" />
                  </Grid>
                  <Grid item xs={4} sm={2.33}>
                    <TextField label="Alto (cm)"  value={item.medidaAlto}  onChange={setItem(index, 'medidaAlto')}  fullWidth size="small" type="number" />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de Envío</InputLabel>
                      <Select value={item.tipoEnvio} label="Tipo de Envío"
                        onChange={e => setItemSelect(index, 'tipoEnvio', e.target.value)}>
                        <MenuItem value="MARITIMO">Marítimo</MenuItem>
                        <MenuItem value="AEREO">Aéreo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField label="CBM / FT3" value={item.cbmFt3} onChange={setItem(index, 'cbmFt3')} fullWidth size="small" type="number"
                      inputProps={{ step: '0.001', min: 0 }} />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Unidad</InputLabel>
                      <Select value={item.unidadVolumen} label="Unidad"
                        onChange={e => setItemSelect(index, 'unidadVolumen', e.target.value)}>
                        <MenuItem value="CBM">CBM</MenuItem>
                        <MenuItem value="FT3">FT3</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField label="Peso (KGS)" value={item.peso} onChange={setItem(index, 'peso')} fullWidth size="small" type="number"
                      inputProps={{ step: '0.01', min: 0 }} />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField label="Flete *" value={item.flete} onChange={setItem(index, 'flete')} fullWidth size="small" type="number"
                      inputProps={{ step: '0.01', min: 0 }}
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addItem}
            sx={{ mb: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#FACC15', color: '#FACC15', '&:hover': { borderColor: '#EAB308', bgcolor: '#FFF8F8' } }}
          >
            Agregar ítem
          </Button>

          {/* Servicios */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle('Servicios y Cargos Adicionales')}
              <Grid container spacing={2}>
                {/* Extra Manejo */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={form.hasExtraManejo} onChange={toggle('hasExtraManejo')} size="small" sx={{ '& .MuiSwitch-thumb': { bgcolor: form.hasExtraManejo ? '#FACC15' : undefined } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Extra Manejo</Typography>}
                    />
                    {form.hasExtraManejo && (
                      <>
                        <TextField label="Monto" value={form.extraManejo} onChange={set('extraManejo')} size="small" type="number"
                          inputProps={{ step: '0.01', min: 0 }} sx={{ width: 160 }}
                          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                        <TextField label="Motivo del extra manejo" value={form.extraManejoMotivo} onChange={set('extraManejoMotivo')} size="small"
                          placeholder="Ej: Carga sobredimensionada" sx={{ flex: 1, minWidth: 200 }} />
                      </>
                    )}
                  </Box>
                </Grid>

                {/* Entrega Panamá */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={form.hasEntregaPanama} onChange={toggle('hasEntregaPanama')} size="small" sx={{ '& .MuiSwitch-thumb': { bgcolor: form.hasEntregaPanama ? '#FACC15' : undefined } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Entrega Panamá Centro <Typography component="span" variant="caption" sx={{ color: '#FACC15', fontWeight: 700 }}>(OPCIONAL)</Typography></Typography>}
                    />
                    {form.hasEntregaPanama && (
                      <TextField label="Monto" value={form.entregaPanama} onChange={set('entregaPanama')} size="small" type="number"
                        inputProps={{ step: '0.01', min: 0 }} sx={{ width: 160 }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    )}
                  </Box>
                </Grid>

                {/* Descuento */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={form.hasDescuento} onChange={toggle('hasDescuento')} size="small" sx={{ '& .MuiSwitch-thumb': { bgcolor: form.hasDescuento ? '#FACC15' : undefined } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>Descuento</Typography>}
                    />
                    {form.hasDescuento && (
                      <TextField label="Monto" value={form.descuento} onChange={set('descuento')} size="small" type="number"
                        inputProps={{ step: '0.01', min: 0 }} sx={{ width: 160 }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    )}
                  </Box>
                </Grid>

                {/* Comentarios */}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1.5 }} />
                  <TextField label="Comentarios" value={form.comentarios} onChange={set('comentarios')} fullWidth size="small" multiline rows={3} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} lg={4}>

          {/* Tiempos */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle('Tiempos')}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Tiempo Tránsito (días)" value={form.tiempoTransito} onChange={set('tiempoTransito')} fullWidth size="small" type="number" inputProps={{ min: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Validez Tarifa (días)" value={form.validezTarifa} onChange={set('validezTarifa')} fullWidth size="small" type="number" inputProps={{ min: 1 }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '2px solid #FACC15', boxShadow: 'none', bgcolor: '#FFF8F8' }}>
            <CardContent sx={{ p: 3 }}>
              {sectionTitle('Resumen')}
              {form.items.map((it, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.82rem' }}>
                    {it.tipoCarga || `Ítem ${i + 1}`}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.82rem' }}>
                    $ {(parseFloat(it.flete) || 0).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              {form.hasExtraManejo && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.82rem' }}>Extra Manejo</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>$ {(parseFloat(form.extraManejo) || 0).toFixed(2)}</Typography>
                </Box>
              )}
              {form.hasEntregaPanama && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.82rem' }}>Entrega Panamá Centro</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>$ {(parseFloat(form.entregaPanama) || 0).toFixed(2)}</Typography>
                </Box>
              )}
              {form.hasDescuento && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.82rem' }}>Descuento</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626', fontSize: '0.82rem' }}>
                    ($ {(parseFloat(form.descuento) || 0).toFixed(2)})
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#374151' }}>TOTAL</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FACC15' }}>
                  $ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1.25 }}
            >
              {saving ? 'Guardando…' : id ? 'Actualizar Fast Quote' : 'Crear Fast Quote'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => router.push('/dashboard/cotizaciones/fast-quotes')}
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', color: '#6B7280', borderColor: '#E5E7EB' }}
            >
              Cancelar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
