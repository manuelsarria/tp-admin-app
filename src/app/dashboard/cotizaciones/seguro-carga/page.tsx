import { Box, Typography } from '@mui/material'
import { Policy } from '@mui/icons-material'
import { CotizadorSeguroCarga } from '@/components/cotizaciones/CotizadorSeguroCarga'

export default function SeguroCargaPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Policy sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Cotizador de Seguro de Carga
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Calcula la prima del seguro y genera el mensaje de cotización para enviarle al cliente.
        </Typography>
      </Box>

      <CotizadorSeguroCarga />
    </Box>
  )
}
