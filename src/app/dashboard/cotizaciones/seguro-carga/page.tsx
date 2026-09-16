import { Suspense } from 'react'
import Link from 'next/link'
import { Box, Typography, Button } from '@mui/material'
import { Policy, ListAlt } from '@mui/icons-material'
import { CotizadorSeguroCarga } from '@/components/cotizaciones/CotizadorSeguroCarga'

export default function SeguroCargaPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Policy sx={{ color: '#FACC15', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0A0A0A' }}>
              Cotizador de Seguro de Carga
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Calcula la prima del seguro, guarda la cotización y genera el mensaje o el PDF para el cliente.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/dashboard/cotizaciones/seguros"
          startIcon={<ListAlt />}
          sx={{ textTransform: 'none', fontWeight: 700, color: '#0A0A0A', border: '1px solid #E5E7EB', borderRadius: '10px', px: 2, py: 1 }}
        >
          Ver cotizaciones guardadas
        </Button>
      </Box>

      {/* El cotizador lee ?id= para editar una cotización ya guardada, y
          useSearchParams necesita su propio límite de Suspense. */}
      <Suspense fallback={null}>
        <CotizadorSeguroCarga />
      </Suspense>
    </Box>
  )
}
