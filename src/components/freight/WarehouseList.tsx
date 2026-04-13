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
  Paper,
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
  Divider,
} from '@mui/material'
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  PictureAsPdf,
  Label,
  Search,
  Warehouse,
  LocalShipping,
  CheckCircle,
  Done,
  Description,
} from '@mui/icons-material'

interface WarehouseEntry {
  id: string
  wrNumber: string
  clientName: string
  consigneeName: string | null
  description: string | null
  pieces: number
  pieceType: string
  weight: number | null
  destWarehouse: string | null
  status: 'IN_WAREHOUSE' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED'
  coordinatorName: string | null
  lclBookingId: string | null
  createdAt: string
}

interface Stats {
  IN_WAREHOUSE: number
  IN_TRANSIT: number
  ARRIVED: number
  DELIVERED: number
}

const STATUS_LABELS: Record<string, string> = {
  IN_WAREHOUSE: 'En Bodega',
  IN_TRANSIT: 'En Tránsito',
  ARRIVED: 'Llegó',
  DELIVERED: 'Entregado',
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success'> = {
  IN_WAREHOUSE: 'default',
  IN_TRANSIT: 'warning',
  ARRIVED: 'info',
  DELIVERED: 'success',
}

const DEST_LABELS: Record<string, string> = {
  PANAMA_OESTE: 'Panamá Oeste',
  COLON_FREE_ZONE: 'Colón Free Zone',
  PANAMA_CIUDAD: 'Ciudad Panamá',
}

const STATUS_OPTIONS = [
  { value: 'IN_WAREHOUSE', label: 'En Bodega' },
  { value: 'IN_TRANSIT', label: 'En Tránsito' },
  { value: 'ARRIVED', label: 'Llegó' },
  { value: 'DELIVERED', label: 'Entregado' },
]

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

function StatCard({
  label,
  count,
  icon,
  color,
}: {
  label: string
  count: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card sx={{ borderTop: `3px solid ${color}` }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export function WarehouseList() {
  const router = useRouter()
  const [entries, setEntries] = useState<WarehouseEntry[]>([])
  const [stats, setStats] = useState<Stats>({ IN_WAREHOUSE: 0, IN_TRANSIT: 0, ARRIVED: 0, DELIVERED: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Context menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuEntry, setMenuEntry] = useState<WarehouseEntry | null>(null)

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusChanging, setStatusChanging] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // PDF loading
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (monthFilter) params.set('month', monthFilter)
      if (yearFilter) params.set('year', yearFilter)

      const res = await fetch(`/api/warehouse?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar datos')
      const data = await res.json()
      setEntries(data.entries || [])
      setStats(data.stats || { IN_WAREHOUSE: 0, IN_TRANSIT: 0, ARRIVED: 0, DELIVERED: 0 })
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, monthFilter, yearFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, entry: WarehouseEntry) => {
    setMenuAnchor(e.currentTarget)
    setMenuEntry(entry)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    if (menuEntry) router.push(`/dashboard/freight/bodega/${menuEntry.id}/editar`)
  }

  const handleDownloadLabels = async () => {
    if (!menuEntry) return
    handleMenuClose()
    setPdfLoading(`labels-${menuEntry.id}`)
    try {
      const res = await fetch(`/api/warehouse/${menuEntry.id}/labels`)
      if (!res.ok) throw new Error('Error generando etiquetas')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `labels-${menuEntry.wrNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPdfLoading(null)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!menuEntry) return
    handleMenuClose()
    setPdfLoading(`receipt-${menuEntry.id}`)
    try {
      const res = await fetch(`/api/warehouse/${menuEntry.id}/receipt`)
      if (!res.ok) throw new Error('Error generando receipt')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${menuEntry.wrNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPdfLoading(null)
    }
  }

  const handleOpenStatusDialog = () => {
    handleMenuClose()
    if (menuEntry) {
      setNewStatus(menuEntry.status)
      setStatusDialogOpen(true)
    }
  }

  const handleStatusChange = async () => {
    if (!menuEntry || !newStatus) return
    setStatusChanging(true)
    try {
      const res = await fetch(`/api/warehouse/${menuEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Error actualizando estado')
      setStatusDialogOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStatusChanging(false)
    }
  }

  const handleOpenDeleteDialog = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!menuEntry) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/warehouse/${menuEntry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error eliminando entrada')
      setDeleteDialogOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const fmtDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Bodega — Entradas de Carga
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/dashboard/freight/bodega/nueva')}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}
        >
          Nueva Entrada
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard label="En Bodega" count={stats.IN_WAREHOUSE} icon={<Warehouse />} color="#78716C" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="En Tránsito" count={stats.IN_TRANSIT} icon={<LocalShipping />} color="#f59e0b" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Llegaron" count={stats.ARRIVED} icon={<CheckCircle />} color="#3b82f6" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Entregados" count={stats.DELIVERED} icon={<Done />} color="#22c55e" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por WR# o cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {STATUS_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Mes</InputLabel>
              <Select
                value={monthFilter}
                label="Mes"
                onChange={e => setMonthFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {MONTHS.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              size="small"
              fullWidth
              label="Año"
              type="number"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              inputProps={{ min: 2020, max: 2100 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setMonthFilter('')
                setYearFilter('')
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#FACC15' }} />
          </Box>
        ) : entries.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay entradas registradas</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>WR #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Piezas</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Peso</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Destino</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#FACC15' }}
                    >
                      {entry.wrNumber}
                    </Typography>
                    {entry.lclBookingId && (
                      <Chip
                        icon={<Description sx={{ fontSize: '0.7rem !important' }} />}
                        label="HBL"
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 18, mt: 0.3 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {entry.clientName}
                    </Typography>
                    {entry.consigneeName && entry.consigneeName !== entry.clientName && (
                      <Typography variant="caption" color="text.secondary">
                        → {entry.consigneeName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.pieceType}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{entry.pieces}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.weight ? `${entry.weight} KG` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {entry.destWarehouse ? (DEST_LABELS[entry.destWarehouse] || entry.destWarehouse) : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[entry.status] || entry.status}
                      color={STATUS_COLORS[entry.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fmtDate(entry.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {pdfLoading && (pdfLoading === `labels-${entry.id}` || pdfLoading === `receipt-${entry.id}`) ? (
                      <CircularProgress size={20} sx={{ color: '#FACC15' }} />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={e => handleMenuOpen(e, entry)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200 } }}
      >
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1.5, color: '#78716C' }} />
          Editar
        </MenuItem>
        <Divider />
        {menuEntry && !menuEntry.lclBookingId ? (
          <MenuItem onClick={() => {
            handleMenuClose()
            if (menuEntry) router.push(`/dashboard/freight/lcl/bookings/nueva?wr=${menuEntry.id}`)
          }}>
            <Description fontSize="small" sx={{ mr: 1.5, color: '#3B82F6' }} />
            Crear Booking LCL
          </MenuItem>
        ) : menuEntry?.lclBookingId ? (
          <MenuItem disabled>
            <Description fontSize="small" sx={{ mr: 1.5, color: '#10B981' }} />
            HBL Vinculado
          </MenuItem>
        ) : null}
        <Divider />
        <MenuItem onClick={handleDownloadLabels}>
          <Label fontSize="small" sx={{ mr: 1.5, color: '#3b82f6' }} />
          Descargar Etiquetas
        </MenuItem>
        <MenuItem onClick={handleDownloadReceipt}>
          <PictureAsPdf fontSize="small" sx={{ mr: 1.5, color: '#FACC15' }} />
          Descargar Receipt
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenStatusDialog}>
          <CheckCircle fontSize="small" sx={{ mr: 1.5, color: '#22c55e' }} />
          Cambiar Estado
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenDeleteDialog} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1.5 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={newStatus}
              label="Nuevo Estado"
              onChange={e => setNewStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={statusChanging}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}
          >
            {statusChanging ? <CircularProgress size={16} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar la entrada{' '}
            <strong>{menuEntry?.wrNumber}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={16} color="inherit" /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
