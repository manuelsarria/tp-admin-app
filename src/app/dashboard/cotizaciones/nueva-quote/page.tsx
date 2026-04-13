import { Box, Typography } from '@mui/material'
import { RequestQuote } from '@mui/icons-material'
import { QuoteForm } from '@/components/cotizaciones/QuoteForm'

export default function NuevaQuotePage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <RequestQuote sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
            Nueva Cotización Logística
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Completa los datos del embarque, agrega las líneas de servicio y genera el PDF profesional para el cliente.
        </Typography>
      </Box>

      <QuoteForm />
    </Box>
  )
}
