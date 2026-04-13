'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import {
  LocalShipping,
  CheckCircle,
  Info,
  Visibility,
  Close,
  Warehouse,
  FlightLand,
  Search,
  FilterList,
  ContentCopy,
  Check, // for copied feedback
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid'
import type { CargoManagement } from '@/types'

// Status mapping helpers
const statusToSpanish: Record<string, string> = {
  'RECEIVED_IN_WAREHOUSE': 'Recibido en Bodega',
  'IN_TRANSIT': 'En transito',
  'ARRIVED_PANAMA': 'Arribo PTY',
  'READY_FOR_DELIVERY': 'Listo para Entrega',
}

const statusToEnglish: Record<string, string> = {
  'Recibido en Bodega': 'RECEIVED_IN_WAREHOUSE',
  'En transito': 'IN_TRANSIT',
  'Arribo PTY': 'ARRIVED_PANAMA',
  'Listo para Entrega': 'READY_FOR_DELIVERY',
}

// Extended type to match current UI
interface ExtendedCargoManagement extends Omit<CargoManagement, 'containerNumber' | 'location'> {
  containerNumber: string
  location: string
  contenedor?: string  // for backward compat
  ubicacion?: string   // for backward compat
}

// Mock data - will be replaced with API data
const cargoData: (ExtendedCargoManagement & { naviera?: string; fechaSalida?: Date })[] = [
  {
    id: '6',
    contenedor: 'MSCU1234567',
    eta: new Date('2025-09-19'),
    ubicacion: 'Bodega Central',
    status: 'Recibido en Bodega' as any,
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
    naviera: 'Maersk',
    fechaSalida: new Date('2025-09-10'),
  } as any,
  {
    id: '7',
    contenedor: 'MSCU7654321',
    eta: new Date('2025-09-21'),
    ubicacion: 'Bodega Zona Libre',
    status: 'Recibido en Bodega' as any,
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-18'),
  } as any,
  {
    id: '1',
    contenedor: 'TGHU9988776',
    eta: new Date('2025-09-18'),
    ubicacion: 'Puerto de Colón',
    status: 'En transito',
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-09-17'),
  } as any,
  {
    id: '2',
    contenedor: 'WHCN10000TZ',
    eta: new Date('2025-09-20'),
    ubicacion: 'Terminal Balboa',
    status: 'Arribo PTY',
    createdAt: new Date('2025-09-14'),
    updatedAt: new Date('2025-09-17'),
  } as any,
  {
    id: '3',
    contenedor: 'BLMX789456',
    eta: new Date('2025-09-22'),
    ubicacion: 'Zona Libre Pacífico',
    status: 'Listo para Entrega',
    createdAt: new Date('2025-09-13'),
    updatedAt: new Date('2025-09-16'),
  } as any,
  {
    id: '4',
    contenedor: 'WHCN20001TZ',
    eta: new Date('2025-09-25'),
    ubicacion: 'Depósito Colón',
    status: 'Arribo PTY',
    createdAt: new Date('2025-09-12'),
    updatedAt: new Date('2025-09-15'),
  } as any,
  {
    id: '5',
    contenedor: 'WHCN30002TZ',
    eta: new Date('2025-09-28'),
    ubicacion: 'Logística Panamá',
    status: 'Listo para Entrega',
    createdAt: new Date('2025-09-11'),
    updatedAt: new Date('2025-09-14'),
  } as any,
  // --- NEW extra rows to populate tabs ---
  {
    id: '8',
    contenedor: 'MSCU5551112',
    eta: new Date('2025-09-23'),
    ubicacion: 'Bodega Central',
    status: 'Recibido en Bodega' as any,
    createdAt: new Date('2025-09-19'),
    updatedAt: new Date('2025-09-19'),
  } as any,
  {
    id: '9',
    contenedor: 'TGHU1122334',
    eta: new Date('2025-09-24'),
    ubicacion: 'Bodega Zona Libre',
    status: 'Recibido en Bodega' as any,
    createdAt: new Date('2025-09-19'),
    updatedAt: new Date('2025-09-20'),
  } as any,
  {
    id: '10',
    contenedor: 'WHCN40004TZ',
    eta: new Date('2025-09-26'),
    ubicacion: 'Depósito Colón',
    status: 'Recibido en Bodega' as any,
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-21'),
  } as any,
  {
    id: '11',
    contenedor: 'MSCU8887776',
    eta: new Date('2025-09-27'),
    ubicacion: 'Puerto de Colón',
    status: 'En transito',
    createdAt: new Date('2025-09-18'),
    updatedAt: new Date('2025-09-22'),
  } as any,
  {
    id: '12',
    contenedor: 'TGHU4455667',
    eta: new Date('2025-09-29'),
    ubicacion: 'Terminal Balboa',
    status: 'En transito',
    createdAt: new Date('2025-09-19'),
    updatedAt: new Date('2025-09-22'),
  } as any,
  {
    id: '13',
    contenedor: 'BLMX123987',
    eta: new Date('2025-09-30'),
    ubicacion: 'Zona Libre Pacífico',
    status: 'En transito',
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-22'),
  } as any,
  {
    id: '14',
    contenedor: 'WHCN50005TZ',
    eta: new Date('2025-09-17'),
    ubicacion: 'Terminal Balboa',
    status: 'Arribo PTY',
    createdAt: new Date('2025-09-12'),
    updatedAt: new Date('2025-09-17'),
  } as any,
  {
    id: '15',
    contenedor: 'MSCU9990001',
    eta: new Date('2025-09-19'),
    ubicacion: 'Depósito Colón',
    status: 'Arribo PTY',
    createdAt: new Date('2025-09-13'),
    updatedAt: new Date('2025-09-18'),
  } as any,
  {
    id: '16',
    contenedor: 'TGHU5566778',
    eta: new Date('2025-09-20'),
    ubicacion: 'Puerto de Colón',
    status: 'Arribo PTY',
    createdAt: new Date('2025-09-14'),
    updatedAt: new Date('2025-09-18'),
  } as any,
  {
    id: '17',
    contenedor: 'BLMX654321',
    eta: new Date('2025-09-15'),
    ubicacion: 'Zona Libre Pacífico',
    status: 'Listo para Entrega',
    createdAt: new Date('2025-09-10'),
    updatedAt: new Date('2025-09-16'),
  } as any,
  {
    id: '18',
    contenedor: 'WHCN60006TZ',
    eta: new Date('2025-09-16'),
    ubicacion: 'Logística Panamá',
    status: 'Listo para Entrega',
    createdAt: new Date('2025-09-11'),
    updatedAt: new Date('2025-09-15'),
  } as any,
  {
    id: '19',
    contenedor: 'MSCU4443332',
    eta: new Date('2025-09-18'),
    ubicacion: 'Depósito Colón',
    status: 'Listo para Entrega',
    createdAt: new Date('2025-09-12'),
    updatedAt: new Date('2025-09-16'),
    naviera: 'CMA CGM',
    fechaSalida: new Date('2025-09-05'),
  } as any,
]
// ADD: (kept original cargoData; now we will derive state from it)

// extend allowed status type locally
type ExtendedStatus = CargoManagement['status'] | 'Recibido en Bodega' | 'En transito' | 'Arribo PTY' | 'Listo para Entrega'

// updated status chip config (fixed typo)
const getStatusChip = (status: string) => {
  const config = {
    'Recibido en Bodega': { color: 'primary' as const, icon: <Warehouse className="text-sm" />, bgColor: 'bg-primary/10 text-primary' },
    'En transito': { color: 'info' as const, icon: <LocalShipping className="text-sm" />, bgColor: 'bg-info/10 text-info' },
    'Arribo PTY': { color: 'warning' as const, icon: <FlightLand className="text-sm" />, bgColor: 'bg-warning/10 text-warning' },
    'Listo para Entrega': { color: 'success' as const, icon: <CheckCircle className="text-sm" />, bgColor: 'bg-success/10 text-success' },
    'llegado a destino': { color: 'warning' as const, icon: <FlightLand className="text-sm" />, bgColor: 'bg-warning/10 text-warning' },
    'Listo para su retiro': { color: 'success' as const, icon: <CheckCircle className="text-sm" />, bgColor: 'bg-success/10 text-success' },
  }
  return config[status as keyof typeof config] || { color: 'default' as const, icon: null, bgColor: 'bg-gray-100 text-gray-700' }
}

// helper to show new labels for legacy internal statuses
const displayStatus = (status: string) => {
  const map: Record<string, string> = {
    'Arribo PTY': 'llegado a destino',
    'Listo para Entrega': 'Listo para su retiro',
  }
  return map[status] || status
}

// Helper to get reference number from cargo record (uses database-generated referenceNo)
const getReferenceNo = (cargo: CargoManagement) => {
  return cargo.referenceNo || 'N/A'
}

export default function GestionContenedoresPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [tabValue, setTabValue] = useState(0)
  const [cargoList, setCargoList] = useState<CargoManagement[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const statusOptions: ExtendedStatus[] = ['Recibido en Bodega', 'En transito', 'Arribo PTY', 'Listo para Entrega']

  // Fetch data from API
  useEffect(() => {
    fetchCargoManagement()
  }, [])

  const fetchCargoManagement = async () => {
    try {
      const response = await fetch('/api/cargo-management?pageSize=100')
      const data = await response.json()
      setCargoList(data.data || [])
    } catch (error) {
      console.error('Error fetching cargo management:', error)
    } finally {
      setLoading(false)
    }
  }
  const [newCargo, setNewCargo] = useState<{
    contenedor: string
    eta: string
    ubicacion: string
    status: ExtendedStatus
    fechaSalida: string
    naviera: string
  }>({
    contenedor: '',
    eta: '',
    ubicacion: '',
    status: 'Recibido en Bodega',
    fechaSalida: '',
    naviera: '', // sin valor por defecto
  })
  const [dialogReference, setDialogReference] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false) // NEW

  const handleCopyReference = () => {
    if (!dialogReference) return
    const text = dialogReference
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedRef(true)
        setTimeout(() => setCopiedRef(false), 2000)
      })
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopiedRef(true); setTimeout(() => setCopiedRef(false), 2000) } catch {}
      document.body.removeChild(ta)
    }
  }

  const [selectedCargo, setSelectedCargo] = useState<CargoManagement | null>(null)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [openCloseDialog, setOpenCloseDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    contenedor: string
    eta: string
    ubicacion: string
    status: ExtendedStatus
    fechaSalida: string
    naviera: string
  }>({
    contenedor: '',
    eta: '',
    ubicacion: '',
    status: 'Recibido en Bodega',
    fechaSalida: '',
    naviera: '',
  })
  const [cargoFilters, setCargoFilters] = useState<Record<ExtendedStatus, { search: string }>>({
    'Recibido en Bodega': { search: '' },
    'En transito': { search: '' },
    'Arribo PTY': { search: '' },
    'Listo para Entrega': { search: '' },
    'RECEIVED_IN_WAREHOUSE': { search: '' },
    'IN_TRANSIT': { search: '' },
    'ARRIVED_PANAMA': { search: '' },
    'READY_FOR_DELIVERY': { search: '' },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleCloseCargo = (cargo: CargoManagement) => {
    setSelectedCargo(cargo)
    setOpenCloseDialog(true)
  }

  const handleViewDetails = async (cargo: CargoManagement) => {
    try {
      // Fetch full cargo details with status history
      const response = await fetch(`/api/cargo-management/${cargo.id}`)

      if (!response.ok) {
        console.error('Failed to fetch cargo details:', response.status)
        setSelectedCargo(cargo)
        setIsEditing(false)
        const spanishStatus = statusToSpanish[cargo.status] || cargo.status
        setEditForm({
          contenedor: cargo.containerNumber,
          eta: cargo.eta ? new Date(cargo.eta).toISOString().split('T')[0] : '',
          ubicacion: cargo.location,
          status: spanishStatus as ExtendedStatus,
          fechaSalida: cargo.departureDate ? new Date(cargo.departureDate).toISOString().split('T')[0] : '',
          naviera: cargo.shippingLine || '',
        })
        setOpenDetailsDialog(true)
        return
      }

      const cargoWithHistory = await response.json()
      console.log('Cargo with history:', cargoWithHistory)

      setSelectedCargo(cargoWithHistory)
      setIsEditing(false)
      const spanishStatus = statusToSpanish[cargoWithHistory.status] || cargoWithHistory.status
      setEditForm({
        contenedor: cargoWithHistory.containerNumber,
        eta: cargoWithHistory.eta ? new Date(cargoWithHistory.eta).toISOString().split('T')[0] : '',
        ubicacion: cargoWithHistory.location,
        status: spanishStatus as ExtendedStatus,
        fechaSalida: cargoWithHistory.departureDate ? new Date(cargoWithHistory.departureDate).toISOString().split('T')[0] : '',
        naviera: cargoWithHistory.shippingLine || '',
      })
      setOpenDetailsDialog(true)
    } catch (error) {
      console.error('Error fetching cargo details:', error)
      setSelectedCargo(cargo)
      setIsEditing(false)
      const spanishStatus = statusToSpanish[cargo.status] || cargo.status
      setEditForm({
        contenedor: cargo.containerNumber,
        eta: cargo.eta ? new Date(cargo.eta).toISOString().split('T')[0] : '',
        ubicacion: cargo.location,
        status: spanishStatus as ExtendedStatus,
        fechaSalida: cargo.departureDate ? new Date(cargo.departureDate).toISOString().split('T')[0] : '',
        naviera: cargo.shippingLine || '',
      })
      setOpenDetailsDialog(true)
    }
  }

  const handleSaveChanges = async () => {
    if (!selectedCargo) {
      console.error('No selectedCargo')
      return
    }

    try {
      console.log('Selected cargo ID:', selectedCargo.id)
      console.log('Selected cargo object:', selectedCargo)

      const statusEnglish = statusToEnglish[editForm.status] || editForm.status
      const payload = {
        containerNumber: editForm.contenedor,
        eta: editForm.eta || undefined,
        location: editForm.ubicacion,
        status: statusEnglish,
        departureDate: editForm.fechaSalida || undefined,
        shippingLine: editForm.naviera || undefined,
      }

      console.log('Saving cargo with payload:', payload)
      console.log('API URL:', `/api/cargo-management/${selectedCargo.id}`)

      const response = await fetch(`/api/cargo-management/${selectedCargo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to update cargo:', errorData)
        alert(`Error: ${errorData.error || 'Failed to update cargo'}`)
        return
      }

      const result = await response.json()
      console.log('Update successful:', result)

      await fetchCargoManagement()
      setIsEditing(false)
      setOpenDetailsDialog(false)
    } catch (error) {
      console.error('Error updating cargo management:', error)
      alert('Error updating cargo management')
    }
  }

  const handleCancelEdit = () => {
    if (selectedCargo) {
      const spanishStatus = statusToSpanish[selectedCargo.status] || selectedCargo.status
      setEditForm({
        contenedor: selectedCargo.containerNumber,
        eta: selectedCargo.eta ? new Date(selectedCargo.eta).toISOString().split('T')[0] : '',
        ubicacion: selectedCargo.location,
        status: spanishStatus as ExtendedStatus,
        fechaSalida: selectedCargo.departureDate ? new Date(selectedCargo.departureDate).toISOString().split('T')[0] : '',
        naviera: selectedCargo.shippingLine || '',
      })
    }
    setIsEditing(false)
  }

  // REPLACED: containerColumns -> cargoColumns (only needed fields)
  const cargoColumns: GridColDef[] = [
    {
      field: 'referenceNo',
      headerName: 'Reference No.',
      width: 150,
    },
    { field: 'bl', headerName: 'Contenedor', width: 160, flex: 1 },
    {
      field: 'naviera',
      headerName: 'Naviera',
      width: 140,
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 120,
      renderCell: (p) => p.value ? p.value.toLocaleDateString('es-ES') : '-',
    },
    {
      field: 'fechaSalida',
      headerName: 'Fecha Salida',
      width: 130,
      renderCell: (p) => p.value ? p.value.toLocaleDateString('es-ES') : '-',
    },
    {
      field: 'ubicacion',
      headerName: 'Ubicación',
      width: 180,
      flex: 1,
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 280,
      sortable: false,
      cellClassName: 'actions-cell',
      renderCell: (params) => {
        const cargo = cargoList.find(c => c.id === params.row.id)
        if (!cargo) return null

        return (
          <Box className="flex gap-1 flex-wrap">
            <Button
              size="small"
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => handleViewDetails(cargo)}
              sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
            >
              Detalles
            </Button>
            {isAdmin && tabValue === 0 && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={() => handleCloseCargo(cargo)}
                sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
              >
                Cerrar
              </Button>
            )}
          </Box>
        )
      },
    },
  ]

  const getFilteredData = (status: ExtendedStatus) => {
    const statusEnglish = statusToEnglish[status] || status
    return cargoList.filter(cargo => cargo.status === statusEnglish)
  }

  const renderTable = (status: ExtendedStatus) => {
    const { search } = cargoFilters[status] ?? { search: '' }

    const filteredData = getFilteredData(status).filter(c => {
      const s = search.toLowerCase()
      const referenceNo = getReferenceNo(c).toLowerCase()
      const naviera = (c.shippingLine || '').toLowerCase()
      const matchesSearch =
        !s ||
        referenceNo.includes(s) ||
        c.containerNumber.toLowerCase().includes(s) ||
        naviera.includes(s)
      return matchesSearch
    })

    const rows: GridRowsProp = filteredData.map(cargo => ({
      id: cargo.id,
      referenceNo: getReferenceNo(cargo),
      bl: cargo.containerNumber,
      eta: cargo.eta ? new Date(cargo.eta) : null,
      fechaSalida: cargo.departureDate ? new Date(cargo.departureDate) : null,
      ubicacion: cargo.location,
      naviera: cargo.shippingLine || '',
      cargoStatus: statusToSpanish[cargo.status] || cargo.status,
      createdAt: new Date(cargo.createdAt),
      updatedAt: new Date(cargo.updatedAt),
    }))

    return (
      <Box className="space-y-4">
        {/* Per-tab filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder="Buscar por Reference No., Contenedor o Naviera..."
              value={search}
              onChange={(e) =>
                setCargoFilters(f => ({
                  ...f,
                  [status]: { search: e.target.value },
                }))
              }
              InputProps={{
                startAdornment: <Search className="mr-2 text-medium-gray" />,
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box className="flex gap-2">
              <Button
                startIcon={<FilterList />}
                onClick={() =>
                  setCargoFilters(f => ({
                    ...f,
                    [status]: { search: '' },
                  }))
                }
                size="small"
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={cargoColumns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell.actions-cell': { 
                overflow: 'visible',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiDataGrid-cell.actions-cell .MuiButton-root': {
                whiteSpace: 'nowrap',
                minWidth: 'auto',
              },
            }}
          />
        </Box>
      </Box>
    )
  }

  // NEW: neutral focus style to avoid red (primary) border on focus
  const neutralTextFieldSx = {
    '& label.Mui-focused': { color: 'text.primary' },
    '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'divider' }
  }

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      {/* Page Header with Add button */}
      <Box className="flex items-start justify-between flex-wrap gap-4">
        <Box>
          <Typography variant="h4" className="font-bold text-ink mb-2">
            Gestión de Contenedores
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Monitorea el estado y ubicación de todos los contenedores en tiempo real
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setDialogReference(null)
              setOpenAddDialog(true)
            }}
          >
            Agregar Contenedor
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
                    {cargoList.length}
                  </Typography>
                  <Typography variant="body2" className="text-medium-gray">
                    Total Contenedores
                  </Typography>
                </Box>
                <LocalShipping className="text-brand-primary text-3xl" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-info">
                {getFilteredData('En transito').length}
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
              <Typography variant="h5" className="font-bold text-warning">
                {getFilteredData('Arribo PTY').length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Arribo PTY
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-success">
                {getFilteredData('Listo para Entrega').length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Listo para Entrega
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="cargo status tabs">
            <Tab
              label={
                <Box className="flex items-center gap-2">
                  <Warehouse />
                  Recibido en Bodega ({getFilteredData('Recibido en Bodega').length})
                </Box>
              }
            />
            <Tab
              label={
                <Box className="flex items-center gap-2">
                  <LocalShipping />
                  En transito ({getFilteredData('En transito').length})
                </Box>
              }
            />
            <Tab
              label={
                <Box className="flex items-center gap-2">
                  <FlightLand />
                  llegado a destino ({getFilteredData('Arribo PTY').length})
                </Box>
              }
            />
            <Tab
              label={
                <Box className="flex items-center gap-2">
                  <CheckCircle />
                  Listo para su retiro ({getFilteredData('Listo para Entrega').length})
                </Box>
              }
            />
          </Tabs>
        </Box>

        <CardContent className="p-6">
          <TabPanel value={tabValue} index={0}>
            {renderTable('Recibido en Bodega')}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderTable('En transito')}
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            {renderTable('Arribo PTY')}
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            {renderTable('Listo para Entrega')}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => {
          setOpenDetailsDialog(false)
          setIsEditing(false)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex items-center justify-between">
            <Typography variant="h6">
              {isEditing ? 'Editar Contenedor' : 'Detalles del Contenedor'}
            </Typography>
            {isAdmin && !isEditing && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedCargo && (
            isEditing ? (
              <Box className="space-y-4">
                {/* Información Principal */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Información Principal
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Número de Contenedor"
                        fullWidth
                        size="small"
                        value={editForm.contenedor}
                        onChange={(e) =>
                          setEditForm(f => ({
                            ...f,
                            contenedor: e.target.value.toUpperCase().replace(/\s+/g, '')
                          }))
                        }
                        sx={neutralTextFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Naviera"
                        fullWidth
                        size="small"
                        value={editForm.naviera}
                        onChange={(e) =>
                          setEditForm(f => ({
                            ...f,
                            naviera: e.target.value.trim()
                          }))
                        }
                        sx={neutralTextFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Ubicación Actual"
                        fullWidth
                        size="small"
                        value={editForm.ubicacion}
                        onChange={(e) => setEditForm(f => ({ ...f, ubicacion: e.target.value }))}
                        sx={neutralTextFieldSx}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Estado y Fechas */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Estado y Programación
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      {/* <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
                        Estado
                      </Typography> */}
                      <FormControl fullWidth size="small">
                        <InputLabel
                          sx={{
                            color: 'text.secondary',
                            '&.Mui-focused': { color: 'text.primary' }
                          }}
                        >
                          Estado
                        </InputLabel>
                        <Select
                          value={editForm.status}
                          label="Estado"
                          onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as ExtendedStatus }))}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'divider',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'text.primary',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'divider',
                              borderWidth: '1px',
                            },
                          }}
                        >
                          {statusOptions.map((status) => (
                            <MenuItem key={status} value={status}>
                              <Box className="flex items-center gap-2">
                                {getStatusChip(displayStatus(status)).icon}
                                {displayStatus(status)}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Fecha de Salida"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={editForm.fechaSalida}
                        onChange={(e) =>
                          setEditForm(f => ({ ...f, fechaSalida: e.target.value }))
                        }
                        sx={neutralTextFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Fecha ETA"
                        type="date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={editForm.eta}
                        onChange={(e) =>
                          setEditForm(f => ({ ...f, eta: e.target.value }))
                        }
                        sx={neutralTextFieldSx}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            ) : (
              <Grid container spacing={3} className="pt-2">
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Reference No.
                  </Typography>
                  <Typography variant="h6" className="font-medium text-ink">
                    {getReferenceNo(selectedCargo)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Contenedor
                  </Typography>
                  <Typography variant="h6" className="font-medium text-ink">
                    {selectedCargo.containerNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Estado
                  </Typography>
                  <Box className="mt-1">
                    <Chip
                      label={displayStatus(statusToSpanish[selectedCargo.status] || selectedCargo.status)}
                      color={getStatusChip(displayStatus(statusToSpanish[selectedCargo.status] || selectedCargo.status)).color}
                      icon={getStatusChip(displayStatus(statusToSpanish[selectedCargo.status] || selectedCargo.status)).icon}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Naviera
                  </Typography>
                  <Typography variant="body1" className="text-ink">
                    {selectedCargo.shippingLine || 'No especificada'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    ETA
                  </Typography>
                  <Typography variant="body1" className="text-ink">
                    {selectedCargo.eta ? new Date(selectedCargo.eta).toLocaleDateString('es-ES') : 'No especificada'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Fecha de Salida
                  </Typography>
                  <Typography variant="body1" className="text-ink">
                    {selectedCargo.departureDate ? new Date(selectedCargo.departureDate).toLocaleDateString('es-ES') : 'No especificada'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" className="text-medium-gray">
                    Ubicación Actual
                  </Typography>
                  <Typography variant="body1" className="text-ink">
                    {selectedCargo.location}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" className="text-medium-gray mb-3">
                    Historial de Estados
                  </Typography>
                  <Box sx={{ position: 'relative', pl: 3 }}>
                    {(selectedCargo as any)?.statusHistory && (selectedCargo as any).statusHistory.length > 0 ? (
                      <>
                        {/* Timeline line */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '10px',
                            top: '12px',
                            bottom: '12px',
                            width: '2px',
                            bgcolor: 'divider',
                          }}
                        />

                        {/* Timeline items - reversed to show most recent first */}
                        {[...(selectedCargo as any).statusHistory].reverse().map((history: any, index: number) => {
                          const statusSpanish = statusToSpanish[history.status] || history.status
                          const statusDisplay = displayStatus(statusSpanish)
                          const statusConfig = getStatusChip(statusDisplay)
                          const isFirst = index === 0

                          return (
                            <Box
                              key={history.id || index}
                              sx={{
                                position: 'relative',
                                pb: 3,
                                '&:last-child': { pb: 0 }
                              }}
                            >
                              {/* Timeline dot */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: '-26px',
                                  top: '4px',
                                  width: isFirst ? '20px' : '16px',
                                  height: isFirst ? '20px' : '16px',
                                  borderRadius: '50%',
                                  bgcolor: isFirst ? statusConfig.color + '.main' : 'background.paper',
                                  border: isFirst ? '3px solid' : '2px solid',
                                  borderColor: isFirst ? statusConfig.color + '.light' : 'divider',
                                  boxShadow: isFirst ? '0 0 0 4px rgba(0,0,0,0.05)' : 'none',
                                  zIndex: 1,
                                }}
                              />

                              {/* Content */}
                              <Box
                                sx={{
                                  p: 2,
                                  bgcolor: isFirst ? (t) => t.palette[statusConfig.color].light + '15' : 'background.paper',
                                  border: '1px solid',
                                  borderColor: isFirst ? statusConfig.color + '.main' : 'divider',
                                  borderRadius: 2,
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: statusConfig.color + '.main',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                  }
                                }}
                              >
                                <Box className="flex items-start justify-between gap-2">
                                  <Box className="flex items-center gap-2 flex-1">
                                    <Box sx={{ color: statusConfig.color + '.main' }}>
                                      {statusConfig.icon}
                                    </Box>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: isFirst ? 600 : 500,
                                          color: isFirst ? statusConfig.color + '.main' : 'text.primary'
                                        }}
                                      >
                                        {statusDisplay}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        {new Date(history.changedAt).toLocaleDateString('es-ES', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  {isFirst && (
                                    <Chip
                                      label="Actual"
                                      size="small"
                                      sx={{
                                        height: '20px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: statusConfig.color + '.main',
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          )
                        })}
                      </>
                    ) : (
                      <Box className="flex items-center gap-3 p-3 bg-panel rounded border border-dashed" sx={{ borderColor: 'divider' }}>
                        <Info className="text-info" />
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            Sin historial de estados
                          </Typography>
                          <Typography variant="caption" className="text-medium-gray">
                            No hay cambios de estado registrados
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {isEditing ? (
            <>
              <Button 
                onClick={handleCancelEdit}
                color="inherit"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveChanges}
                variant="contained"
                startIcon={<Check />}
              >
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpenDetailsDialog(false)}>
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Close Cargo Dialog */}
      <Dialog
        open={openCloseDialog}
        onClose={() => setOpenCloseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cerrar Contenedor
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-4">
            ¿Estás seguro de que deseas cerrar el contenedor <strong>{selectedCargo?.containerNumber}</strong>?
          </Typography>
          <Typography variant="body2" className="text-medium-gray">
            Esta acción cambiará el estado del contenedor a "En transito".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCloseDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (selectedCargo) {
                try {
                  console.log('Closing cargo ID:', selectedCargo.id)
                  const response = await fetch(`/api/cargo-management/${selectedCargo.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'IN_TRANSIT' }),
                  })

                  console.log('Close response status:', response.status)

                  if (!response.ok) {
                    const errorData = await response.json()
                    console.error('Failed to close cargo:', errorData)
                    alert(`Error: ${errorData.error || 'Failed to close cargo'}`)
                    return
                  }

                  await fetchCargoManagement()
                  setOpenCloseDialog(false)
                } catch (error) {
                  console.error('Error closing cargo:', error)
                  alert('Error closing cargo')
                }
              }
            }}
            variant="contained"
            color="error"
          >
            Cerrar Contenedor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Cargo Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box className="flex items-center gap-2">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <LocalShipping fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Nuevo Contenedor
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registra un nuevo contenedor
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 2 }}>
          {dialogReference ? (
            <Box className="flex flex-col items-center justify-center py-6 gap-3 text-center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <Check sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                ¡Contenedor creado exitosamente!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Tu referencia ha sido generada
              </Typography>

              <Box
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: 'success.main',
                  borderRadius: 3,
                  bgcolor: (t) => t.palette.success.light + '15',
                  width: '100%',
                  maxWidth: 320
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  REFERENCE NO.
                </Typography>
                <Box className="flex items-center justify-center gap-2">
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: 'success.main'
                    }}
                  >
                    {dialogReference}
                  </Typography>
                  <Tooltip title={copiedRef ? 'Copiado' : 'Copiar referencia'}>
                    <IconButton
                      color={copiedRef ? 'success' : 'default'}
                      size="large"
                      onClick={handleCopyReference}
                      sx={{
                        bgcolor: copiedRef ? 'success.light' : 'background.paper',
                        '&:hover': {
                          bgcolor: copiedRef ? 'success.light' : 'action.hover'
                        }
                      }}
                    >
                      {copiedRef ? <Check /> : <ContentCopy />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, lineHeight: 1.6 }}>
                Guarda este código de referencia. Lo necesitarás para hacer seguimiento 
                y gestionar este contenedor en el futuro.
              </Typography>
            </Box>
          ) : (
            <Box className="space-y-3">
              {/* Información Principal */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Información Principal
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <TextField
                      label="Número de Contenedor"
                      fullWidth
                      size="small"
                      value={newCargo.contenedor}
                      placeholder="Ej: MSCU1234567"
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) =>
                        setNewCargo(f => ({
                          ...f,
                          contenedor: e.target.value.toUpperCase().replace(/\s+/g, '')
                        }))
                      }
                      sx={neutralTextFieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Naviera"
                      fullWidth
                      size="small"
                      value={newCargo.naviera}
                      placeholder="Ej: Maersk"
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) =>
                        setNewCargo(f => ({
                          ...f,
                          naviera: e.target.value.trim()
                        }))
                      }
                      sx={neutralTextFieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Ubicación Actual"
                      fullWidth
                      size="small"
                      value={newCargo.ubicacion}
                      placeholder="Ej: Puerto de Colón"
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => setNewCargo(f => ({ ...f, ubicacion: e.target.value }))}
                      sx={neutralTextFieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Estado y Fechas */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Estado y Programación
                </Typography>
                
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                      Estado Inicial
                    </Typography>
                    <Box
                      sx={{
                        p: 1,
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        bgcolor: (t) => t.palette.primary.light + '08',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minHeight: '36px',
                      }}
                    >
                      <Warehouse color="primary" sx={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main', fontSize: '0.85rem' }}>
                        {displayStatus(newCargo.status)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha de Salida"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={newCargo.fechaSalida}
                      onChange={(e) =>
                        setNewCargo(f => ({ ...f, fechaSalida: e.target.value }))
                      }
                      sx={neutralTextFieldSx}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Fecha ETA"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={newCargo.eta}
                      onChange={(e) =>
                        setNewCargo(f => ({ ...f, eta: e.target.value }))
                      }
                      sx={neutralTextFieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Nota Informativa Simplificada */}
              <Box
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'info.light',
                  borderRadius: 1.5,
                  bgcolor: (t) => t.palette.info.light + '08',
                  borderLeft: '3px solid',
                  borderLeftColor: 'info.main'
                }}
              >
                <Box className="flex gap-1.5">
                  <Info color="info" sx={{ fontSize: 16 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, fontSize: '0.8rem' }}>
                      Registra lo que tengas disponible
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Puedes completar o modificar la información más adelante.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 0.5 }}>
          {dialogReference ? (
            <>
              <Button
                onClick={() => {
                  setNewCargo({
                    contenedor: '',
                    eta: '',
                    ubicacion: '',
                    status: 'Recibido en Bodega',
                    fechaSalida: '',
                    naviera: '',
                  })
                  setDialogReference(null)
                }}
                startIcon={<LocalShipping />}
              >
                Agregar otro
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDialogReference(null)
                  setOpenAddDialog(false)
                }}
              >
                Finalizar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setNewCargo({
                    contenedor: '',
                    eta: '',
                    ubicacion: '',
                    status: 'Recibido en Bodega',
                    fechaSalida: '',
                    naviera: '',
                  })
                  setDialogReference(null)
                }}
                color="inherit"
              >
                Limpiar
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={() => setOpenAddDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    const statusEnglish = statusToEnglish[newCargo.status] || newCargo.status
                    const payload = {
                      containerNumber: newCargo.contenedor.trim() || undefined,
                      eta: newCargo.eta || undefined,
                      location: newCargo.ubicacion.trim() || undefined,
                      status: statusEnglish,
                      departureDate: newCargo.fechaSalida || undefined,
                      shippingLine: newCargo.naviera.trim() || undefined,
                    }

                    console.log('Creating cargo with payload:', payload)

                    const response = await fetch('/api/cargo-management', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })

                    if (!response.ok) {
                      const errorData = await response.json()
                      console.error('Failed to create cargo:', errorData)
                      alert(`Error: ${errorData.error || 'Failed to create cargo'}\n${errorData.details ? JSON.stringify(errorData.details) : ''}`)
                      return
                    }

                    const created = await response.json()
                    console.log('Cargo created:', created)
                    const newRef = created.referenceNo || 'N/A'
                    setDialogReference(newRef)
                    await fetchCargoManagement()

                    setNewCargo({
                      contenedor: '',
                      eta: '',
                      ubicacion: '',
                      status: 'Recibido en Bodega',
                      fechaSalida: '',
                      naviera: '',
                    })
                  } catch (error) {
                    console.error('Error creating cargo management:', error)
                  }
                }}
                startIcon={<Check />}
              >
                Crear
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ADD: restored TabPanel (was removed causing ReferenceError)
interface TabPanelProps {
  children?: ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  )
}