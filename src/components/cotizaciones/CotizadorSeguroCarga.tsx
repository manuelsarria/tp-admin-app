'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  Slider,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
  Paper,
  Grid,
} from '@mui/material'
import { Calculate, ContentCopy, Check, Info, PictureAsPdf, Save, ListAlt } from '@mui/icons-material'
import CircularProgress from '@mui/material/CircularProgress'
// El cálculo y el tarifario salen del mismo módulo que usa el API. Tenerlos
// duplicados aquí hacía que el número en pantalla y el del PDF se separaran
// por un par de centavos: el servidor redondea en cada paso y esta copia no.
import { CLIENT_PRESETS, calcSeguro } from '@/lib/seguro'

type ClientType = 'regular' | 'agente' | 'custom'

interface FormData {
  valorComercial: string
  valorFlete: string
  valorTributos: string
  gastosAdicionalesPct: number
  lucroSesantePct: number
  clienteType: ClientType
  customRate: string
  customMinimo: string
  customLabel: string
  clienteNombre: string
  descripcionCarga: string
  referencia: string
}

interface Result {
  base: number
  gastosAdicionales: number
  lucroSesante: number
  totalAsegurado: number
  prima: number
  valorCobrar: number
  rate: number
  minimum: number
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const parseNum = (v: string) => parseFloat(v) || 0

export function CotizadorSeguroCarga() {
  const [form, setForm] = useState<FormData>({
    valorComercial: '',
    valorFlete: '',
    valorTributos: '',
    gastosAdicionalesPct: 0,
    lucroSesantePct: 0,
    clienteType: 'regular',
    customRate: '0.35',
    customMinimo: '50',
    customLabel: '',
    clienteNombre: '',
    descripcionCarga: '',
    referencia: '',
  })
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')

  // ── Registro de la cotización ───────────────────────────────────────────
  // Antes esto solo calculaba y generaba un PDF sin dejar rastro. Ahora se
  // guarda como las Quotes para poder darle seguimiento.
  const router = useRouter()
  const sp = useSearchParams()
  const editId = sp.get('id')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedNumber, setSavedNumber] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  // Si se cambia un valor y se vuelve a calcular, lo guardado queda viejo. El
  // PDF se imprime desde la base, así que sin esto el cliente recibiría un
  // documento distinto al que se ve en pantalla.
  const [savedEstaAlDia, setSavedEstaAlDia] = useState(false)

  const applyQuote = useCallback((q: any) => {
    setForm({
      valorComercial: String(q.valorComercial ?? ''),
      valorFlete: String(q.valorFlete ?? ''),
      valorTributos: String(q.valorTributos ?? ''),
      gastosAdicionalesPct: q.gastosAdicionalesPct ?? 0,
      lucroSesantePct: q.lucroSesantePct ?? 0,
      clienteType: q.clienteType ?? 'regular',
      customRate: String(q.rate ?? '0.35'),
      customMinimo: String(q.minimum ?? '50'),
      customLabel: q.clienteType === 'custom' ? (q.rateLabel ?? '') : '',
      clienteNombre: q.cliente ?? '',
      descripcionCarga: q.descripcionCarga ?? '',
      referencia: q.referencia ?? '',
    })
    setResult({
      base: q.base, gastosAdicionales: q.gastosAdicionales, lucroSesante: q.lucroSesante,
      totalAsegurado: q.totalAsegurado, prima: q.prima, valorCobrar: q.valorCobrar,
      rate: q.rate, minimum: q.minimum,
    })
    setSavedId(q.id)
    setSavedNumber(q.quoteNumber)
    setSavedEstaAlDia(true)
  }, [])

  useEffect(() => {
    if (!editId) return
    fetch(`/api/seguro-quotes/${editId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(q => { if (q) applyQuote(q) })
      .catch(() => {})
  }, [editId, applyQuote])

  /// Guarda (o actualiza) y devuelve la cotizacion guardada.
  const persist = async (): Promise<{ id: string; quoteNumber: string } | null> => {
    if (!result) return null
    setSaving(true)
    setSaveError('')
    try {
      const info = rateInfo()
      const payload = {
        cliente: form.clienteNombre.trim() || 'Sin nombre',
        referencia: form.referencia || null,
        descripcionCarga: form.descripcionCarga || null,
        valorComercial: parseNum(form.valorComercial),
        valorFlete: parseNum(form.valorFlete),
        valorTributos: parseNum(form.valorTributos),
        gastosAdicionalesPct: form.gastosAdicionalesPct,
        lucroSesantePct: form.lucroSesantePct,
        clienteType: form.clienteType,
        customLabel: info.label,
        customRate: info.rate,
        customMinimo: info.minimum,
      }
      const url = savedId ? `/api/seguro-quotes/${savedId}` : '/api/seguro-quotes'
      const res = await fetch(url, {
        method: savedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'No se pudo guardar')
      const q = await res.json()
      setSavedId(q.id)
      setSavedNumber(q.quoteNumber)
      setSavedEstaAlDia(true)
      return { id: q.id, quoteNumber: q.quoteNumber }
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar')
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => { void persist() }

  // Tasa / minimo segun el tipo de cliente (el personalizado los toma del formulario)
  const rateInfo = (): { label: string; rate: number; minimum: number } => {
    if (form.clienteType === 'custom') {
      return {
        label: form.customLabel.trim() || 'Tasa Personalizada',
        rate: parseNum(form.customRate),
        minimum: parseNum(form.customMinimo),
      }
    }
    return CLIENT_PRESETS[form.clienteType]
  }

  const calculate = () => {
    const { rate, minimum } = rateInfo()
    const r = calcSeguro({
      valorComercial: parseNum(form.valorComercial),
      valorFlete: parseNum(form.valorFlete),
      valorTributos: parseNum(form.valorTributos),
      gastosAdicionalesPct: form.gastosAdicionalesPct,
      lucroSesantePct: form.lucroSesantePct,
      rate,
      minimum,
    })
    setResult({ ...r, rate, minimum })
    // Lo guardado deja de coincidir con lo que se acaba de calcular, así que la
    // próxima descarga de PDF tiene que volver a guardar antes de imprimir.
    setSavedEstaAlDia(false)
  }

  const generateMessage = (): string => {
    if (!result) return ''
    const info = rateInfo()
    const tipoCliente = info.label
    const tasa = `${info.rate}%`

    const lines: string[] = [
      'Estimado/a Cliente,',
      '',
      'Nos complace presentarle la cotización de seguro de carga para su embarque:',
      '',
      '📦 DETALLE DE COBERTURA',
      `• Valor comercial de la mercancía: ${fmt(parseNum(form.valorComercial))}`,
      `• Valor del flete: ${fmt(parseNum(form.valorFlete))}`,
      `• Tributos y aranceles: ${fmt(parseNum(form.valorTributos))}`,
    ]

    if (form.gastosAdicionalesPct > 0) {
      lines.push(`• Gastos adicionales (${form.gastosAdicionalesPct}%): ${fmt(result.gastosAdicionales)}`)
    }
    if (form.lucroSesantePct > 0) {
      lines.push(`• Lucro cesante (${form.lucroSesantePct}%): ${fmt(result.lucroSesante)}`)
    }

    lines.push(
      `• Total asegurado: ${fmt(result.totalAsegurado)}`,
      '',
      '💰 PRIMA DE SEGURO',
      `• Tipo de cliente: ${tipoCliente}`,
      `• Tasa aplicada: ${tasa}`,
      `• Valor de la póliza: ${fmt(result.valorCobrar)}`,
      '',
      '📧 Al momento de emitir la póliza, la misma le será enviada directamente a su correo electrónico registrado.',
      '',
      'Para proceder con la contratación, no dude en contactarnos.',
      '',
      'Atentamente,',
      'Equipo TP Logistics',
    )

    return lines.join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadPdf = async () => {
    if (!result) return
    setPdfLoading(true)
    setPdfError('')
    try {
      // El PDF siempre sale de una cotizacion guardada: si todavia no lo esta,
      // se guarda primero. Antes se podia bajar el PDF sin guardar y la
      // cotizacion no quedaba en el historial: el numero del papel lo inventaba
      // el generador y no existia en ninguna parte.
      // Solo se salta el guardado si lo guardado sigue coincidiendo con lo que
      // se ve; si se cambió algo y se recalculó, se vuelve a guardar primero.
      const guardada = savedId && savedEstaAlDia
        ? { id: savedId, quoteNumber: savedNumber ?? '' }
        : await persist()
      if (!guardada) throw new Error('No se pudo guardar la cotización, así que no se generó el PDF')

      const r = await fetch(`/api/seguro-quotes/${guardada.id}/pdf`)
      if (!r.ok) throw new Error('No se pudo generar el PDF')
      const b = await r.blob()
      const u = URL.createObjectURL(b)
      const link = document.createElement('a')
      link.href = u
      link.download = `cotizacion-seguro-${guardada.quoteNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(u)
    } catch (err: any) {
      setPdfError(err.message || 'Error generando el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const isFormValid =
    parseNum(form.valorComercial) > 0 &&
    parseNum(form.valorFlete) > 0 &&
    parseNum(form.valorTributos) > 0

  return (
    <Grid container spacing={3}>
      {/* ── Formulario ── */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Datos de la Carga
            </Typography>

            {/* Tipo de cliente */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>
                Tipo de Cliente
              </Typography>
              <ToggleButtonGroup
                value={form.clienteType}
                exclusive
                onChange={(_, v) => v && setForm(f => ({ ...f, clienteType: v }))}
                fullWidth
                size="small"
                sx={{
                  '& .MuiToggleButton-root.Mui-selected': {
                    bgcolor: '#FACC15',
                    color: '#0A0A0A',
                    '&:hover': { bgcolor: '#EAB308' },
                  },
                }}
              >
                <ToggleButton value="regular" sx={{ fontWeight: 600, borderRadius: '8px 0 0 8px' }}>
                  Cliente Regular
                </ToggleButton>
                <ToggleButton value="agente" sx={{ fontWeight: 600 }}>
                  Agente de Carga
                </ToggleButton>
                <ToggleButton value="custom" sx={{ fontWeight: 600, borderRadius: '0 8px 8px 0' }}>
                  Tasa Personalizada
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {form.clienteType === 'custom'
                  ? `Tasa: ${parseNum(form.customRate)}% — Mínimo: ${fmt(parseNum(form.customMinimo))}`
                  : `Tasa: ${CLIENT_PRESETS[form.clienteType].rate}% — Mínimo: ${fmt(CLIENT_PRESETS[form.clienteType].minimum)}`}
              </Typography>

              {form.clienteType === 'custom' && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      label="Tasa"
                      fullWidth
                      size="small"
                      type="number"
                      value={form.customRate}
                      onChange={e => setForm(f => ({ ...f, customRate: e.target.value }))}
                      InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      label="Prima mínima"
                      fullWidth
                      size="small"
                      type="number"
                      value={form.customMinimo}
                      onChange={e => setForm(f => ({ ...f, customMinimo: e.target.value }))}
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Etiqueta (opcional)"
                      fullWidth
                      size="small"
                      placeholder="Ej. Cliente VIP"
                      value={form.customLabel}
                      onChange={e => setForm(f => ({ ...f, customLabel: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>

            {/* Datos para la cotización (opcionales, salen en el PDF) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cliente (para el PDF)"
                  fullWidth
                  size="small"
                  value={form.clienteNombre}
                  onChange={e => setForm(f => ({ ...f, clienteNombre: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Referencia / BL (opcional)"
                  fullWidth
                  size="small"
                  value={form.referencia}
                  onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción de la mercancía (opcional)"
                  fullWidth
                  size="small"
                  value={form.descripcionCarga}
                  onChange={e => setForm(f => ({ ...f, descripcionCarga: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Valores requeridos */}
            <TextField
              label="Valor Comercial *"
              fullWidth
              value={form.valorComercial}
              onChange={e => setForm(f => ({ ...f, valorComercial: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ mb: 2 }}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Valor del Flete *"
              fullWidth
              value={form.valorFlete}
              onChange={e => setForm(f => ({ ...f, valorFlete: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ mb: 2 }}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
            />
            <TextField
              label="Tributos y Aranceles *"
              fullWidth
              value={form.valorTributos}
              onChange={e => setForm(f => ({ ...f, valorTributos: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ mb: 3 }}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
            />

            {/* Gastos adicionales */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.5 }}>
                  Gastos Adicionales: {form.gastosAdicionalesPct}%
                </Typography>
                <Tooltip
                  title="Todos los gastos en movilizar la carga sin incluir la factura de fletes y tributos. Ej: intermediación aduanera, medidas de seguridad, permisos."
                  arrow
                  placement="top"
                >
                  <IconButton size="small">
                    <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Slider
                value={form.gastosAdicionalesPct}
                onChange={(_, v) => setForm(f => ({ ...f, gastosAdicionalesPct: v as number }))}
                min={0}
                max={20}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' },
                ]}
                sx={{ color: '#FACC15' }}
              />
            </Box>

            {/* Lucro cesante */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mr: 0.5 }}>
                  Lucro Cesante: {form.lucroSesantePct}%
                </Typography>
                <Tooltip
                  title="Pérdida de la utilidad esperada causada por un siniestro."
                  arrow
                  placement="top"
                >
                  <IconButton size="small">
                    <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Slider
                value={form.lucroSesantePct}
                onChange={(_, v) => setForm(f => ({ ...f, lucroSesantePct: v as number }))}
                min={0}
                max={20}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' },
                ]}
                sx={{ color: '#FACC15' }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={calculate}
              disabled={!isFormValid}
              startIcon={<Calculate />}
              sx={{
                bgcolor: '#FACC15',
                color: '#0A0A0A',
                '&:hover': { bgcolor: '#EAB308' },
                '&.Mui-disabled': { bgcolor: '#F3F4F6', color: '#9CA3AF' },
                borderRadius: 2,
                py: 1.5,
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
              }}
            >
              Calcular Prima
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* ── Resultado ── */}
      <Grid item xs={12} md={6}>
        {result ? (
          <Card sx={{ borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
                Resultado
              </Typography>

              {/* Desglose */}
              <Box sx={{ mb: 2 }}>
                {[
                  { label: 'Valor Comercial', value: parseNum(form.valorComercial) },
                  { label: 'Valor del Flete', value: parseNum(form.valorFlete) },
                  { label: 'Tributos y Aranceles', value: parseNum(form.valorTributos) },
                  ...(form.gastosAdicionalesPct > 0
                    ? [{ label: `Gastos Adicionales (${form.gastosAdicionalesPct}%)`, value: result.gastosAdicionales }]
                    : []),
                  ...(form.lucroSesantePct > 0
                    ? [{ label: `Lucro Cesante (${form.lucroSesantePct}%)`, value: result.lucroSesante }]
                    : []),
                ].map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {fmt(row.value)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Total Asegurado
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {fmt(result.totalAsegurado)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Prima calculada ({result.rate}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {fmt(result.prima)}
                  </Typography>
                </Box>

                {result.prima < result.minimum && (
                  <Alert severity="info" sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }}>
                    Se aplica prima mínima de <strong>{fmt(result.minimum)}</strong>
                  </Alert>
                )}
              </Box>

              {/* Valor final */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(250,204,21,0.14)',
                  border: 1, borderColor: 'rgba(250,204,21,0.55)',
                  mb: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Valor de la Póliza
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0A0A0A' }}>
                  {fmt(result.valorCobrar)}
                </Typography>
                <Chip
                  label={rateInfo().label}
                  size="small"
                  sx={{ mt: 1, bgcolor: '#FACC15', color: '#0A0A0A', fontWeight: 600 }}
                />
              </Box>

              {/* Mensaje */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Mensaje para el Cliente
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={copied ? <Check /> : <ContentCopy />}
                      onClick={handleCopy}
                      sx={{
                        color: copied ? '#16A34A' : 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                      }}
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                      onClick={handleSave}
                      disabled={saving || pdfLoading}
                      sx={{
                        fontWeight: 700, fontSize: '0.8rem', textTransform: 'none', boxShadow: 'none',
                        bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#EAB308', boxShadow: 'none' },
                      }}
                    >
                      {saving ? 'Guardando...' : savedId ? 'Actualizar' : 'Guardar'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={
                        pdfLoading ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdf />
                      }
                      onClick={handleDownloadPdf}
                      disabled={saving || pdfLoading}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        borderColor: '#FACC15',
                        color: '#0A0A0A',
                        '&:hover': { borderColor: '#EAB308', bgcolor: 'rgba(250,204,21,0.14)' },
                      }}
                    >
                      {pdfLoading ? (savedId ? 'Generando...' : 'Guardando y generando...') : 'Descargar PDF'}
                    </Button>
                  </Box>
                </Box>
                {pdfError && (
                  <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setPdfError('')}>
                    {pdfError}
                  </Alert>
                )}
                {saveError && (
                  <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setSaveError('')}>
                    {saveError}
                  </Alert>
                )}
                {savedNumber && (
                  <Alert
                    severity="success"
                    sx={{ mb: 1.5 }}
                    action={
                      <Button size="small" startIcon={<ListAlt />} onClick={() => router.push('/dashboard/cotizaciones/seguros')} sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Ver listado
                      </Button>
                    }
                  >
                    Guardada como <strong>{savedNumber}</strong>. Queda en el listado para darle seguimiento.
                  </Alert>
                )}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: 1, borderColor: 'divider',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', color: 'text.primary', fontSize: '0.8rem', lineHeight: 1.75 }}
                  >
                    {generateMessage()}
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card
            sx={{
              borderRadius: 3,
              border: '2px dashed', borderColor: 'divider',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 420,
            }}
          >
            <Box sx={{ textAlign: 'center', color: 'text.secondary', px: 4 }}>
              <Calculate sx={{ fontSize: 56, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Ingresa los datos y presiona Calcular
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75 }}>
                El resultado y el mensaje para el cliente aparecerán aquí.
              </Typography>
            </Box>
          </Card>
        )}
      </Grid>
    </Grid>
  )
}
