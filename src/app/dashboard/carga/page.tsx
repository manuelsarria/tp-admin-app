'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  LocalShipping,
  Flight,
  DirectionsBoat,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid'

interface JoinedCargoData {
  fclId: string
  trackingWarehouse: string
  forwarder: string | null
  mailbox: string
  transportType: 'AIR' | 'MAR'
  containerNumber: string
  approximateDate: Date | null
  misidentified: boolean
  dangerousGoods: boolean
  refrigeratedProduct: boolean
  fclCreatedAt: Date
  fclUpdatedAt: Date
  cargoManagementId: string
  referenceNo: string | null
  eta: Date | null
  location: string
  status: string
  shippingLine: string | null
  departureDate: Date | null
  cmCreatedAt: Date
  cmUpdatedAt: Date
}

export default function CargaPage() {
  const { data: session, status } = useSession()
  const [cargos, setCargos] = useState<JoinedCargoData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only fetch when session is ready
    if (status === 'authenticated') {
      fetchCargos()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchCargos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cargos/joined')

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setCargos(data.data || [])
    } catch (error) {
      console.error('Error fetching cargos:', error)
      setCargos([])
    } finally {
      setLoading(false)
    }
  }

  const getEstadoChip = (status: string) => {
    const statusMap: Record<string, { label: string; color: 'info' | 'success' | 'warning' | 'default' }> = {
      'RECEIVED_IN_WAREHOUSE': { label: 'Recibido en Bodega', color: 'info' },
      'IN_TRANSIT': { label: 'En Tránsito', color: 'warning' },
      'ARRIVED_PANAMA': { label: 'Arribó a Panamá', color: 'success' },
      'READY_FOR_DELIVERY': { label: 'Listo para Entrega', color: 'success' },
    }

    const config = statusMap[status] || { label: status, color: 'default' as const }

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    )
  }

  const getTipoChip = (type: 'AIR' | 'MAR') => {
    return (
      <Chip
        label={type === 'AIR' ? 'Aéreo' : 'Marítimo'}
        color={type === 'MAR' ? 'primary' : 'secondary'}
        size="small"
        variant="outlined"
        icon={type === 'MAR' ? <DirectionsBoat /> : <Flight />}
      />
    )
  }

  const columns: GridColDef[] = [
    {
      field: 'trackingWarehouse',
      headerName: 'Tracking/WH',
      width: 150,
      flex: 1,
    },
    {
      field: 'referenceNo',
      headerName: 'N° Referencia',
      width: 150,
    },
    {
      field: 'mailbox',
      headerName: 'Casillero',
      width: 120,
    },
    {
      field: 'transportType',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => getTipoChip(params.value),
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 180,
      renderCell: (params) => getEstadoChip(params.value),
    },
    {
      field: 'location',
      headerName: 'Ubicación',
      width: 150,
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '-',
    },
    {
      field: 'shippingLine',
      headerName: 'Línea Naviera',
      width: 150,
    },
  ]

  const rows: GridRowsProp = cargos.map(cargo => ({
    id: cargo.fclId,
    trackingWarehouse: cargo.trackingWarehouse,
    referenceNo: cargo.referenceNo,
    mailbox: cargo.mailbox,
    transportType: cargo.transportType,
    status: cargo.status,
    location: cargo.location,
    eta: cargo.eta,
    shippingLine: cargo.shippingLine,
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
            Gestión de Carga
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Administra y da seguimiento a todos los cargos
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-bold text-ink">
              {cargos.length}
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              Total Cargos
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-bold text-info">
              {cargos.filter(c => c.status === 'RECEIVED_IN_WAREHOUSE').length}
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              Recibidos en Bodega
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-bold text-warning">
              {cargos.filter(c => c.status === 'IN_TRANSIT').length}
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              En Tránsito
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Typography variant="h6" className="font-bold text-success">
              {cargos.filter(c => c.status === 'ARRIVED_PANAMA' || c.status === 'READY_FOR_DELIVERY').length}
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              Listos / Arribados
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          {cargos.length === 0 ? (
            <Box className="flex flex-col justify-center items-center py-12">
              <LocalShipping sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" className="text-medium-gray text-center">
                No hay datos de carga disponibles
              </Typography>
              <Typography variant="body2" className="text-medium-gray text-center mt-2">
                {session?.user?.role === 'CUSTOMER_USER'
                  ? 'No tienes envíos asignados en este momento'
                  : 'No hay cargos para mostrar'}
              </Typography>
            </Box>
          ) : (
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
                disableRowSelectionOnClick
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}