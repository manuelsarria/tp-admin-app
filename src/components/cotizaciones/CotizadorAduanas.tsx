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
  InputAdornment,
  Grid,
  Switch,
  Paper,
  Chip,
} from '@mui/material'
import { Calculate, ContentCopy, Check, Gavel } from '@mui/icons-material'

// ── Gastos adicionales opcionales ────────────────────────────────────────────
const GASTOS_OPCIONALES = [
  { id: 'cuarentena',   label: 'Permiso Cuarentena',           value: 25 },
  { id: 'miAmbiente',   label: 'Permiso Mi Ambiente',           value: 30 },
  { id: 'bomberos',     label: 'Trámite Bomberos',              value: 15 },
  { id: 'aupsa',        label: 'Notificaciones de AUPSA',       value: 10 },
  { id: 'exoneracion',  label: 'Trámite Exoneración',           value: 50 },
  { id: 'farmacias',    label: 'Farmacias y Drogas',            value: 50 },
  { id: 'normasOrigen', label: 'Trámite Normas de Origen',      value: 25 },
  { id: 'valoracion',   label: 'Trámite de Valoración',         value: 50 },
]

// ── Fórmula confección de liquidación (tabla Lasso) ───────────────────────────
function calcConfeccion(cif: number): number {
  if (cif <= 10000) return 110
  if (cif <= 25000) return cif * 0.003 + 110
  return cif * 0.005 + 110
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const parseNum = (v: string) => parseFloat(v) || 0

interface ResultData {
  confeccion: number
  lineasExtras: number
  manejoCNC: number
  fotocopias: number
  formularios: number
  gastosItems: { label: string; value: number }[]
  gastosTotal: number
  subtotalAduanero: number
  honorariosCNC: number
  totalCotizacion: number
}

export function CotizadorAduanas() {
  const [valorCIF, setValorCIF]                 = useState('')
  const [totalLineas, setTotalLineas]           = useState('')
  const [esCasillero, setEsCasillero]           = useState(false)
  const [numFormularios, setNumFormularios]     = useState('1')
  const [includeFotocopias, setIncludeFotocopias] = useState(false)
  const [gastosCheck, setGastosCheck]           = useState<string[]>([])
  const [honorariosCNC, setHonorariosCNC]       = useState('')
  const [result, setResult]                     = useState<ResultData | null>(null)
  const [copied, setCopied]                     = useState(false)

  const toggleGasto = (id: string) =>
    setGastosCheck(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  const calculate = () => {
    const cif        = parseNum(valorCIF)
    const lineas     = Math.max(1, parseInt(totalLineas) || 1)
    const formularios = Math.max(0, parseInt(numFormularios) || 0)
    const honorarios = parseNum(honorariosCNC)

    const confeccion    = calcConfeccion(cif)
    const lineasExtras  = Math.max(0, lineas - 1) * 3
    const manejoCNC     = esCasillero ? 50 : 0
    const fotocopias    = includeFotocopias ? 25 : 0
    const formTotal     = formularios * 8

    const gastosItems = GASTOS_OPCIONALES.filter(g => gastosCheck.includes(g.id))
    const gastosTotal = gastosItems.reduce((s, g) => s + g.value, 0)

    const subtotalAduanero = confeccion + lineasExtras + manejoCNC + fotocopias + formTotal + gastosTotal
    const totalCotizacion  = subtotalAduanero + honorarios

    setResult({
      confeccion, lineasExtras, manejoCNC, fotocopias,
      formularios: formTotal, gastosItems, gastosTotal,
      subtotalAduanero, honorariosCNC: honorarios, totalCotizacion,
    })
  }

  const generateMessage = (): string => {
    if (!result) return ''
    const lineas = parseInt(totalLineas) || 1
    const extras = lineas - 1

    const lines: string[] = [
      'Estimado/a Cliente,',
      '',
      'A continuación le presentamos la cotización de honorarios aduaneros para su trámite:',
      '',
      '📋 DESGLOSE DE HONORARIOS',
      `• Confección de liquidación (CIF ${fmt(parseNum(valorCIF))}): ${fmt(result.confeccion)}`,
    ]

    if (result.lineasExtras > 0)
      lines.push(`• Líneas extras (${extras} × $3.00): ${fmt(result.lineasExtras)}`)
    if (result.manejoCNC > 0)
      lines.push(`• Manejo Admin. y Consultoría (casillero): ${fmt(result.manejoCNC)}`)

    if (result.fotocopias > 0)
      lines.push(`• Fotocopias: ${fmt(result.fotocopias)}`)

    if (result.formularios > 0)
      lines.push(`• Formularios Aduanas (${numFormularios} × $8.00): ${fmt(result.formularios)}`)

    if (result.gastosItems.length > 0) {
      lines.push('', '📌 GASTOS ADICIONALES')
      result.gastosItems.forEach(g => lines.push(`• ${g.label}: ${fmt(g.value)}`))
    }

    lines.push(
      '',
      `Subtotal honorarios aduaneros: ${fmt(result.subtotalAduanero)}`,
      `Honorarios TP Logistics:       ${fmt(result.honorariosCNC)}`,
      '',
      `💰 TOTAL HONORARIOS: ${fmt(result.totalCotizacion)}`,
      '',
      '⚠️ Este valor corresponde únicamente a honorarios del trámite aduanero.',
      'Los impuestos, aranceles y demás tributos oficiales son adicionales y se',
      'determinan al momento de la liquidación.',
      '',
      'Para confirmar el servicio o consultar cualquier detalle, no dude en contactarnos.',
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

  const isValid = parseNum(valorCIF) > 0 && parseInt(totalLineas) > 0

  // Preview de confección mientras el usuario escribe
  const cifPreview = parseNum(valorCIF)
  const confeccionPreview = cifPreview > 0 ? `Vista previa: ${fmt(calcConfeccion(cifPreview))}` : '≤$10k → $110 | $10k-$25k → CIF×0.3%+$110 | >$25k → CIF×0.5%+$110'

  return (
    <Grid container spacing={3}>

      {/* ── Formulario ─────────────────────────────────────────────────────── */}
      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#FAFAF9' }}>
              Datos del Trámite
            </Typography>

            {/* Valor CIF */}
            <TextField
              label="Valor CIF *"
              fullWidth
              value={valorCIF}
              onChange={e => setValorCIF(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ mb: 2 }}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              helperText={confeccionPreview}
            />

            {/* Total líneas */}
            <TextField
              label="Total de líneas de la liquidación *"
              fullWidth
              value={totalLineas}
              onChange={e => setTotalLineas(e.target.value)}
              sx={{ mb: 2 }}
              type="number"
              inputProps={{ min: 1, step: 1 }}
              helperText={
                parseInt(totalLineas) > 1
                  ? `Líneas extras: ${parseInt(totalLineas) - 1} × $3.00 = ${fmt((parseInt(totalLineas) - 1) * 3)}`
                  : 'La 1ª línea está incluida. A partir de la 2ª se cobran $3.00 c/u.'
              }
            />

            {/* Número de formularios */}
            <TextField
              label="Número de formularios"
              fullWidth
              value={numFormularios}
              onChange={e => setNumFormularios(e.target.value)}
              sx={{ mb: 3 }}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              helperText={`$8.00 por formulario → Total: ${fmt((parseInt(numFormularios) || 0) * 8)}`}
            />

            {/* Casillero switch */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                border: `1px solid ${esCasillero ? '#FECACA' : '#E5E7EB'}`,
                mb: 2,
                bgcolor: esCasillero ? '#FEF2F2' : '#F9FAFB',
                transition: 'all 0.2s',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  Contenedor tipo Casillero
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  Agrega $50.00 de Manejo Admin. y Consultoría
                </Typography>
              </Box>
              <Switch
                checked={esCasillero}
                onChange={e => setEsCasillero(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#FACC15' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#FACC15' },
                }}
              />
            </Box>

            {/* Fotocopias switch */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                border: `1px solid ${includeFotocopias ? '#FECACA' : '#E5E7EB'}`,
                mb: 3,
                bgcolor: includeFotocopias ? '#FEF2F2' : '#F9FAFB',
                transition: 'all 0.2s',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  Fotocopias
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  Agrega $25.00 al total
                </Typography>
              </Box>
              <Switch
                checked={includeFotocopias}
                onChange={e => setIncludeFotocopias(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#FACC15' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#FACC15' },
                }}
              />
            </Box>

            {/* Gastos adicionales */}
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#FAFAF9', mb: 1.5 }}>
              Gastos Adicionales <Typography component="span" variant="caption" sx={{ color: '#9CA3AF', fontWeight: 400 }}>(seleccionar los que apliquen)</Typography>
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {GASTOS_OPCIONALES.map(gasto => {
                const selected = gastosCheck.includes(gasto.id)
                return (
                  <Chip
                    key={gasto.id}
                    label={`${gasto.label}  $${gasto.value}`}
                    onClick={() => toggleGasto(gasto.id)}
                    size="small"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      bgcolor: selected ? '#FACC15' : 'transparent',
                      color: selected ? 'white' : '#374151',
                      borderColor: selected ? '#FACC15' : '#D1D5DB',
                      border: '1px solid',
                      '&:hover': { bgcolor: selected ? '#EAB308' : '#F3F4F6' },
                    }}
                  />
                )
              })}
            </Box>

            {/* Honorarios CNC */}
            <TextField
              label="Honorarios TP Logistics"
              fullWidth
              value={honorariosCNC}
              onChange={e => setHonorariosCNC(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              sx={{ mb: 3 }}
              type="number"
              inputProps={{ min: 0, step: '0.01' }}
              helperText="Monto de CNC que se suma al total del aduanero para cotizar al cliente"
            />

            <Button
              variant="contained"
              fullWidth
              onClick={calculate}
              disabled={!isValid}
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
              Calcular Honorarios
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* ── Resultado ──────────────────────────────────────────────────────── */}
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
                  { label: 'Confección de liquidación', value: result.confeccion },
                  ...(result.lineasExtras > 0
                    ? [{ label: `Líneas extras (${parseInt(totalLineas) - 1} × $3.00)`, value: result.lineasExtras }]
                    : []),
                  ...(result.manejoCNC > 0
                    ? [{ label: 'Manejo Admin. y Consultoría', value: result.manejoCNC }]
                    : []),
                  ...(result.fotocopias > 0
                    ? [{ label: 'Fotocopias', value: result.fotocopias }]
                    : []),
                  ...(result.formularios > 0
                    ? [{ label: `Formularios (${numFormularios} × $8.00)`, value: result.formularios }]
                    : []),
                  ...result.gastosItems.map(g => ({ label: g.label, value: g.value })),
                ].map((row, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>{row.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                      {fmt(row.value)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>Subtotal aduanero</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#374151' }}>
                    {fmt(result.subtotalAduanero)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6 }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>Honorarios TP Logistics</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#FACC15' }}>
                    + {fmt(result.honorariosCNC)}
                  </Typography>
                </Box>
              </Box>

              {/* Total */}
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
                  Total Honorarios Aduaneros
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#FACC15' }}>
                  {fmt(result.totalCotizacion)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                  No incluye impuestos, aranceles ni tributos oficiales
                </Typography>
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
              <Gavel sx={{ fontSize: 56, mb: 2, opacity: 0.3 }} />
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
