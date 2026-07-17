'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, Alert, LinearProgress, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Card, CardContent,
} from '@mui/material'
import { LinkOff } from '@mui/icons-material'
import { formatMoney } from '@/lib/finance'
import type { Operation, OperationEntry, OperationStatus } from './OperacionesTab'
import { OPERATION_STATUS_LABEL, num, gainColor, formatDate, formatPct } from './OperacionesTab'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ABIERTA: { bg: '#FFFBEB', color: '#B45309' },
  CERRADA: { bg: '#ECFDF5', color: '#047857' },
}

const signed = (e: OperationEntry): number => {
  const a = num(e.amount)
  return e.type === 'EGRESO' ? -a : a
}

export default function OperacionDetailDialog({
  open, operationId, onClose, onChanged,
}: {
  open: boolean
  operationId: string | null
  onClose: () => void
  onChanged?: () => void
}) {
  const [op, setOp] = useState<Operation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!operationId) return
    setLoading(true)
    fetch(`/api/finanzas/operations/${operationId}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar la operación'))))
      .then(d => {
        const data: Operation | null = d?.data ?? d ?? null
        setOp(data && typeof data === 'object' && (data as any).id ? data : null)
        setError(null)
      })
      .catch(e => { setOp(null); setError(e?.message || 'Error al cargar la operación') })
      .finally(() => setLoading(false))
  }, [operationId])

  useEffect(() => { if (open) load() }, [open, load])

  const unlink = async (entryId: string) => {
    if (!operationId) return
    if (!window.confirm('¿Desvincular este movimiento de la operación? El movimiento no se borra del registro diario.')) return
    setBusy(entryId)
    try {
      const res = await fetch(`/api/finanzas/operations/${operationId}/entries`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryIds: [entryId] }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'No se pudo desvincular el movimiento')
      }
      load()
      onChanged?.()
    } catch (e: any) {
      setError(e?.message || 'No se pudo desvincular el movimiento')
    } finally {
      setBusy(null)
    }
  }

  const entries: OperationEntry[] = Array.isArray(op?.entries) ? (op!.entries as OperationEntry[]) : []
  const status = (op?.status || 'ABIERTA') as OperationStatus
  const c = STATUS_COLORS[status] || STATUS_COLORS.ABIERTA

  const invertido = num(op?.invertido)
  const ingresado = num(op?.ingresado)
  const ganancia = op && typeof op.ganancia === 'number' ? op.ganancia : ingresado - invertido

  let running = 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
        {op?.name || 'Detalle de la operación'}
      </DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {!loading && !op && !error && (
          <Typography variant="body2" sx={{ color: '#78716C', py: 4, textAlign: 'center' }}>
            No se encontró la operación.
          </Typography>
        )}

        {op && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Fields */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Field label="Contenedor" value={op.containerNumber || '—'} />
              <Field label="Unidad" value={op.unit || '—'} />
              <Box>
                <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600, display: 'block' }}>Estado</Typography>
                <Chip label={OPERATION_STATUS_LABEL[status] || status} size="small"
                  sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: c.bg, color: c.color, mt: 0.3 }} />
              </Box>
              <Field label="Inicio" value={formatDate(op.startDate)} />
              <Field label="ETA" value={formatDate(op.eta)} />
              {op.closedAt && <Field label="Cerrada" value={formatDate(op.closedAt)} />}
            </Box>
            {op.notes && (
              <Typography variant="body2" sx={{ color: '#57534E', fontStyle: 'italic' }}>{op.notes}</Typography>
            )}

            {/* P&L block */}
            <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)', boxShadow: 'none', bgcolor: '#FAFAF9' }}>
              <CardContent sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatPct(typeof op.margen === 'number' ? op.margen : ingresado > 0 ? ganancia / ingresado : null)}
                  </Typography>
                </Box>
                <Box sx={{ pb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Movimientos</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{num(op.movimientos) || entries.length}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Entries */}
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#78716C', letterSpacing: 0.4 }}>
              MOVIMIENTOS VINCULADOS
            </Typography>
            {entries.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#78716C' }}>
                Esta operación aún no tiene movimientos vinculados.
              </Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Referencia</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Monto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Acumulado</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map(e => {
                      running += signed(e)
                      const isEgreso = e.type === 'EGRESO'
                      return (
                        <TableRow key={e.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</TableCell>
                          <TableCell>
                            <Chip label={isEgreso ? 'Egreso' : 'Ingreso'} size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.62rem',
                                bgcolor: isEgreso ? '#FEF2F2' : '#ECFDF5',
                                color: isEgreso ? '#B91C1C' : '#047857',
                              }} />
                          </TableCell>
                          <TableCell>{e.category || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 240 }}>{e.description || '—'}</TableCell>
                          <TableCell sx={{ maxWidth: 260, color: '#78716C', fontSize: '0.78rem' }}>{e.reference || '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: isEgreso ? '#B91C1C' : '#047857' }}>
                            {isEgreso ? '-' : '+'}{formatMoney(num(e.amount))}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: gainColor(running) }}>
                            {formatMoney(running)}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Desvincular de la operación">
                              <span>
                                <IconButton size="small" disabled={busy === e.id} onClick={() => unlink(e.id)}>
                                  <LinkOff fontSize="small" sx={{ color: '#B91C1C' }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow>
                      <TableCell colSpan={5} sx={{ fontWeight: 800 }}>Total</TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontWeight: 800, color: gainColor(running) }}>
                        {formatMoney(running)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, color: '#0A0A0A' }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600, display: 'block' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}
