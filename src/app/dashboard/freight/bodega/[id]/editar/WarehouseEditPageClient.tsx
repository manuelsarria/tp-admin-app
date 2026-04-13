'use client'

import { useState, useEffect } from 'react'
import { Box, CircularProgress, Alert } from '@mui/material'
import { WarehouseForm } from '@/components/freight/WarehouseForm'

interface Props {
  id: string
}

export function WarehouseEditPageClient({ id }: Props) {
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/warehouse/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('No encontrado')
        return res.json()
      })
      .then(setEntry)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress sx={{ color: '#FACC15' }} />
      </Box>
    )
  }

  if (error || !entry) {
    return <Alert severity="error">{error || 'Entrada no encontrada'}</Alert>
  }

  return <WarehouseForm id={id} initial={entry} />
}
