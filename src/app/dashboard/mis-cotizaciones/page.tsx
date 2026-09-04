'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Tooltip,
} from '@mui/material'
import {
  RequestQuote, CheckCircle, Cancel, HourglassEmpty, SendOutlined,
  ThumbUp, ThumbDown, InfoOutlined,
} from '@mui/icons-material'

type StatusStyle = { label: string; fg: string; bg: string; border: string }

const STATUS_CONFIG: Record<string, StatusStyle> = {
  DRAFT:     { label: 'Borrador',  fg: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  SENT:      { label: 'Enviada',   fg: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
  APPROVED:  { label: 'Aprobada',  fg: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  REJECTED:  { label: 'Rechazada', fg: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5' },
  CANCELLED: { label: 'Cancelada', fg: '#4B5563', bg: '#F3F4F6', border: '#D1D5DB' },
}

const FALLBACK_STATUS: Omit<StatusStyle, 'label'> = { fg: '#4B5563', bg: '#F3F4F6', border: '#D1D5DB' }

const statusChipSx = (s?: StatusStyle) => ({
  fontWeight: 700,
  fontSize: '0.72rem',
  color: s?.fg ?? FALLBACK_STATUS.fg,
  backgroundColor: s?.bg ?? FALLBACK_STATUS.bg,
  border: `1px solid ${s?.border ?? FALLBACK_STATUS.border}`,
})

const fmt = (n: number) =>
  `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface QuoteItem {
  id: string
  quoteNumber: string
  cliente: string
  total: number
  status: string
  createdAt: string
  rejectionReason: string | null
  _type: 'quote' | 'fast_quote'
  // Quote-specific
  quoteType?: string
  ruta?: string
  validoHasta?: string
  // FastQuote-specific
  tipoEnvio?: string
}

export default function MisCotizacionesPage() {
  const [items, setItems] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<QuoteItem | null>(null)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/my-quotes')
      const data = await res.json()
      const all = [
        ...(data.quotes || []),
        ...(data.fastQuotes || []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setItems(all)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleRespond = async (item: QuoteItem, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    setActionLoading(true)
    setActionError('')
    try {
      const res = await fetch(`/api/my-quotes/${item.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason, type: item._type }),
      })
      if (!res.ok) {
        const err = await res.json()
        setActionError(err.error || 'Error')
        return
      }
      setRejectOpen(false)
      setReason('')
      setActiveItem(null)
      loadData()
    } catch {
      setActionError('Error de conexión')
    } finally {
      setActionLoading(false)
    }
  }

  const openReject = (item: QuoteItem) => {
    setActiveItem(item)
    setReason('')
    setActionError('')
    setRejectOpen(true)
  }

  // Stats
  const sent = items.filter(i => i.status === 'SENT').length
  const approved = items.filter(i => i.status === 'APPROVED').length
  const rejected = items.filter(i => i.status === 'REJECTED').length

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <RequestQuote sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>
            Mis Cotizaciones
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Cotizaciones asignadas a tu cuenta. Puedes aprobar o rechazar las que estén en estado "Enviada".
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Pendientes', count: sent, icon: <SendOutlined sx={{ fontSize: 20 }} />, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Aprobadas', count: approved, icon: <CheckCircle sx={{ fontSize: 20 }} />, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Rechazadas', count: rejected, icon: <Cancel sx={{ fontSize: 20 }} />, color: '#DC2626', bg: '#FEF2F2' },
        ].map(stat => (
          <Card key={stat.label} sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: stat.bg }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: stat.color }}>
                {stat.icon}
                <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color }}>{stat.count}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : items.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <RequestQuote sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>No tienes cotizaciones asignadas</Typography>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['# Quote', 'Tipo', 'Total', 'Fecha', 'Estatus', 'Acciones'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(q => {
                const sc = STATUS_CONFIG[q.status] ?? { label: q.status, ...FALLBACK_STATUS }
                const typeLabel = q._type === 'fast_quote' ? 'Fast Quote' : (q.quoteType || 'Quote')
                return (
                  <TableRow key={`${q._type}-${q.id}`} sx={{ '&:hover': { bgcolor: 'rgba(10, 10, 10, 0.05)' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: '#FACC15' }}>
                      {q.quoteNumber}
                    </TableCell>
                    <TableCell>
                      <Chip label={typeLabel} size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.68rem',
                          bgcolor: q._type === 'fast_quote' ? '#FEF3C7' : '#DBEAFE',
                          color: q._type === 'fast_quote' ? '#92400E' : '#1D4ED8',
                        }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt(q.total)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{formatDate(q.createdAt)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label={sc.label} size="small" sx={statusChipSx(sc)} />
                        {q.status === 'REJECTED' && q.rejectionReason && (
                          <Tooltip title={q.rejectionReason} arrow>
                            <InfoOutlined sx={{ fontSize: 16, color: '#DC2626', cursor: 'help' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {q.status === 'SENT' ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ThumbUp sx={{ fontSize: 14 }} />}
                            onClick={() => handleRespond(q, 'APPROVED')}
                            disabled={actionLoading}
                            sx={{
                              bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' },
                              borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.5,
                            }}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ThumbDown sx={{ fontSize: 14 }} />}
                            onClick={() => openReject(q)}
                            disabled={actionLoading}
                            sx={{
                              borderColor: '#DC2626', color: '#DC2626',
                              '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' },
                              borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', py: 0.5,
                            }}
                          >
                            Rechazar
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Rechazar Cotización</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
            Por favor indica el motivo del rechazo para la cotización <strong>{activeItem?.quoteNumber}</strong>.
          </Typography>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <TextField
            label="Motivo del rechazo *"
            value={reason}
            onChange={e => setReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Ej: El precio es muy alto, necesito otra opción..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            onClick={() => activeItem && handleRespond(activeItem, 'REJECTED', reason)}
            variant="contained"
            disabled={actionLoading || !reason.trim()}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {actionLoading ? 'Enviando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
