'use client'

// Aviso de movimientos sin clasificar. Si no hay ninguno no pinta nada: un
// estado vacío aquí sería ruido permanente en una pantalla que ya está llena.

import { useCallback, useEffect, useState } from 'react'
import { Alert, Button } from '@mui/material'
import { formatMoney } from '@/lib/finance'
import type { Entry } from './types'
import ClasificarDialog from './ClasificarDialog'

export default function PendientesAlert({
  year,
  onChanged,
}: {
  /** Si viene, solo cuenta los pendientes de ese año. */
  year?: number
  onChanged?: () => void
}) {
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(() => {
    const qs = year !== undefined ? `?year=${year}` : ''
    fetch(`/api/finanzas/entries/pending${qs}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { count?: number; data?: Entry[] } | null) => {
        if (!d) { setCount(0); setTotal(0); return }
        setCount(d.count ?? 0)
        setTotal((d.data || []).reduce((s, e) => s + Math.abs(e.amount || 0), 0))
      })
      .catch(() => { setCount(0); setTotal(0) })
  }, [year])

  useEffect(() => { load() }, [load])

  if (count === 0) return null

  return (
    <>
      <Alert
        severity="warning"
        sx={{ borderRadius: 2, alignItems: 'center', '& .MuiAlert-message': { fontWeight: 500 } }}
        action={
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{
              textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap',
              bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' },
            }}
          >
            Clasificar
          </Button>
        }
      >
        <strong>{count}</strong> movimiento{count === 1 ? '' : 's'} sin clasificar ({formatMoney(total)} en total).
        {' '}Están contados como Negocio; revísalos para que los totales sean fiables.
      </Alert>

      <ClasificarDialog
        open={open}
        year={year}
        onClose={() => setOpen(false)}
        onSaved={() => { load(); onChanged?.() }}
      />
    </>
  )
}
