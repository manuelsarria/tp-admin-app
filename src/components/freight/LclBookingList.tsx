'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Paper,
} from '@mui/material'
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  PictureAsPdf,
  Search,
  DirectionsBoat,
  Assignment,
  CheckCircle,
  QrCode2,
} from '@mui/icons-material'

interface LclBooking {
  id: string
  hblNumber: string
  shipperName: string
  clientName: string
  packages: number
  packageType: string
  grossWeightKg: number | null
  cbm: number | null
  status: string
  readyForPickup: boolean
  pickupWarehouse: string | null
  lclContainerId: string | null
  lclContainer?: { id: string; mblNumber: string; status: string } | null
  createdAt: string
}

const WAREHOUSE_LABELS: Record<string, string> = {
  PWEST: 'PA Oeste',
  PCENT: 'PA Centro',
  ZLC: 'Zona Libre',
}

interface Stats {
  PENDING: number
  IN_WAREHOUSE: number
  ASSIGNED: number
  SHIPPED: number
  ARRIVED: number
  DELIVERED: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_WAREHOUSE: 'En Bodega',
  ASSIGNED: 'Asignado',
  SHIPPED: 'Embarcado',
  ARRIVED: 'Llegó',
  DELIVERED: 'Entregado',
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'primary' | 'success' | 'secondary'> = {
  PENDING: 'default',
  IN_WAREHOUSE: 'warning',
  ASSIGNED: 'info',
  SHIPPED: 'primary',
  ARRIVED: 'secondary',
  DELIVERED: 'success',
}

const ALL_STATUSES = ['PENDING', 'IN_WAREHOUSE', 'ASSIGNED', 'SHIPPED', 'ARRIVED', 'DELIVERED']

export function LclBookingList() {
  const router = useRouter()
  const [bookings, setBookings] = useState<LclBooking[]>([])
  const [stats, setStats] = useState<Stats>({ PENDING: 0, IN_WAREHOUSE: 0, ASSIGNED: 0, SHIPPED: 0, ARRIVED: 0, DELIVERED: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [unassignedOnly, setUnassignedOnly] = useState(false)

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [pickupDialog, setPickupDialog] = useState(false)
  const [pickupWarehouse, setPickupWarehouse] = useState('')
  const [pickupReady, setPickupReady] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (monthFilter) params.set('month', monthFilter)
      if (yearFilter) params.set('year', yearFilter)
      if (unassignedOnly) params.set('unassigned', 'true')
      const res = await fetch(`/api/lcl-bookings?${params}`)
      if (!res.ok) throw new Error('Error cargando bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
      setStats(data.stats || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, monthFilter, yearFilter, unassignedOnly])

  useEffect(() => { load() }, [load])

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor(e.currentTarget)
    setSelectedId(id)
  }
  const closeMenu = () => { setMenuAnchor(null); setSelectedId(null) }

  const handleDelete = async () => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await fetch(`/api/lcl-bookings/${selectedId}`, { method: 'DELETE' })
      setDeleteDialog(false)
      closeMenu()
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!selectedId || !newStatus) return
    setActionLoading(true)
    try {
      await fetch(`/api/lcl-bookings/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setStatusDialog(false)
      closeMenu()
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const handlePickupApproval = async () => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await fetch(`/api/lcl-bookings/${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readyForPickup: pickupReady, pickupWarehouse: pickupWarehouse || null }),
      })
      setPickupDialog(false)
      closeMenu()
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const downloadHBL = (id: string) => {
    window.open(`/api/lcl-bookings/${id}/hbl`, '_blank')
    closeMenu()
  }

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-PA')

  const statCardData = [
    { key: 'PENDING', label: 'Pendiente', color: '#78716C' },
    { key: 'IN_WAREHOUSE', label: 'En Bodega', color: '#F59E0B' },
    { key: 'ASSIGNED', label: 'Asignado', color: '#3B82F6' },
    { key: 'SHIPPED', label: 'Embarcado', color: '#8B5CF6' },
    { key: 'ARRIVED', label: 'Llegó', color: '#06B6D4' },
    { key: 'DELIVERED', label: 'Entregado', color: '#10B981' },
  ]

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCardData.map(({ key, label, color }) => (
          <Grid item xs={6} sm={4} md={2} key={key}>
            <Card sx={{ borderTop: `3px solid ${color}` }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" fontWeight={700} sx={{ color }}>
                  {stats[key as keyof Stats] || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #E5E7EB' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              size="small" fullWidth placeholder="Buscar HBL# o cliente…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} /> }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={statusFilter} label="Estado" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {ALL_STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Mes</InputLabel>
              <Select value={monthFilter} label="Mes" onChange={e => setMonthFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    {new Date(2000, i, 1).toLocaleString('es', { month: 'long' })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField size="small" fullWidth label="Año" type="number" value={yearFilter} onChange={e => setYearFilter(e.target.value)} inputProps={{ min: 2024 }} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <Button
              fullWidth variant={unassignedOnly ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setUnassignedOnly(p => !p)}
              sx={unassignedOnly ? { bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } } : {}}
            >
              Sin Contenedor
            </Button>
          </Grid>
          <Grid item xs={12} sm="auto" sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/dashboard/freight/lcl/bookings/nueva')}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}
            >
              Nuevo HBL
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#FACC15' }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid #E5E7EB' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell><strong>HBL #</strong></TableCell>
                <TableCell><strong>Shipper</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell align="right"><strong>Pkgs</strong></TableCell>
                <TableCell align="right"><strong>Peso KG</strong></TableCell>
                <TableCell align="right"><strong>CBM</strong></TableCell>
                <TableCell><strong>Contenedor</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Retiro</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: '#9CA3AF' }}>
                    No hay bookings que mostrar
                  </TableCell>
                </TableRow>
              ) : bookings.map(b => (
                <TableRow key={b.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#FACC15">{b.hblNumber}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.shipperName}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.clientName}
                  </TableCell>
                  <TableCell align="right">{b.packages} {b.packageType}</TableCell>
                  <TableCell align="right">{b.grossWeightKg != null ? `${b.grossWeightKg.toFixed(1)} kg` : '—'}</TableCell>
                  <TableCell align="right">{b.cbm != null ? b.cbm.toFixed(3) : '—'}</TableCell>
                  <TableCell>
                    {b.lclContainer ? (
                      <Chip
                        label={b.lclContainer.mblNumber}
                        size="small"
                        color="info"
                        variant="outlined"
                        onClick={() => router.push(`/dashboard/freight/lcl/containers/${b.lclContainerId}`)}
                        sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Sin contenedor</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[b.status] || b.status}
                      size="small"
                      color={STATUS_COLORS[b.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {b.readyForPickup ? (
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: 14 }} />}
                        label={b.pickupWarehouse ? WAREHOUSE_LABELS[b.pickupWarehouse] || b.pickupWarehouse : 'Aprobado'}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: 'rgba(16,185,129,0.12)', color: '#10B981', '& .MuiChip-icon': { color: '#10B981' } }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ color: '#78716C', fontSize: '0.7rem' }}>Pendiente</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#6B7280' }}>
                    {fmtDate(b.createdAt)}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={e => openMenu(e, b.id)}>
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { router.push(`/dashboard/freight/lcl/bookings/${selectedId}/editar`); closeMenu() }}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={() => { if (selectedId) downloadHBL(selectedId) }}>
          <PictureAsPdf fontSize="small" sx={{ mr: 1 }} /> Descargar HBL
        </MenuItem>
        <MenuItem onClick={() => {
          const b = bookings.find(x => x.id === selectedId)
          setNewStatus(b?.status || '')
          setStatusDialog(true)
        }}>
          <Assignment fontSize="small" sx={{ mr: 1 }} /> Cambiar Estado
        </MenuItem>
        <MenuItem onClick={() => {
          const b = bookings.find(x => x.id === selectedId)
          setPickupReady(b?.readyForPickup || false)
          setPickupWarehouse(b?.pickupWarehouse || '')
          setPickupDialog(true)
        }}>
          <CheckCircle fontSize="small" sx={{ mr: 1, color: '#10B981' }} /> Gestionar Retiro
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => setDeleteDialog(true)}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Eliminar Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro de eliminar este booking? Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Cambiar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={newStatus} label="Estado" onChange={e => setNewStatus(e.target.value)}>
              {ALL_STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleStatusChange} disabled={actionLoading}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' } }}>
            {actionLoading ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pickup Approval Dialog */}
      <Dialog open={pickupDialog} onClose={() => setPickupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Gestionar Retiro de Carga</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Autoriza este HBL para retiro en bodega y asigna el almacén donde se encuentra la carga.
          </DialogContentText>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Bodega de Retiro</InputLabel>
            <Select value={pickupWarehouse} label="Bodega de Retiro" onChange={e => setPickupWarehouse(e.target.value)}>
              <MenuItem value="">Sin asignar</MenuItem>
              <MenuItem value="PWEST">Panama Oeste</MenuItem>
              <MenuItem value="PCENT">Panama Centro</MenuItem>
              <MenuItem value="ZLC">Zona Libre Colón</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2, bgcolor: pickupReady ? 'rgba(16,185,129,0.08)' : 'rgba(10,10,10,0.05)', border: `1px solid ${pickupReady ? 'rgba(16,185,129,0.2)' : 'rgba(10,10,10,0.08)'}` }}>
            <Button
              variant={pickupReady ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setPickupReady(!pickupReady)}
              sx={pickupReady
                ? { bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, textTransform: 'none' }
                : { fontWeight: 600, textTransform: 'none', borderColor: 'rgba(10,10,10,0.18)' }
              }
              startIcon={<CheckCircle />}
            >
              {pickupReady ? 'Aprobado para retiro' : 'Aprobar retiro'}
            </Button>
            {pickupReady && (
              <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                El cliente podrá verificar via QR
              </Typography>
            )}
          </Box>
          {pickupWarehouse === 'ZLC' && (
            <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}>
              <strong>Zona Libre:</strong> El cliente debe presentar el HBL impreso con sello fresco de CNC.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handlePickupApproval} disabled={actionLoading}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}>
            {actionLoading ? <CircularProgress size={18} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
