import { Box, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { prisma } from '@/lib/prisma'
import { QuoteForm } from '@/components/cotizaciones/QuoteForm'
import { notFound } from 'next/navigation'

export default async function EditarQuotePage({ params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({ where: { id: params.id } })
  if (!quote) notFound()

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Edit sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
            Editar Cotización — {quote.quoteNumber}
          </Typography>
        </Box>
      </Box>
      <QuoteForm initial={quote} />
    </Box>
  )
}
