import { Box, Typography } from '@mui/material'
import { BoltOutlined } from '@mui/icons-material'
import { FastQuoteList } from '@/components/cotizaciones/FastQuoteList'

export default function FastQuotesPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <BoltOutlined sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Fast Quotes en Progreso
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Cotizaciones rápidas de casillero — marítimo y aéreo.
        </Typography>
      </Box>

      <FastQuoteList />
    </Box>
  )
}
