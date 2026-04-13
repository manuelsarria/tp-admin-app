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
  Visibility,
  Lock,
} from '@mui/icons-material'

interface BookingSummary {
  id: string
  packages: number
  grossWeightKg: number | null
  cbm: number | null
}

interface LclContainer {
  id: string
  mblNumber: string
  containerNumber: string | null
  vessel: string | null
  etd: string | null
  eta: string | null
  status: string
  createdAt: string
  bookings: BookingSummary[]
}

interface Stats {
  OPEN: number
  LOADING: number
  CLOSED: number
  IN_TRANSIT: number
  ARRIVED: number
  COMPLETED: number
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

export function LclContainerList() {
  const router = useRouter()
  const [containers, setContainers] = useState<LclContainer[]>([])
  const [stats, setStats] = useState<Stats>({ OPEN: 0, LOADING: 0, CLOSED: 0, IN_TRANSIT: 0, ARRIVED: 0, COMPLETED: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/lcl-containers?${params}`)
      if (!res.ok) throw new Error('Error cargando contenedores')
      const data = await res.json()
      setContainers(data.containers || [])
      setStats(data.stats || {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

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
      await fetch(`/api/lcl-containers/${selectedId}`, { method: 'DELETE' })
      setDeleteDialog(false)
      closeMenu()
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId) return
    setActionLoading(true)
    try {
      await fetch(`/api/lcl-containers/${selectedId}/close`, { method: 'POST' })
      setCloseDialog(false)
      closeMenu()
      load()
    } finally {
      setActionLoading(false)
    }
  }

  const downloadConsolidado = (id: string) => {
    window.open(`/api/lcl-containers/${id}/consolidado`, '_blank')
    closeMenu()
  }

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-PA') : '—'

  const getContainerTotals = (c: LclContainer) => ({
    pkgs: c.bookings.reduce((s, b) => s + b.packages, 0),
    cbm: c.bookings.reduce((s, b) => s + (b.cbm ?? 0), 0),
  })

  const statCards = [
    { key: 'OPEN', label: 'Abierto', color: '#78716C' },
    { key: 'LOADING', label: 'En Carga', color: '#F59E0B' },
    { key: 'CLOSED', label: 'Cerrado', color: '#3B82F6' },
    { key: 'IN_TRANSIT', label: 'En Tránsito', color: '#8B5CF6' },
    { key: 'ARRIVED', label: 'Llegó', color: '#06B6D4' },
    { key: 'COMPLETED', label: 'Completado', color: '#10B981' },
  ]

  const selectedContainer = containers.find(c => c.id === selectedId)

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(({ key, label, color }) => (
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
          <Grid item xs={12} sm={5}>
            <TextField
              size="small" fullWidth placeholder="Buscar MBL# o vessel…"
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ color: '#9CA3AF', mr: 1 }} /> }}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={statusFilter} label="Estado" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm="auto" sx={{ ml: 'auto' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push('/dashboard/freight/lcl/containers/nueva')}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}
            >
              Nuevo Contenedor
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
                <TableCell><strong>MBL #</strong></TableCell>
                <TableCell><strong>Contenedor</strong></TableCell>
                <TableCell><strong>Vessel</strong></TableCell>
                <TableCell><strong>ETD</strong></TableCell>
                <TableCell><strong>ETA</strong></TableCell>
                <TableCell align="right"><strong>HBLs</strong></TableCell>
                <TableCell align="right"><strong>CBM</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>
                    No hay contenedores que mostrar
                  </TableCell>
                </TableRow>
              ) : containers.map(c => {
                const { pkgs, cbm } = getContainerTotals(c)
                return (
                  <TableRow key={c.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/freight/lcl/containers/${c.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#FACC15">{c.mblNumber}</Typography>
                    </TableCell>
                    <TableCell>{c.containerNumber || '—'}</TableCell>
                    <TableCell>{c.vessel || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(c.etd)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(c.eta)}</TableCell>
                    <TableCell align="right">{c.bookings.length}</TableCell>
                    <TableCell align="right">{cbm.toFixed(3)}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABELS[c.status] || c.status}
                        size="small"
                        color={STATUS_COLORS[c.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <IconButton size="small" onClick={e => openMenu(e, c.id)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { router.push(`/dashboard/freight/lcl/containers/${selectedId}`); closeMenu() }}>
          <Visibility fontSize="small" sx={{ mr: 1 }} /> Ver Detalle
        </MenuItem>
        {selectedContainer && ['OPEN', 'LOADING'].includes(selectedContainer.status) && (
          <MenuItem onClick={() => setCloseDialog(true)}>
            <Lock fontSize="small" sx={{ mr: 1 }} /> Cerrar Contenedor
          </MenuItem>
        )}
        {selectedContainer && ['CLOSED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED'].includes(selectedContainer.status) && (
          <MenuItem onClick={() => { if (selectedId) downloadConsolidado(selectedId) }}>
            <PictureAsPdf fontSize="small" sx={{ mr: 1 }} /> Descargar Consolidado
          </MenuItem>
        )}
        <MenuItem sx={{ color: 'error.main' }} onClick={() => setDeleteDialog(true)}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Eliminar
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Eliminar Contenedor</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro? Los bookings asignados quedarán sin contenedor.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)}>
        <DialogTitle>Cerrar Contenedor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Cerrar el contenedor {selectedContainer?.mblNumber}? Los bookings asignados pasarán a estado SHIPPED.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleClose} disabled={actionLoading}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}>
            {actionLoading ? <CircularProgress size={18} /> : 'Cerrar Contenedor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
