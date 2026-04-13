'use client'

import { useState } from 'react'
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
import { Calculate, ContentCopy, Check, Info } from '@mui/icons-material'

type ClientType = 'regular' | 'agente'

interface FormData {
  valorComercial: string
  valorFlete: string
  valorTributos: string
  gastosAdicionalesPct: number
  lucroSesantePct: number
  clienteType: ClientType
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
  })
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  const calculate = () => {
    const comercial = parseNum(form.valorComercial)
    const flete = parseNum(form.valorFlete)
    const tributos = parseNum(form.valorTributos)
    const base = comercial + flete + tributos
    const gastosAdicionales = base * form.gastosAdicionalesPct / 100
    const lucroSesante = base * form.lucroSesantePct / 100
    const totalAsegurado = base + gastosAdicionales + lucroSesante
    const rate = form.clienteType === 'regular' ? 0.55 : 0.25
    const minimum = form.clienteType === 'regular' ? 75 : 40
    const prima = totalAsegurado * rate / 100
    const valorCobrar = Math.max(prima, minimum)
    setResult({ base, gastosAdicionales, lucroSesante, totalAsegurado, prima, valorCobrar, rate, minimum })
  }

  const generateMessage = (): string => {
    if (!result) return ''
    const tipoCliente = form.clienteType === 'regular' ? 'Cliente Regular' : 'Agente de Carga'
    const tasa = form.clienteType === 'regular' ? '0.55%' : '0.25%'

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

  const isFormValid =
    parseNum(form.valorComercial) > 0 &&
    parseNum(form.valorFlete) > 0 &&
    parseNum(form.valorTributos) > 0

  return (
    <Grid container spacing={3}>
      {/* ── Formulario ── */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#FAFAF9' }}>
              Datos de la Carga
            </Typography>

            {/* Tipo de cliente */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: '#374151', fontWeight: 600 }}>
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
                    color: 'white',
                    '&:hover': { bgcolor: '#EAB308' },
                  },
                }}
              >
                <ToggleButton value="regular" sx={{ fontWeight: 600, borderRadius: '8px 0 0 8px' }}>
                  Cliente Regular
                </ToggleButton>
                <ToggleButton value="agente" sx={{ fontWeight: 600, borderRadius: '0 8px 8px 0' }}>
                  Agente de Carga
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                {form.clienteType === 'regular'
                  ? 'Tasa: 0.55% — Mínimo: $75.00'
                  : 'Tasa: 0.25% — Mínimo: $40.00'}
              </Typography>
            </Box>

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
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mr: 0.5 }}>
                  Gastos Adicionales: {form.gastosAdicionalesPct}%
                </Typography>
                <Tooltip
                  title="Todos los gastos en movilizar la carga sin incluir la factura de fletes y tributos. Ej: intermediación aduanera, medidas de seguridad, permisos."
                  arrow
                  placement="top"
                >
                  <IconButton size="small">
                    <Info sx={{ fontSize: 16, color: '#9CA3AF' }} />
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
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mr: 0.5 }}>
                  Lucro Cesante: {form.lucroSesantePct}%
                </Typography>
                <Tooltip
                  title="Pérdida de la utilidad esperada causada por un siniestro."
                  arrow
                  placement="top"
                >
                  <IconButton size="small">
                    <Info sx={{ fontSize: 16, color: '#9CA3AF' }} />
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
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#FAFAF9' }}>
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
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>{row.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                      {fmt(row.value)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
                    Total Asegurado
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
                    {fmt(result.totalAsegurado)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Prima calculada ({result.rate}%)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
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
                  bgcolor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  mb: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                  Valor de la Póliza
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#FACC15' }}>
                  {fmt(result.valorCobrar)}
                </Typography>
                <Chip
                  label={form.clienteType === 'regular' ? 'Cliente Regular' : 'Agente de Carga'}
                  size="small"
                  sx={{ mt: 1, bgcolor: '#FACC15', color: 'white', fontWeight: 600 }}
                />
              </Box>

              {/* Mensaje */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
                    Mensaje para el Cliente
                  </Typography>
                  <Button
                    size="small"
                    startIcon={copied ? <Check /> : <ContentCopy />}
                    onClick={handleCopy}
                    sx={{
                      color: copied ? '#16A34A' : '#6B7280',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      textTransform: 'none',
                    }}
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: '0.8rem', lineHeight: 1.75 }}
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
              border: '2px dashed #E5E7EB',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 420,
            }}
          >
            <Box sx={{ textAlign: 'center', color: '#9CA3AF', px: 4 }}>
              <Calculate sx={{ fontSize: 56, mb: 2, opacity: 0.3 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#6B7280' }}>
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
