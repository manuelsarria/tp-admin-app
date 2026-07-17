'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Grid, Typography, Chip, Button, IconButton, Tooltip,
  LinearProgress, Alert,
} from '@mui/material'
import { Add, Edit, Delete, Visibility, AutoAwesome } from '@mui/icons-material'
import { formatMoney } from '@/lib/finance'
import OperacionFormDialog from './OperacionFormDialog'
import OperacionDetailDialog from './OperacionDetailDialog'
import AsistenteOperacionesDialog from './AsistenteOperacionesDialog'

// ---------------------------------------------------------------------------
// Local types (types.ts is being edited by other agents — keep ours here).
// ---------------------------------------------------------------------------

export type OperationStatus = 'ABIERTA' | 'CERRADA'

export interface OperationEntry {
  id: string
  date?: string | null
  type?: string | null
  category?: string | null
  subcategory?: string | null
  description?: string | null
  reference?: string | null
  counterparty?: string | null
  unit?: string | null
  amount?: number | null
}

export interface Operation {
  id: string
  name: string
  containerNumber?: string | null
  unit?: string | null
  status?: OperationStatus | null
  eta?: string | null
  startDate?: string | null
  closedAt?: string | null
  notes?: string | null
  entries?: OperationEntry[] | null
  // derived (server-side)
  invertido?: number | null
  ingresado?: number | null
  ganancia?: number | null
  margen?: number | null // fraction 0..1, can be negative
  movimientos?: number | null
}

export const OPERATION_STATUS_LABEL: Record<OperationStatus, string> = {
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ABIERTA: { bg: '#FFFBEB', color: '#B45309' },
  CERRADA: { bg: '#ECFDF5', color: '#047857' },
}

export const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export const gainColor = (g: number) => (g > 0 ? '#047857' : g < 0 ? '#B91C1C' : '#0A0A0A')

export const formatDate = (v?: string | null): string => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10)
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

export const formatPct = (m?: number | null): string => {
  if (typeof m !== 'number' || !Number.isFinite(m)) return '—'
  return `${(m * 100).toFixed(1)}%`
}

// ---------------------------------------------------------------------------

export default function OperacionesTab({ onChanged }: { onChanged?: () => void }) {
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Operation | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [asistenteOpen, setAsistenteOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/finanzas/operations')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar las operaciones'))))
      .then(d => {
        const list: Operation[] = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []
        setOperations(list)
        setError(null)
      })
      .catch(e => { setOperations([]); setError(e?.message || 'Error al cargar las operaciones') })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = () => { load(); onChanged?.() }

  const handleDelete = async (op: Operation) => {
    if (!window.confirm(`¿Borrar la operación "${op.name}"? Los movimientos NO se borran, solo se desvinculan.`)) return
    try {
      const res = await fetch(`/api/finanzas/operations/${op.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'No se pudo borrar la operación')
      }
      refresh()
    } catch (e: any) {
      setError(e?.message || 'No se pudo borrar la operación')
    }
  }

  const totalInvertido = operations.reduce((s, o) => s + num(o.invertido), 0)
  const totalIngresado = operations.reduce((s, o) => s + num(o.ingresado), 0)
  const totalGanancia = operations.reduce((s, o) => s + num(o.ganancia), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header totals */}
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Total invertido</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, fontFamily: '"Poppins", sans-serif', color: '#0A0A0A' }}>
                {formatMoney(totalInvertido)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A8A29E' }}>
                {operations.length} operaci{operations.length !== 1 ? 'ones' : 'ón'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Total ingresado</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, fontFamily: '"Poppins", sans-serif', color: '#0A0A0A' }}>
                {formatMoney(totalIngresado)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Ganancia total</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, fontFamily: '"Poppins", sans-serif', color: gainColor(totalGanancia) }}>
                {formatMoney(totalGanancia)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A8A29E' }}>
                {totalIngresado > 0 ? `Margen ${formatPct(totalGanancia / totalIngresado)}` : 'Sin ingresos aún'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<AutoAwesome />}
              onClick={() => setAsistenteOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#FDE047' } }}>
              Asistente
            </Button>
            <Button variant="contained" startIcon={<Add />}
              onClick={() => { setEditing(null); setFormOpen(true) }}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
              Nueva operación
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && <LinearProgress />}
      {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {!loading && operations.length === 0 && !error && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" sx={{ color: '#78716C', mb: 2 }}>
              Aún no hay operaciones. Usa el <strong>Asistente</strong> para agrupar los movimientos
              existentes por contenedor y confirmar cada agrupación.
            </Typography>
            <Button variant="contained" startIcon={<AutoAwesome />} onClick={() => setAsistenteOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#FDE047' } }}>
              Abrir asistente
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {operations.map(op => {
          const status = (op.status || 'ABIERTA') as OperationStatus
          const c = STATUS_COLORS[status] || STATUS_COLORS.ABIERTA
          const invertido = num(op.invertido)
          const ingresado = num(op.ingresado)
          const ganancia = num(op.ganancia)
          const base = Math.max(invertido, ingresado)
          const pct = base > 0 ? Math.min(Math.max((invertido / base) * 100, 0), 100) : 0
          const movimientos = num(op.movimientos) || (Array.isArray(op.entries) ? op.entries.length : 0)
          return (
            <Grid item xs={12} md={6} key={op.id}>
              <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Title row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }} noWrap>
                        {op.name || 'Sin nombre'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#78716C' }}>
                        {[op.containerNumber ? `Contenedor ${op.containerNumber}` : null, op.unit].filter(Boolean).join(' · ') || 'Sin contenedor'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {op.containerNumber && (
                        <Chip label={op.containerNumber} size="small"
                          sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: '#FEFCE8', color: '#854D0E' }} />
                      )}
                      <Chip label={OPERATION_STATUS_LABEL[status] || status} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: c.bg, color: c.color }} />
                    </Box>
                  </Box>

                  {/* Numbers — Ganancia dominant */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Ganancia</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.1, fontFamily: '"Poppins", sans-serif', color: gainColor(ganancia) }}>
                        {formatMoney(ganancia)}
                      </Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Invertido</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>{formatMoney(invertido)}</Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Ingresado</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>{formatMoney(ingresado)}</Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Margen</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatPct(op.margen)}</Typography>
                    </Box>
                  </Box>

                  {/* Bar: invertido vs ingresado */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>
                        {movimientos} movimiento{movimientos !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        Invertido {Math.round(pct)}% de lo ingresado
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#D1FAE5', '& .MuiLinearProgress-bar': { bgcolor: '#FACC15', borderRadius: 4 } }} />
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    <Button size="small" variant="outlined" startIcon={<Visibility />}
                      onClick={() => { setDetailId(op.id); setDetailOpen(true) }}
                      sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A', borderColor: 'rgba(10,10,10,0.2)' }}>
                      Ver detalle
                    </Button>
                    <Box sx={{ ml: 'auto' }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => { setEditing(op); setFormOpen(true) }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton size="small" onClick={() => handleDelete(op)}>
                          <Delete fontSize="small" sx={{ color: '#B91C1C' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <OperacionFormDialog open={formOpen} operation={editing}
        onClose={() => setFormOpen(false)} onSaved={refresh} />

      <OperacionDetailDialog open={detailOpen} operationId={detailId}
        onClose={() => setDetailOpen(false)} onChanged={refresh} />

      <AsistenteOperacionesDialog open={asistenteOpen}
        onClose={() => setAsistenteOpen(false)} onCreated={refresh} />
    </Box>
  )
}
