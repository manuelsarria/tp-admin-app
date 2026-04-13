'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, LinearProgress,
  IconButton, Tooltip,
} from '@mui/material'
import {
  AssignmentTurnedIn, Add, CheckCircle, HourglassEmpty, Cancel, Delete,
  ArrowForward,
} from '@mui/icons-material'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: 'Activo',     color: '#3B82F6', bg: '#EFF6FF' },
  COMPLETED: { label: 'Completado', color: '#16A34A', bg: '#F0FDF4' },
  CANCELLED: { label: 'Cancelado',  color: '#6B7280', bg: '#F9FAFB' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ChecklistImportacionPage() {
  const router = useRouter()
  const [checklists, setChecklists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/import-checklists')
      .then(r => r.json())
      .then(data => setChecklists(Array.isArray(data) ? data : []))
      .catch(() => setChecklists([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (c: any) => {
    if (!confirm(`¿Eliminar checklist "${c.title}"?`)) return
    await fetch(`/api/import-checklists/${c.id}`, { method: 'DELETE' })
    setChecklists(prev => prev.filter(x => x.id !== c.id))
  }

  const active = checklists.filter(c => c.status === 'ACTIVE').length
  const completed = checklists.filter(c => c.status === 'COMPLETED').length

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <AssignmentTurnedIn sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>Checklist de Importacion</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Lista de pasos para cada importacion desde China. Marca tu avance y no olvides nada.
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Activos', count: active, icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Completados', count: completed, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: '#16A34A', bg: '#F0FDF4' },
        ].map(s => (
          <Card key={s.label} sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: s.bg }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: s.color }}>
                {s.icon}
                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.count}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* New button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => router.push('/dashboard/checklist-importacion/nuevo')}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
          Nuevo Checklist
        </Button>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : checklists.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <AssignmentTurnedIn sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>No hay checklists</Typography>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Titulo', 'Tipo Producto', 'Progreso', 'Estado', 'Fecha', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {checklists.map(c => {
                const steps = c.steps || []
                const done = steps.filter((s: any) => s.status === 'COMPLETED').length
                const total = steps.length
                const pct = total > 0 ? (done / total) * 100 : 0
                const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.ACTIVE
                return (
                  <TableRow key={c.id} sx={{ '&:hover': { bgcolor: 'rgba(10, 10, 10, 0.05)' }, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/checklist-importacion/${c.id}`)}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.title}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#6B7280' }}>{c.productType || '—'}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={pct}
                          sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': { bgcolor: pct === 100 ? '#16A34A' : '#3B82F6', borderRadius: 3 } }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                          {done}/{total}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem', bgcolor: sc.bg, color: sc.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{formatDate(c.createdAt)}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => router.push(`/dashboard/checklist-importacion/${c.id}`)}>
                            <ArrowForward sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => handleDelete(c)} sx={{ color: '#DC2626' }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}
