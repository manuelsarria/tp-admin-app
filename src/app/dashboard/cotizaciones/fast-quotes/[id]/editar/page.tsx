import { Box, Typography } from '@mui/material'
import { Edit } from '@mui/icons-material'
import { prisma } from '@/lib/prisma'
import { FastQuoteForm } from '@/components/cotizaciones/FastQuoteForm'
import { notFound } from 'next/navigation'

export default async function EditarFastQuotePage({ params }: { params: { id: string } }) {
  const quote = await prisma.fastQuote.findUnique({ where: { id: params.id } })
  if (!quote) notFound()

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Edit sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Editar Fast Quote — {quote.quoteNumber}
          </Typography>
        </Box>
      </Box>
      <FastQuoteForm id={params.id} initial={quote} />
    </Box>
  )
}
