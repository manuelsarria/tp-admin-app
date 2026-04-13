'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Download,
  Inventory,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp, GridToolbar } from '@mui/x-data-grid'
import type { Container } from '@/types'

const navieras = [
  'Maersk',
  'MSC',
  'CMA CGM',
  'COSCO',
  'Hapag-Lloyd',
  'ONE',
  'Evergreen',
  'Yang Ming',
  'HMM',
  'PIL',
]

interface ContainerFormData {
  bl: string
  eta: string
  arrivalDate: string
  departureDate: string
  shippingLine: string
}

export default function ContenedorPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingContainer, setEditingContainer] = useState<Container | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNaviera, setFilterNaviera] = useState('')
  const [formData, setFormData] = useState<ContainerFormData>({
    bl: '',
    eta: '',
    arrivalDate: '',
    departureDate: '',
    shippingLine: '',
  })

  useEffect(() => {
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/containers?pageSize=100')
      const data = await response.json()
      setContainers(data.data || [])
    } catch (error) {
      console.error('Error fetching containers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContainer = () => {
    setEditingContainer(null)
    setFormData({
      bl: '',
      eta: '',
      arrivalDate: '',
      departureDate: '',
      shippingLine: '',
    })
    setOpenDialog(true)
  }

  const handleEditContainer = (container: Container) => {
    setEditingContainer(container)
    setFormData({
      bl: container.bl,
      eta: container.eta.toString().split('T')[0],
      arrivalDate: container.arrivalDate ? container.arrivalDate.toString().split('T')[0] : '',
      departureDate: container.departureDate ? container.departureDate.toString().split('T')[0] : '',
      shippingLine: container.shippingLine,
    })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingContainer) {
        await fetch(`/api/containers/${editingContainer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/containers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }
      await fetchContainers()
      setOpenDialog(false)
    } catch (error) {
      console.error('Error saving container:', error)
    }
  }

  const getStatusChip = (container: Container) => {
    if (container.departureDate) return { label: 'Despachado', color: 'success' }
    if (container.arrivalDate) return { label: 'Arribado', color: 'info' }
    return { label: 'En tránsito', color: 'warning' }
  }

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.shippingLine.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesNaviera = !filterNaviera || container.shippingLine === filterNaviera
    return matchesSearch && matchesNaviera
  })

  const columns: GridColDef[] = [
    {
      field: 'bl',
      headerName: 'BL',
      width: 130,
      flex: 1,
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'arrivalDate',
      headerName: 'Fecha Llegada',
      width: 140,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '—',
    },
    {
      field: 'departureDate',
      headerName: 'Fecha Salida',
      width: 140,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '—',
    },
    {
      field: 'shippingLine',
      headerName: 'Naviera',
      width: 150,
      flex: 1,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => {
        const status = getStatusChip(params.row)
        return (
          <Box
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status.color === 'success' ? 'bg-success/10 text-success' :
              status.color === 'info' ? 'bg-info/10 text-info' :
              'bg-warning/10 text-warning'
            }`}
          >
            {status.label}
          </Box>
        )
      },
    },
  ]

  const rows: GridRowsProp = filteredContainers.map(container => ({
    id: container.id,
    bl: container.bl,
    eta: container.eta,
    arrivalDate: container.arrivalDate,
    departureDate: container.departureDate,
    shippingLine: container.shippingLine,
  }))

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      {/* Page Header */}
      <Box className="flex justify-between items-center">
        <Box>
          <Typography variant="h4" className="font-bold text-ink mb-2">
            Gestión de Contenedores
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Administra y da seguimiento a todos los contenedores
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddContainer}
            className="bg-brand-primary hover:bg-brand-secondary"
          >
            Nuevo Contenedor
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="h5" className="font-bold text-ink">
                    {containers.length}
                  </Typography>
                  <Typography variant="body2" className="text-medium-gray">
                    Total Contenedores
                  </Typography>
                </Box>
                <Inventory className="text-brand-primary text-3xl" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-warning">
                {containers.filter(c => !c.arrivalDate).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                En Tránsito
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-info">
                {containers.filter(c => c.arrivalDate && !c.departureDate).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Arribados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-success">
                {containers.filter(c => c.departureDate).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Despachados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por BL o Naviera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Naviera</InputLabel>
                <Select
                  value={filterNaviera}
                  label="Filtrar por Naviera"
                  onChange={(e) => setFilterNaviera(e.target.value)}
                >
                  <MenuItem value="">Todas las Navieras</MenuItem>
                  {navieras.map(naviera => (
                    <MenuItem key={naviera} value={naviera}>
                      {naviera}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box className="flex gap-2">
                <Button
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('')
                    setFilterNaviera('')
                  }}
                >
                  Limpiar Filtros
                </Button>
                <Button
                  startIcon={<Download />}
                  variant="outlined"
                >
                  Exportar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <Box style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              onRowDoubleClick={isAdmin ? (params) => handleEditContainer(params.row) : undefined}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContainer ? 'Editar Contenedor' : 'Agregar Nuevo Contenedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} className="pt-2">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de BL"
                value={formData.bl}
                onChange={(e) => setFormData(prev => ({ ...prev, bl: e.target.value }))}
                placeholder="Ej: BL-0012345"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Naviera</InputLabel>
                <Select
                  value={formData.shippingLine}
                  label="Naviera"
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingLine: e.target.value }))}
                >
                  {navieras.map(naviera => (
                    <MenuItem key={naviera} value={naviera}>
                      {naviera}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="ETA"
                type="date"
                value={formData.eta}
                onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de Llegada"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de Salida"
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="bg-brand-primary hover:bg-brand-secondary"
            disabled={!formData.bl.trim() || !formData.eta || !formData.shippingLine}
          >
            {editingContainer ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
