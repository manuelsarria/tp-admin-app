'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid,
  IconButton, Alert, Chip,
} from '@mui/material'
import { AssignmentTurnedIn, Add, Delete, ArrowUpward, ArrowDownward, Save } from '@mui/icons-material'

const DEFAULT_STEPS = [
  'Cotizacion',
  'Orden de Compra',
  'Pago',
  'Produccion',
  'Control de Calidad (QC)',
  'Embarque',
  'Aduana',
  'Entrega',
]

export default function NuevoChecklistPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [productType, setProductType] = useState('')
  const [steps, setSteps] = useState(DEFAULT_STEPS.map((name, i) => ({ name, order: i + 1 })))
  const [newStep, setNewStep] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addStep = () => {
    if (!newStep.trim()) return
    setSteps(prev => [...prev, { name: newStep.trim(), order: prev.length + 1 }])
    setNewStep('')
  }

  const removeStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 })))
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= steps.length) return
    setSteps(prev => {
      const arr = [...prev]
      const tmp = arr[idx]
      arr[idx] = arr[newIdx]
      arr[newIdx] = tmp
      return arr.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Titulo es requerido'); return }
    if (steps.length === 0) { setError('Debe tener al menos un paso'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/import-checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), productType: productType.trim() || null, steps }),
      })
      if (!res.ok) { const e = await res.json(); setError(e.error || 'Error'); return }
      const data = await res.json()
      router.push(`/dashboard/checklist-importacion/${data.id}`)
    } catch { setError('Error de conexion') }
    finally { setSaving(false) }
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <AssignmentTurnedIn sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Nuevo Checklist de Importacion</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>Informacion</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField label="Titulo del Checklist *" value={title} onChange={e => setTitle(e.target.value)} fullWidth size="small"
                    placeholder="Ej: Importacion electronica Q1 2026" />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Tipo de Producto (opcional)" value={productType} onChange={e => setProductType(e.target.value)} fullWidth size="small"
                    placeholder="Ej: Electronica, Textil, Alimentos..." />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="contained" fullWidth disabled={saving} startIcon={<Save />} onClick={handleSubmit}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1.25 }}>
              {saving ? 'Creando...' : 'Crear Checklist'}
            </Button>
            <Button variant="outlined" fullWidth onClick={() => router.push('/dashboard/checklist-importacion')}
              sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none', color: '#6B7280', borderColor: '#E5E7EB' }}>
              Cancelar
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                Pasos ({steps.length})
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {steps.map((step, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2,
                    bgcolor: '#F8FAFC', border: '1px solid #E5E7EB',
                  }}>
                    <Chip label={step.order} size="small" sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: '#FACC15', color: 'white', minWidth: 28 }} />
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, fontSize: '0.85rem' }}>{step.name}</Typography>
                    <IconButton size="small" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                      <ArrowUpward sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}>
                      <ArrowDownward sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeStep(idx)} sx={{ color: '#DC2626' }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>

              {/* Add custom step */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField size="small" placeholder="Agregar paso personalizado..." value={newStep}
                  onChange={e => setNewStep(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
                  sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<Add />} onClick={addStep}
                  sx={{ borderColor: '#FACC15', color: '#FACC15', textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                  Agregar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
