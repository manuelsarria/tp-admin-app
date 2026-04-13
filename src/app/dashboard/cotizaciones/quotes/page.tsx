import { Box, Typography } from '@mui/material'
import { FolderOpen } from '@mui/icons-material'
import { QuoteList } from '@/components/cotizaciones/QuoteList'

export default function QuotesPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <FolderOpen sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Quotes en Progreso
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Seguimiento de cotizaciones logísticas — estado, descarga de PDF y gestión de aprobación.
        </Typography>
      </Box>

      <QuoteList />
    </Box>
  )
}
