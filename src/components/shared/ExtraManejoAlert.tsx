'use client'

import { useState, useEffect } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import { Warning } from '@mui/icons-material'

interface Props {
  clienteNombre: string
}

interface Pendiente {
  motivo: string
  monto: number
  createdAt: string
}

export function ExtraManejoAlert({ clienteNombre }: Props) {
  const [pendientes, setPendientes] = useState<Pendiente[]>([])

  useEffect(() => {
    if (!clienteNombre || clienteNombre.length < 2) {
      setPendientes([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/extra-manejos/check?cliente=${encodeURIComponent(clienteNombre)}`)
        .then(r => r.json())
        .then(data => setPendientes(data.pendientes || []))
        .catch(() => setPendientes([]))
    }, 500)
    return () => clearTimeout(t)
  }, [clienteNombre])

  if (pendientes.length === 0) return null

  return (
    <Alert severity="warning" icon={<Warning />} sx={{ mb: 2, borderRadius: 2, border: '1px solid #F59E0B' }}>
      {pendientes.map((p, i) => (
        <Box key={i}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Este cliente tiene un extra manejo pendiente: {p.motivo} — ${p.monto.toFixed(2)} — registrado el{' '}
            {new Date(p.createdAt).toLocaleDateString('es-ES')}
          </Typography>
        </Box>
      ))}
    </Alert>
  )
}
