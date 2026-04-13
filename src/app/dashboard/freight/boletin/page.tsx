'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Card, CardContent, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Tooltip, Snackbar,
} from '@mui/material'
import {
  Email, Warning, CheckCircle, Schedule, Edit, Send, Close,
  DirectionsBoat,
} from '@mui/icons-material'

interface Booking {
  id: string
  hblNumber: string
  clientId: string | null
  clientType: string | null
  clientName: string
  clientEmail: string | null
  packages: number
  grossWeightKg: number | null
  cbm: number | null
  description: string | null
  status: string
}

interface Container {
  id: string
  mblNumber: string
  containerNumber: string | null
  containerType: string | null
  vessel: string | null
  voyage: string | null
  etd: string | null
  eta: string | null
  status: string
  bookings: Booking[]
  lastBulletinDate: string | null
  daysSinceLastBulletin: number | null
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto', LOADING: 'Cargando', CLOSED: 'Cerrado',
  IN_TRANSIT: 'En Tránsito', ARRIVED: 'Llegado', COMPLETED: 'Completado',
}
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3B82F6', LOADING: '#F59E0B', CLOSED: '#6B7280',
  IN_TRANSIT: '#0066CC', ARRIVED: '#10B981', COMPLETED: '#059669',
}

const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function BoletinPage() {
  const { data: session } = useSession()
  const [containers, setContainers] = useState<Container[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Send dialog
  const [sendContainer, setSendContainer] = useState<Container | null>(null)
  const [editEtd, setEditEtd] = useState('')
  const [editEta, setEditEta] = useState('')
  const [sending, setSending] = useState(false)
  const [snackMsg, setSnackMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/boletin')
      const data = await res.json()
      setContainers(data.containers || [])
      setPendingCount(data.pendingCount || 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openSendDialog = (c: Container) => {
    setSendContainer(c)
    setEditEtd(c.etd ? c.etd.split('T')[0] : '')
    setEditEta(c.eta ? c.eta.split('T')[0] : '')
  }

  const handleSend = async () => {
    if (!sendContainer) return
    setSending(true)

    // Update ETD/ETA if changed
    const etdChanged = editEtd !== (sendContainer.etd?.split('T')[0] || '')
    const etaChanged = editEta !== (sendContainer.eta?.split('T')[0] || '')
    if (etdChanged || etaChanged) {
      await fetch(`/api/lcl-containers/${sendContainer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(etdChanged && { etd: editEtd ? new Date(editEtd).toISOString() : null }),
          ...(etaChanged && { eta: editEta ? new Date(editEta).toISOString() : null }),
        }),
      })
    }

    // Get unique recipients with email
    const recipientMap = new Map<string, { name: string; email: string }>()
    for (const b of sendContainer.bookings) {
      if (b.clientEmail && !recipientMap.has(b.clientEmail)) {
        recipientMap.set(b.clientEmail, { name: b.clientName, email: b.clientEmail })
      }
    }
    const recipients = [...recipientMap.values()]

    if (recipients.length === 0) {
      setSnackMsg('No hay clientes con email para notificar')
      setSending(false)
      return
    }

    try {
      const res = await fetch('/api/boletin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerId: sendContainer.id,
          containerNumber: sendContainer.containerNumber,
          mblNumber: sendContainer.mblNumber,
          vessel: sendContainer.vessel,
          etd: editEtd || sendContainer.etd,
          eta: editEta || sendContainer.eta,
          status: sendContainer.status,
          recipients,
          bookings: sendContainer.bookings.map(b => ({
            hblNumber: b.hblNumber, clientName: b.clientName,
            packages: b.packages, cbm: b.cbm, description: b.description,
          })),
        }),
      })
      const data = await res.json()
      const sent = data.results?.filter((r: any) => r.success).length || 0
      setSnackMsg(`Boletín enviado a ${sent} cliente(s)`)
      setSendContainer(null)
      load()
    } catch {
      setSnackMsg('Error al enviar boletín')
    } finally {
      setSending(false)
    }
  }

  const isPending = (c: Container) => c.status !== 'OPEN' && (c.daysSinceLastBulletin === null || c.daysSinceLastBulletin >= 7)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Email sx={{ color: '#FACC15', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>Boletín Semanal de Contenedores</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
        Envía actualizaciones semanales a los clientes sobre el estado de sus contenedores LCL.
      </Typography>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3, borderRadius: 2, border: '1px solid #F59E0B' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {pendingCount} contenedor(es) sin notificar en los últimos 7 días.
          </Typography>
        </Alert>
      )}

      {/* Container Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : containers.length === 0 ? (
        <Alert severity="info">No hay contenedores activos.</Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {containers.map(c => {
            const pending = isPending(c)
            const recipientCount = new Set(c.bookings.filter(b => b.clientEmail).map(b => b.clientEmail)).size

            return (
              <Card key={c.id} sx={{
                borderRadius: 3, border: pending ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                boxShadow: pending ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
              }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <DirectionsBoat sx={{ color: '#FAFAF9', fontSize: 22 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#FAFAF9' }}>
                          {c.containerNumber || c.mblNumber}
                        </Typography>
                        <Chip label={STATUS_LABELS[c.status] || c.status} size="small" sx={{
                          bgcolor: STATUS_COLORS[c.status] || '#6B7280', color: '#fff', fontWeight: 700, fontSize: '0.72rem',
                        }} />
                        {pending && <Chip icon={<Warning sx={{ fontSize: 14 }} />} label="Pendiente" size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        MBL: {c.mblNumber} {c.vessel && `• ${c.vessel}`} {c.voyage && `V.${c.voyage}`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#A8A29E', fontSize: '0.85rem' }}>
                          <strong>ETD:</strong> {fmtDate(c.etd)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#A8A29E', fontSize: '0.85rem' }}>
                          <strong>ETA:</strong> {fmtDate(c.eta)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>
                          <Schedule sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.3 }} />
                          {c.lastBulletinDate ? `Último envío: ${fmtDate(c.lastBulletinDate)}` : 'Nunca enviado'}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => openSendDialog(c)}
                      disabled={recipientCount === 0}
                      sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Enviar Boletín ({recipientCount})
                    </Button>
                  </Box>

                  {/* Bookings Table */}
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, color: '#6B7280', fontSize: '0.75rem', borderBottom: '2px solid #E5E7EB' } }}>
                          <TableCell>HBL</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell align="center">Bultos</TableCell>
                          <TableCell align="center">CBM</TableCell>
                          <TableCell>Descripción</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {c.bookings.map(b => (
                          <TableRow key={b.id} hover>
                            <TableCell><Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600, color: '#FACC15' }}>{b.hblNumber}</Typography></TableCell>
                            <TableCell><Typography sx={{ fontSize: '0.83rem', fontWeight: 600 }}>{b.clientName}</Typography></TableCell>
                            <TableCell>
                              {b.clientEmail
                                ? <Typography sx={{ fontSize: '0.8rem', color: '#A8A29E' }}>{b.clientEmail}</Typography>
                                : <Chip label="Sin email" size="small" sx={{ fontSize: '0.7rem', bgcolor: '#FEE2E2', color: '#991B1B' }} />
                              }
                            </TableCell>
                            <TableCell align="center"><Typography sx={{ fontSize: '0.83rem' }}>{b.packages}</Typography></TableCell>
                            <TableCell align="center"><Typography sx={{ fontSize: '0.83rem' }}>{b.cbm?.toFixed(3) || '—'}</Typography></TableCell>
                            <TableCell><Typography sx={{ fontSize: '0.8rem', color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description || '—'}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      {/* Send Dialog — Preview + Edit dates */}
      <Dialog open={!!sendContainer} onClose={() => setSendContainer(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send sx={{ color: '#FACC15' }} />
          Enviar Boletín — {sendContainer?.containerNumber || sendContainer?.mblNumber}
          <IconButton onClick={() => setSendContainer(null)} sx={{ ml: 'auto' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {sendContainer && (
            <Box sx={{ display: 'grid', gap: 3, mt: 1 }}>
              <Alert severity="info">
                Revisa y edita las fechas antes de enviar. El boletín se enviará a todos los clientes con email de este contenedor.
              </Alert>

              {/* Editable dates */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Fecha de Zarpe (ETD)"
                  type="date"
                  value={editEtd}
                  onChange={e => setEditEtd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ flex: 1, minWidth: 180 }}
                />
                <TextField
                  label="Fecha de Llegada (ETA)"
                  type="date"
                  value={editEta}
                  onChange={e => setEditEta(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ flex: 1, minWidth: 180 }}
                />
                <TextField label="Buque" value={sendContainer.vessel || ''} disabled size="small" sx={{ flex: 1, minWidth: 160 }} />
                <TextField label="Estado" value={STATUS_LABELS[sendContainer.status] || sendContainer.status} disabled size="small" sx={{ flex: 1, minWidth: 120 }} />
              </Box>

              {/* Recipients preview */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>Destinatarios:</Typography>
                {(() => {
                  const seen = new Set<string>()
                  return sendContainer.bookings.filter(b => {
                    if (!b.clientEmail || seen.has(b.clientEmail)) return false
                    seen.add(b.clientEmail)
                    return true
                  }).map(b => (
                    <Chip key={b.clientEmail} label={`${b.clientName} (${b.clientEmail})`} size="small" sx={{ mr: 1, mb: 1 }} />
                  ))
                })()}
                {sendContainer.bookings.filter(b => !b.clientEmail).length > 0 && (
                  <Typography variant="caption" sx={{ color: '#EF4444', display: 'block', mt: 0.5 }}>
                    {sendContainer.bookings.filter(b => !b.clientEmail).length} booking(s) sin email de cliente — no recibirán el boletín.
                  </Typography>
                )}
              </Box>

              {/* Bookings summary */}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>Carga incluida en el boletín:</Typography>
                {sendContainer.bookings.map(b => (
                  <Typography key={b.id} variant="body2" sx={{ color: '#A8A29E', fontSize: '0.85rem' }}>
                    <strong style={{ color: '#FACC15' }}>{b.hblNumber}</strong> — {b.clientName} — {b.packages} bultos — {b.description || '—'}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSendContainer(null)} disabled={sending}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}
          >
            {sending ? 'Enviando...' : 'Enviar Boletín'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackMsg} autoHideDuration={4000} onClose={() => setSnackMsg('')} message={snackMsg} />
    </Box>
  )
}
