import { Box, Typography } from '@mui/material'
import { FlashOn } from '@mui/icons-material'
import { FastQuoteForm } from '@/components/cotizaciones/FastQuoteForm'

export default function NuevaFastQuotePage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <FlashOn sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
            Nueva Fast Quote
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Cotización rápida de casillero. Completa los datos y genera el PDF en segundos.
        </Typography>
      </Box>

      <FastQuoteForm />
    </Box>
  )
}
