'use client'

import { useState, useEffect } from 'react'
import { CircularProgress, Box, Alert } from '@mui/material'
import { LclBookingForm } from '@/components/freight/LclBookingForm'

export function EditarBookingClient({ id }: { id: string }) {
  const [initial, setInitial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/lcl-bookings/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => setInitial(data))
      .catch(() => setError('No se pudo cargar el booking'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return <LclBookingForm id={id} initial={initial} />
}
