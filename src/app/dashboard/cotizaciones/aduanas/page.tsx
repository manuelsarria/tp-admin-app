import { Box, Typography } from '@mui/material'
import { Gavel } from '@mui/icons-material'
import { CotizadorAduanas } from '@/components/cotizaciones/CotizadorAduanas'

export default function AduanasPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Gavel sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Cotizador de Honorarios Aduaneros
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Calcula los honorarios del trámite aduanero con la tabla de Aduanas Lasso y genera la cotización para el cliente.
        </Typography>
      </Box>

      <CotizadorAduanas />
    </Box>
  )
}
