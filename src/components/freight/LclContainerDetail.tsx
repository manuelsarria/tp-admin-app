'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Paper,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  ArrowBack,
  PictureAsPdf,
  Lock,
  Add,
  Remove,
} from '@mui/icons-material'

interface LclBooking {
  id: string
  hblNumber: string
  shipperName: string
  clientName: string
  description: string | null
  packages: number
  packageType: string
  grossWeightKg: number | null
  cbm: number | null
  status: string
}

interface LclContainer {
  id: string
  mblNumber: string
  containerNumber: string | null
  seal: string | null
  vessel: string | null
  voyage: string | null
  portOfLoading: string
  portOfDischarge: string
  etd: string | null
  eta: string | null
  closingDate: string | null
  status: string
  notes: string | null
  createdAt: string
  bookings: LclBooking[]
}

const CONTAINER_CAPACITIES: Record<string, { cbm: number; label: string }> = {
  '20ft': { cbm: 26.5, label: '20ft (26.5 CBM)' },
  '40ft': { cbm: 60, label: '40ft (60 CBM)' },
  '40hc': { cbm: 67.7, label: "40ft HC (67.7 CBM)" },
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  LOADING: 'En Carga',
  CLOSED: 'Cerrado',
  IN_TRANSIT: 'En Tránsito',
  ARRIVED: 'Llegó',
  COMPLETED: 'Completado',
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'secondary'> = {
  OPEN: 'default',
  LOADING: 'warning',
  CLOSED: 'info',
  IN_TRANSIT: 'primary',
  ARRIVED: 'secondary',
  COMPLETED: 'success',
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_WAREHOUSE: 'En Bodega',
  ASSIGNED: 'Asignado',
  SHIPPED: 'Embarcado',
  ARRIVED: 'Llegó',
  DELIVERED: 'Entregado',
}

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-PA') : '—'

interface Props {
  id: string
}

export function LclContainerDetail({ id }: Props) {
  const router = useRouter()
  const [container, setContainer] = useState<LclContainer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [containerType, setContainerType] = useState('20ft')

  // Dialogs
  const [closeDialog, setCloseDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Available bookings to assign
  const [availableBookings, setAvailableBookings] = useState<LclBooking[]>([])
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lcl-containers/${id}`)
      if (!res.ok) throw new Error('Error cargando contenedor')
      const data = await res.json()
      setContainer(data)
      if (data.containerType) setContainerType(data.containerType)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const loadAvailableBookings = async () => {
    setLoadingAvailable(true)
    try {
      const res = await fetch('/api/lcl-bookings?unassigned=true')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAvailableBookings(data.bookings || [])
    } finally {
      setLoadingAvailable(false)
    }
  }

  const openAssignDialog = () => {
    setSelectedBookings([])
    loadAvailableBookings()
    setAssignDialog(true)
  }

  const handleAssign = async () => {
    if (!selectedBookings.length) return
    setActionLoading(true)
    try {
      await Promise.all(
        selectedBookings.map(bookingId =>
          fetch(`/api/lcl-bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lclContainerId: id, status: 'ASSIGNED' }),
          })
        )
      )
      setAssignDialog(false)
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnassign = async (bookingId: string) => {
    await fetch(`/api/lcl-bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lclContainerId: null, status: 'PENDING' }),
    })
    load()
  }

  const handleClose = async () => {
    setActionLoading(true)
    try {
      await fetch(`/api/lcl-containers/${id}/close`, { method: 'POST' })
      setCloseDialog(false)
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const downloadConsolidado = () => window.open(`/api/lcl-containers/${id}/consolidado`, '_blank')
  const downloadHBL = (bookingId: string) => window.open(`/api/lcl-bookings/${bookingId}/hbl`, '_blank')

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
  }

  if (error || !container) {
    return <Alert severity="error">{error || 'Contenedor no encontrado'}</Alert>
  }

  const totalPackages = container.bookings.reduce((s, b) => s + b.packages, 0)
  const totalWeight = container.bookings.reduce((s, b) => s + (b.grossWeightKg ?? 0), 0)
  const totalCbm = container.bookings.reduce((s, b) => s + (b.cbm ?? 0), 0)
  const capacity = CONTAINER_CAPACITIES[containerType]
  const cbmPercent = Math.min((totalCbm / capacity.cbm) * 100, 100)

  const canClose = ['OPEN', 'LOADING'].includes(container.status)
  const canConsolidado = ['CLOSED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(container.status)

  return (
    <Box>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/dashboard/freight/lcl/containers')} variant="outlined" size="small">
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Contenedor LCL: {container.mblNumber}
        </Typography>
        <Chip label={STATUS_LABELS[container.status] || container.status} color={STATUS_COLORS[container.status] || 'default'} />
        {canConsolidado && (
          <Button startIcon={<PictureAsPdf />} variant="outlined" size="small" onClick={downloadConsolidado}
            sx={{ borderColor: '#FACC15', color: '#FACC15' }}>
            Consolidado PDF
          </Button>
        )}
        {canClose && (
          <Button startIcon={<Lock />} variant="contained" size="small" onClick={() => setCloseDialog(true)}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}>
            Cerrar Contenedor
          </Button>
        )}
      </Box>

      {/* Info Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2.5, border: '1px solid #E5E7EB' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#FACC15' }}>
              Información del Contenedor
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'MBL Number', value: container.mblNumber },
                { label: 'Container #', value: container.containerNumber },
                { label: 'Seal', value: container.seal },
                { label: 'Vessel', value: container.vessel },
                { label: 'Voyage', value: container.voyage },
                { label: 'Port of Loading', value: container.portOfLoading },
                { label: 'Port of Discharge', value: container.portOfDischarge },
                { label: 'ETD', value: fmtDate(container.etd) },
                { label: 'ETA', value: fmtDate(container.eta) },
                { label: 'Closing Date', value: fmtDate(container.closingDate) },
              ].map(({ label, value }) => (
                <Grid item xs={6} sm={4} key={label}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
                </Grid>
              ))}
            </Grid>
            {container.notes && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #F3F4F6' }}>
                <Typography variant="caption" color="text.secondary">Notas</Typography>
                <Typography variant="body2">{container.notes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Summary Cards */}
          <Grid container spacing={1} sx={{ mb: 1.5 }}>
            {[
              { label: 'Bookings / HBLs', value: container.bookings.length, color: '#3B82F6' },
              { label: 'Total Piezas', value: totalPackages, color: '#8B5CF6' },
              { label: 'Peso Total KG', value: totalWeight.toFixed(1), color: '#F59E0B' },
              { label: 'Volumen CBM', value: totalCbm.toFixed(3), color: '#10B981' },
            ].map(({ label, value, color }) => (
              <Grid item xs={6} key={label}>
                <Card sx={{ borderLeft: `4px solid ${color}` }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color }}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* CBM Gauge */}
          <Paper sx={{ p: 2, border: '1px solid #E5E7EB' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>Ocupación CBM</Typography>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={containerType} onChange={e => {
                  const val = e.target.value
                  setContainerType(val)
                  fetch(`/api/lcl-containers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ containerType: val }),
                  })
                }} size="small">
                  {Object.entries(CONTAINER_CAPACITIES).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <LinearProgress
              variant="determinate"
              value={cbmPercent}
              sx={{
                height: 16,
                borderRadius: 8,
                bgcolor: '#0A0A0A',
                '& .MuiLinearProgress-bar': {
                  bgcolor: cbmPercent > 90 ? '#FACC15' : cbmPercent > 70 ? '#F59E0B' : '#10B981',
                  borderRadius: 8,
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {totalCbm.toFixed(3)} / {capacity.cbm} CBM
              </Typography>
              <Typography variant="caption" fontWeight={700} color={cbmPercent > 90 ? 'error' : 'text.primary'}>
                {cbmPercent.toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bookings Table */}
      <Paper sx={{ border: '1px solid #E5E7EB' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #F3F4F6' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Bookings Asignados ({container.bookings.length})
          </Typography>
          {canClose && (
            <Button size="small" variant="contained" startIcon={<Add />} onClick={openAssignDialog}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}>
              Asignar Bookings
            </Button>
          )}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell><strong>HBL #</strong></TableCell>
                <TableCell><strong>Shipper</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell align="right"><strong>Pkgs</strong></TableCell>
                <TableCell align="right"><strong>Peso KG</strong></TableCell>
                <TableCell align="right"><strong>CBM</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {container.bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>
                    No hay bookings asignados. Usa &quot;Asignar Bookings&quot; para agregar.
                  </TableCell>
                </TableRow>
              ) : container.bookings.map(b => (
                <TableRow key={b.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} color="#FACC15">{b.hblNumber}</Typography>
                      <Tooltip title="Descargar HBL">
                        <IconButton size="small" onClick={() => downloadHBL(b.id)}>
                          <PictureAsPdf fontSize="small" sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.shipperName}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.clientName}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7280', fontSize: '0.8rem' }}>
                    {b.description || '—'}
                  </TableCell>
                  <TableCell align="right">{b.packages} {b.packageType}</TableCell>
                  <TableCell align="right">{b.grossWeightKg != null ? `${b.grossWeightKg.toFixed(1)}` : '—'}</TableCell>
                  <TableCell align="right">{b.cbm != null ? b.cbm.toFixed(3) : '—'}</TableCell>
                  <TableCell>
                    <Chip label={BOOKING_STATUS_LABELS[b.status] || b.status} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {canClose && (
                      <Tooltip title="Desasignar">
                        <IconButton size="small" color="error" onClick={() => handleUnassign(b.id)}>
                          <Remove fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Close Container Dialog */}
      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)}>
        <DialogTitle>Cerrar Contenedor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Cerrar el contenedor <strong>{container.mblNumber}</strong>?
            Los {container.bookings.length} booking(s) asignados pasarán a estado <strong>SHIPPED</strong>.
            Esta acción no se puede deshacer fácilmente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleClose} disabled={actionLoading}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}>
            {actionLoading ? <CircularProgress size={18} /> : 'Cerrar Contenedor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Bookings Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Asignar Bookings al Contenedor</DialogTitle>
        <DialogContent>
          {loadingAvailable ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#FACC15' }} />
            </Box>
          ) : availableBookings.length === 0 ? (
            <Alert severity="info">No hay bookings disponibles sin contenedor.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell><strong>HBL #</strong></TableCell>
                    <TableCell><strong>Shipper</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell align="right"><strong>Pkgs</strong></TableCell>
                    <TableCell align="right"><strong>Peso KG</strong></TableCell>
                    <TableCell align="right"><strong>CBM</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableBookings.map(b => (
                    <TableRow key={b.id} hover
                      onClick={() => setSelectedBookings(prev =>
                        prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]
                      )}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedBookings.includes(b.id)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#FACC15">{b.hblNumber}</Typography>
                      </TableCell>
                      <TableCell>{b.shipperName}</TableCell>
                      <TableCell>{b.clientName}</TableCell>
                      <TableCell align="right">{b.packages} {b.packageType}</TableCell>
                      <TableCell align="right">{b.grossWeightKg != null ? b.grossWeightKg.toFixed(1) : '—'}</TableCell>
                      <TableCell align="right">{b.cbm != null ? b.cbm.toFixed(3) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {selectedBookings.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {selectedBookings.length} booking(s) seleccionado(s)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAssign} disabled={!selectedBookings.length || actionLoading}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}>
            {actionLoading ? <CircularProgress size={18} /> : `Asignar (${selectedBookings.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
