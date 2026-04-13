'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress,
  LinearProgress, IconButton, TextField, Tooltip, Alert,
} from '@mui/material'
import {
  AssignmentTurnedIn, CheckCircle, RadioButtonUnchecked, PlayCircleOutline,
  ArrowBack, ExpandMore, ExpandLess,
} from '@mui/icons-material'

const STEP_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:     { label: 'Pendiente',   color: '#6B7280', bg: '#F9FAFB', icon: RadioButtonUnchecked },
  IN_PROGRESS: { label: 'En Progreso', color: '#3B82F6', bg: '#EFF6FF', icon: PlayCircleOutline },
  COMPLETED:   { label: 'Completado',  color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle },
}

const STATUS_ORDER = ['PENDING', 'IN_PROGRESS', 'COMPLETED']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ChecklistDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [checklist, setChecklist] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const res = await fetch(`/api/import-checklists/${id}`)
      if (!res.ok) { router.push('/dashboard/checklist-importacion'); return }
      const data = await res.json()
      setChecklist(data)
      const notes: Record<string, string> = {}
      data.steps?.forEach((s: any) => { notes[s.id] = s.notes || '' })
      setStepNotes(notes)
    } catch { router.push('/dashboard/checklist-importacion') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const updateStep = async (stepId: string, data: any) => {
    setUpdating(stepId)
    try {
      await fetch(`/api/import-checklists/${id}/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      await loadData()
    } catch { /* ignore */ }
    finally { setUpdating(null) }
  }

  const cycleStatus = (step: any) => {
    const currentIdx = STATUS_ORDER.indexOf(step.status)
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length]
    updateStep(step.id, { status: nextStatus })
  }

  const saveNotes = (stepId: string) => {
    updateStep(stepId, { notes: stepNotes[stepId] || '' })
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
  }

  if (!checklist) return null

  const steps = checklist.steps || []
  const done = steps.filter((s: any) => s.status === 'COMPLETED').length
  const inProgress = steps.filter((s: any) => s.status === 'IN_PROGRESS').length
  const total = steps.length
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/dashboard/checklist-importacion')}
          sx={{ mb: 2, textTransform: 'none', color: '#6B7280' }}>
          Volver
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <AssignmentTurnedIn sx={{ color: '#FACC15', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>{checklist.title}</Typography>
          <Chip label={checklist.status === 'COMPLETED' ? 'Completado' : checklist.status === 'CANCELLED' ? 'Cancelado' : 'Activo'}
            size="small"
            sx={{ fontWeight: 600, fontSize: '0.72rem',
              bgcolor: checklist.status === 'COMPLETED' ? '#F0FDF4' : checklist.status === 'CANCELLED' ? '#F9FAFB' : '#EFF6FF',
              color: checklist.status === 'COMPLETED' ? '#16A34A' : checklist.status === 'CANCELLED' ? '#6B7280' : '#3B82F6',
            }} />
        </Box>
        {checklist.productType && (
          <Typography variant="body2" sx={{ color: '#6B7280' }}>Tipo: {checklist.productType}</Typography>
        )}
      </Box>

      {/* Progress */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FAFAF9' }}>Progreso General</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: pct === 100 ? '#16A34A' : '#3B82F6' }}>
              {done}/{total} pasos
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct}
            sx={{ height: 10, borderRadius: 5, bgcolor: '#E5E7EB',
              '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#16A34A' : '#3B82F6', borderRadius: 5 } }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>{done} completados</Typography>
            <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 600 }}>{inProgress} en progreso</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>{total - done - inProgress} pendientes</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Steps */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {steps.map((step: any, idx: number) => {
          const cfg = STEP_CONFIG[step.status] || STEP_CONFIG.PENDING
          const Icon = cfg.icon
          const isExpanded = expandedStep === step.id
          return (
            <Card key={step.id} sx={{
              borderRadius: 3, border: `1px solid ${step.status === 'COMPLETED' ? '#BBF7D0' : '#E5E7EB'}`,
              boxShadow: 'none', bgcolor: step.status === 'COMPLETED' ? '#F0FDF4' : 'white',
              transition: 'all 0.2s',
            }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Status icon - clickable to cycle */}
                  <Tooltip title={`Click para cambiar estado (${cfg.label})`}>
                    <IconButton size="small" onClick={() => cycleStatus(step)} disabled={updating === step.id}
                      sx={{ color: cfg.color, p: 0.5 }}>
                      {updating === step.id ? <CircularProgress size={22} sx={{ color: cfg.color }} /> : <Icon sx={{ fontSize: 26 }} />}
                    </IconButton>
                  </Tooltip>

                  {/* Step info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={step.order} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22, minWidth: 22, bgcolor: '#0A0A0A', color: '#374151' }} />
                      <Typography variant="body1" sx={{
                        fontWeight: 600, color: '#FAFAF9', fontSize: '0.9rem',
                        textDecoration: step.status === 'COMPLETED' ? 'line-through' : 'none',
                        opacity: step.status === 'COMPLETED' ? 0.7 : 1,
                      }}>
                        {step.name}
                      </Typography>
                    </Box>
                    {step.completedAt && (
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 500, ml: 4.5 }}>
                        Completado: {formatDate(step.completedAt)}
                      </Typography>
                    )}
                  </Box>

                  {/* Status chip */}
                  <Chip label={cfg.label} size="small"
                    sx={{ fontWeight: 600, fontSize: '0.68rem', bgcolor: cfg.bg, color: cfg.color }} />

                  {/* Expand notes */}
                  <IconButton size="small" onClick={() => setExpandedStep(isExpanded ? null : step.id)}>
                    {isExpanded ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Box>

                {/* Expanded notes */}
                {isExpanded && (
                  <Box sx={{ mt: 2, ml: 5 }}>
                    <TextField
                      size="small" fullWidth multiline rows={2}
                      label="Notas"
                      placeholder="Agrega notas sobre este paso..."
                      value={stepNotes[step.id] || ''}
                      onChange={e => setStepNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                    />
                    <Button size="small" variant="outlined" onClick={() => saveNotes(step.id)}
                      sx={{ mt: 1, textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.75rem' }}>
                      Guardar notas
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}
