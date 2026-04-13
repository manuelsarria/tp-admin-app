'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'

interface LclContainerData {
  id: string
  containerNumber?: string | null
  seal?: string | null
  vessel?: string | null
  voyage?: string | null
  portOfLoading: string
  portOfDischarge: string
  etd?: string | null
  eta?: string | null
  closingDate?: string | null
  notes?: string | null
}

interface Props {
  id?: string
  initial?: LclContainerData
}

const toInputDate = (v: string | null | undefined) => {
  if (!v) return ''
  const d = new Date(v)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function LclContainerForm({ id, initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    containerNumber: '',
    seal: '',
    vessel: '',
    voyage: '',
    portOfLoading: 'QINGDAO',
    portOfDischarge: 'BALBOA',
    etd: '',
    eta: '',
    closingDate: '',
    notes: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        containerNumber: initial.containerNumber || '',
        seal: initial.seal || '',
        vessel: initial.vessel || '',
        voyage: initial.voyage || '',
        portOfLoading: initial.portOfLoading || 'QINGDAO',
        portOfDischarge: initial.portOfDischarge || 'BALBOA',
        etd: toInputDate(initial.etd),
        eta: toInputDate(initial.eta),
        closingDate: toInputDate(initial.closingDate),
        notes: initial.notes || '',
      })
    }
  }, [initial])

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = id ? `/api/lcl-containers/${id}` : '/api/lcl-containers'
      const method = id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerNumber: form.containerNumber || null,
          seal: form.seal || null,
          vessel: form.vessel || null,
          voyage: form.voyage || null,
          portOfLoading: form.portOfLoading,
          portOfDischarge: form.portOfDischarge,
          etd: form.etd || null,
          eta: form.eta || null,
          closingDate: form.closingDate || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }
      router.push('/dashboard/freight/lcl/containers')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} variant="outlined" size="small">
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {id ? 'Editar Contenedor LCL' : 'Nuevo Contenedor LCL'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, bgcolor: '#fff' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              El MBL# se genera automáticamente al crear el contenedor.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Container #"
              fullWidth
              size="small"
              value={form.containerNumber}
              onChange={e => set('containerNumber', e.target.value)}
              helperText="Ej: TCKU1234567"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Seal #"
              fullWidth
              size="small"
              value={form.seal}
              onChange={e => set('seal', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Vessel"
              fullWidth
              size="small"
              value={form.vessel}
              onChange={e => set('vessel', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Voyage"
              fullWidth
              size="small"
              value={form.voyage}
              onChange={e => set('voyage', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Port of Loading"
              fullWidth
              size="small"
              value={form.portOfLoading}
              onChange={e => set('portOfLoading', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Port of Discharge"
              fullWidth
              size="small"
              value={form.portOfDischarge}
              onChange={e => set('portOfDischarge', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="ETD (Fecha Salida)"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.etd}
              onChange={e => set('etd', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="ETA (Fecha Llegada)"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.eta}
              onChange={e => set('eta', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Closing Date"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.closingDate}
              onChange={e => set('closingDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notas"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={saving}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, px: 4 }}
        >
          {saving ? 'Guardando...' : id ? 'Actualizar Contenedor' : 'Crear Contenedor LCL'}
        </Button>
      </Box>
    </Box>
  )
}
