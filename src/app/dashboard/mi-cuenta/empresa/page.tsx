'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material'
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
  Category,
  People,
  CalendarToday,
  CheckCircle,
  Flight,
  DirectionsBoat,
  Home,
  Info,
  ContentCopy,
} from '@mui/icons-material'

interface CompanyData {
  id: string
  company_id: string | null
  name: string
  ruc: string
  dv: string
  address: string
  phone: string
  email: string
  website: string | null
  industry: string | null
  employees: string | null
  established: string | null
  isActive: boolean
  createdAt: string
}

interface ShippingAddress {
  id: string
  type: 'air' | 'maritime'
  countryCode: string
  // Air shipping fields
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  // Maritime shipping fields
  province?: string
  district?: string
  street?: string
  address?: string
  // Common fields
  recipient: string
  phone: string
  note?: string
  color: 'primary' | 'error' | 'success' | 'warning'
  borderColor: string
}

export default function PerfilEmpresaPage() {
  const { data: session, status } = useSession()
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const shippingAddresses: ShippingAddress[] = [
    {
      id: 'china-air',
      type: 'air',
      countryCode: '中国 (China)',
      province: '广东省',
      city: '广州市',
      district: '南沙区',
      street: '大岗镇',
      address: '荔岗路 1号2栋101厂之121',
      recipient: 'AIR',
      phone: '13536140636',
      note: '注：送货前一定要先联系仓库，如货物太大件，太重，太多，仓库不负责卸货',
      color: 'success',
      borderColor: 'border-green-600',
    },
    {
      id: 'china-maritime',
      type: 'maritime',
      countryCode: '中国 (China)',
      province: '广东省',
      city: '广州市',
      district: '南沙区',
      street: '大岗镇',
      address: '荔岗路 1号2栋101厂之121',
      recipient: '',
      phone: '13536140636',
      note: '注：送货前一定要先联系仓库，如货物太大件，太重，太多，仓库不负责卸货',
      color: 'success',
      borderColor: 'border-green-600',
    },
  ]

  const airShippingAddresses = shippingAddresses.filter(addr => addr.type === 'air')
  const maritimeShippingAddresses = shippingAddresses.filter(addr => addr.type === 'maritime')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchCompanyData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setError('No autenticado')
    }
  }, [status, session])

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/company/profile')
      const data = await response.json()

      if (response.ok) {
        setCompanyData(data)
        setError(null)
      } else {
        setError(data.error || 'Error al cargar los datos de la empresa')
      }
    } catch (error) {
      console.error('Error fetching company data:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleCopyAddress = async (address: ShippingAddress) => {
    const formattedText = `Provincia: ${address.province}
ciudad: ${address.city}
distrito: ${address.district}
calle: ${address.street}
direccion: ${address.address} (${companyData?.company_id})
Nombre del destinatario: ${address.recipient} ${companyData?.company_id} - ${companyData?.name}
Número de teléfono: ${address.phone}

${address.note || ''}`

    try {
      await navigator.clipboard.writeText(formattedText)
      setCopySuccess(true)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleCopyField = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopySuccess(true)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleCloseSnackbar = () => {
    setCopySuccess(false)
  }

  if (loading || status === 'loading') {
    return (
      <Box className="flex justify-center items-center h-96">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box className="space-y-6">
        <Box>
          <Typography variant="h4" className="font-bold text-ink mb-2">
            Perfil de la Empresa
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Información corporativa y datos fiscales de la empresa
          </Typography>
        </Box>

        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={fetchCompanyData}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>

        {error.includes('No hay empresa') && (
          <Card>
            <CardContent className="p-8 text-center">
              <Business sx={{ fontSize: 64, color: '#9CA3AF', mb: 2 }} />
              <Typography variant="h6" className="text-ink mb-2">
                Sin Empresa Asociada
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Tu cuenta de usuario no está asociada a ninguna empresa.
                Contacta al administrador para más información.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    )
  }

  return (
    <Box className="space-y-8 pb-8">
      {/* Page Header */}
      <Box className="space-y-3">
        <Typography variant="h3" className="font-bold text-ink tracking-tight">
          Perfil de la Empresa
        </Typography>
        <Typography variant="body1" className="text-medium-gray text-lg">
          Información corporativa y datos fiscales de la empresa
        </Typography>
      </Box>

      {/* Company Header Card */}
      <Card elevation={3} className="overflow-hidden">
        <CardContent className="p-0">
          {/* Main Header Section */}
          <Box className="relative bg-gradient-to-r from-gray-50 to-gray-100 p-8">
            <Box className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Company Icon */}
              <Box className="relative">
                <Box className="bg-gradient-to-br from-brand-primary to-brand-secondary p-6 rounded-3xl shadow-xl">
                  <Business sx={{ fontSize: 64, color: 'white' }} />
                </Box>
                {companyData?.isActive && (
                  <Box className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                    <CheckCircle sx={{ fontSize: 32, color: '#16a34a' }} />
                  </Box>
                )}
              </Box>

              {/* Company Information */}
              <Box className="flex-1 text-center md:text-left">
                <Box className="mb-4">
                  <Typography variant="h3" className="font-bold text-gray-900 mb-2" sx={{ letterSpacing: '-0.025em' }}>
                    {companyData?.name}
                  </Typography>
                  {companyData?.isActive && (
                    <Chip
                      label="Empresa Activa"
                      size="small"
                      sx={{
                        bgcolor: '#dcfce7',
                        color: '#166534',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>

                {/* Company ID - Prominent Display */}
                <Box className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-brand-primary/20 mb-4">
                  <Typography variant="caption" className="text-gray-600 font-semibold uppercase tracking-wide">
                    ID:
                  </Typography>
                  <Typography variant="h6" className="font-mono font-bold text-brand-primary">
                    {companyData?.company_id || 'No asignado'}
                  </Typography>
                  <Tooltip title="Este ID se usa en todas las direcciones de envío">
                    <Info sx={{ fontSize: 18, color: '#9ca3af', cursor: 'help' }} />
                  </Tooltip>
                </Box>

                {/* Contact Information */}
                <Box className="space-y-2">
                  <Box className="flex flex-col sm:flex-row gap-4">
                    <Box className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <Email sx={{ fontSize: 18, color: '#ef4444' }} />
                      <Typography variant="body2" className="font-medium text-gray-700">
                        {companyData?.email}
                      </Typography>
                    </Box>
                    <Box className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                      <Phone sx={{ fontSize: 18, color: '#ef4444' }} />
                      <Typography variant="body2" className="font-medium text-gray-700">
                        {companyData?.phone}
                      </Typography>
                    </Box>
                  </Box>

                  {companyData?.createdAt && (
                    <Box className="inline-flex items-center gap-2 text-gray-600">
                      <CalendarToday sx={{ fontSize: 16 }} />
                      <Typography variant="caption" className="font-medium">
                        Registrada desde {formatDate(companyData.createdAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card elevation={1} className="border border-gray-200">
        <CardContent className="p-8">
          <Typography
            variant="h5"
            className="font-bold text-ink mb-6 flex items-center gap-3 tracking-tight"
          >
            <Business className="text-brand-primary" fontSize="medium" />
            Información Corporativa
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2"
                >
                  Nombre de la Empresa
                </Typography>
                <Typography variant="h6" className="font-bold text-ink">
                  {companyData?.name}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2"
                >
                  RUC
                </Typography>
                <Typography
                  variant="h6"
                  className="font-bold text-ink font-mono"
                >
                  {companyData?.ruc}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2"
                >
                  DV
                </Typography>
                <Typography
                  variant="h6"
                  className="font-bold text-ink font-mono"
                >
                  {companyData?.dv}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                >
                  <LocationOn fontSize="small" />
                  Dirección
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink text-lg">
                  {companyData?.address}
                </Typography>
              </Box>
            </Grid>

            {/* Contact Information Group */}
            <Grid item xs={12}>
              <Divider className="my-4">
                <Chip label="Información de Contacto" size="small" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                >
                  <Phone fontSize="small" />
                  Teléfono Corporativo
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink text-lg">
                  {companyData?.phone}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                <Typography
                  variant="caption"
                  className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                >
                  <Email fontSize="small" />
                  Email Corporativo
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink text-lg">
                  {companyData?.email}
                </Typography>
              </Box>
            </Grid>

            {companyData?.website && (
              <Grid item xs={12} md={6}>
                <Box className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-brand-primary/30 transition-all duration-200">
                  <Typography
                    variant="caption"
                    className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                  >
                    <Language fontSize="small" />
                    Sitio Web
                  </Typography>
                  <Typography variant="body1" className="font-semibold text-ink text-lg">
                    {companyData.website}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Additional Information - Only show if exists */}
            {(companyData?.industry || companyData?.employees || companyData?.established) && (
              <>
                <Grid item xs={12}>
                  <Divider className="my-4">
                    <Chip label="Información Adicional" size="small" />
                  </Divider>
                </Grid>

                {companyData?.industry && (
                  <Grid item xs={12} md={6}>
                    <Box className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <Typography
                        variant="caption"
                        className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                      >
                        <Category fontSize="small" />
                        Industria
                      </Typography>
                      <Typography variant="body1" className="font-semibold text-ink">
                        {companyData.industry}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {companyData?.employees && (
                  <Grid item xs={12} md={6}>
                    <Box className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <Typography
                        variant="caption"
                        className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                      >
                        <People fontSize="small" />
                        Número de Empleados
                      </Typography>
                      <Typography variant="body1" className="font-semibold text-ink">
                        {companyData.employees}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {companyData?.established && (
                  <Grid item xs={12} md={6}>
                    <Box className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <Typography
                        variant="caption"
                        className="text-medium-gray font-semibold uppercase tracking-wide block mb-2 flex items-center gap-1"
                      >
                        <CalendarToday fontSize="small" />
                        Año de Fundación
                      </Typography>
                      <Typography variant="body1" className="font-semibold text-ink">
                        {companyData.established}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Shipping Addresses Section */}
      <Box>
        <Card elevation={1} className="border border-gray-200">
          <CardContent className="p-8">
            <Typography
              variant="h5"
              className="font-bold text-ink mb-6 flex items-center gap-3 tracking-tight"
            >
              <LocationOn className="text-brand-primary" fontSize="medium" />
              Direcciones de Envío
            </Typography>

            <Grid container spacing={6}>
          {/* Air Shipping Column */}
          <Grid item xs={12} lg={6}>
            <Card elevation={3} className="overflow-hidden h-full">
              <CardContent className="p-0">
                <Box className="relative bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                  <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-4">
                      <Box className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-3xl shadow-xl">
                        <Flight sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" className="font-bold text-gray-900" sx={{ letterSpacing: '-0.025em' }}>
                          Envíos Aéreos
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Entrega rápida internacional
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Copiar dirección completa">
                      <IconButton
                        onClick={() => airShippingAddresses[0] && handleCopyAddress(airShippingAddresses[0])}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                        }}
                        size="large"
                      >
                        <ContentCopy className="text-gray-600" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>

              <CardContent className="p-8">
                <Box className="space-y-6">
                  {airShippingAddresses.map((address) => (
                    <Box key={address.id}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Paper elevation={0} className="p-5 bg-white border-2 border-blue-100 rounded-xl">
                            <Grid container spacing={3}>
                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Provincia (省)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.province}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.province || '')}>
                                        <ContentCopy fontSize="small" className="text-blue-500" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Ciudad (市)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.city}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.city || '')}>
                                        <ContentCopy fontSize="small" className="text-blue-500" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Distrito (区)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.district}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.district || '')}>
                                        <ContentCopy fontSize="small" className="text-blue-500" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Calle (街道)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.street}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.street || '')}>
                                        <ContentCopy fontSize="small" className="text-blue-500" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Box className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                            <Box className="flex items-center gap-2 mb-3">
                              <Home className="text-blue-600" />
                              <Typography variant="subtitle2" className="text-gray-600 font-semibold uppercase tracking-wide">
                                Dirección Completa (地址)
                              </Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink flex-1">
                                {address.address} ({companyData?.company_id})
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.address} (${companyData?.company_id})`)}>
                                  <ContentCopy fontSize="small" className="text-blue-600" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box className="space-y-2">
                            <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                              Destinatario (收件人)
                            </Typography>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink flex-1">
                                {address.recipient} {companyData?.company_id}-{companyData?.name}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.recipient} ${companyData?.company_id}-${companyData?.name}`)}>
                                  <ContentCopy fontSize="small" className="text-blue-500" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box className="space-y-2">
                            <Box className="flex items-center gap-2">
                              <Phone fontSize="small" className="text-blue-500" />
                              <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                Teléfono (电话)
                              </Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink font-mono flex-1">
                                {address.phone}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(address.phone)}>
                                  <ContentCopy fontSize="small" className="text-blue-500" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        {address.note && (
                          <Grid item xs={12}>
                            <Alert
                              severity="warning"
                              icon={<Info />}
                              className="border-l-4 border-orange-400 mt-2"
                              sx={{ backgroundColor: '#FFF4E5' }}
                              action={
                                <Tooltip title="Copiar nota">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyField(address.note || '')}
                                  >
                                    <ContentCopy fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              }
                            >
                              <Typography variant="body2" className="font-semibold">
                                {address.note}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Maritime Shipping Column */}
          <Grid item xs={12} lg={6}>
            <Card elevation={3} className="overflow-hidden h-full">
              <CardContent className="p-0">
                <Box className="relative bg-gradient-to-r from-gray-50 to-gray-100 p-6">
                  <Box className="flex items-center justify-between">
                    <Box className="flex items-center gap-4">
                      <Box className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-3xl shadow-xl">
                        <DirectionsBoat sx={{ fontSize: 40, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" className="font-bold text-gray-900" sx={{ letterSpacing: '-0.025em' }}>
                          Envíos Marítimos
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Entrega económica para grandes volúmenes
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Copiar dirección completa">
                      <IconButton
                        onClick={() => maritimeShippingAddresses[0] && handleCopyAddress(maritimeShippingAddresses[0])}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(0,0,0,0.05)',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                        }}
                        size="large"
                      >
                        <ContentCopy className="text-gray-600" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>

              <CardContent className="p-8">
                <Box className="space-y-6">
                  {maritimeShippingAddresses.map((address) => (
                    <Box key={address.id}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Paper elevation={0} className="p-5 bg-white border-2 border-green-100 rounded-xl">
                            <Grid container spacing={3}>
                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Provincia (省)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.province}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.province || '')}>
                                        <ContentCopy fontSize="small" className="text-green-600" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Ciudad (市)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.city}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.city || '')}>
                                        <ContentCopy fontSize="small" className="text-green-600" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Distrito (区)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.district}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.district || '')}>
                                        <ContentCopy fontSize="small" className="text-green-600" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>

                              <Grid item xs={6}>
                                <Box className="space-y-2">
                                  <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                    Calle (街道)
                                  </Typography>
                                  <Box className="flex items-center gap-2">
                                    <Typography variant="h6" className="font-bold text-ink flex-1">
                                      {address.street}
                                    </Typography>
                                    <Tooltip title="Copiar">
                                      <IconButton size="small" onClick={() => handleCopyField(address.street || '')}>
                                        <ContentCopy fontSize="small" className="text-green-600" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Box className="bg-green-50 p-5 rounded-xl border border-green-200">
                            <Box className="flex items-center gap-2 mb-3">
                              <Home className="text-green-600" />
                              <Typography variant="subtitle2" className="text-gray-600 font-semibold uppercase tracking-wide">
                                Dirección Completa (地址)
                              </Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink flex-1">
                                {address.address} ({companyData?.company_id})
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.address} (${companyData?.company_id})`)}>
                                  <ContentCopy fontSize="small" className="text-green-600" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box className="space-y-2">
                            <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                              Destinatario (收件人)
                            </Typography>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink flex-1">
                                {address.recipient} {companyData?.company_id}-{companyData?.name}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.recipient} ${companyData?.company_id}-${companyData?.name}`)}>
                                  <ContentCopy fontSize="small" className="text-green-600" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box className="space-y-2">
                            <Box className="flex items-center gap-2">
                              <Phone fontSize="small" className="text-green-600" />
                              <Typography variant="caption" className="text-gray-500 font-semibold uppercase tracking-wide">
                                Teléfono (电话)
                              </Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                              <Typography variant="body1" className="font-bold text-ink font-mono flex-1">
                                {address.phone}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(address.phone)}>
                                  <ContentCopy fontSize="small" className="text-green-600" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Grid>

                        {address.note && (
                          <Grid item xs={12}>
                            <Alert
                              severity="warning"
                              icon={<Info />}
                              className="border-l-4 border-orange-400 mt-2"
                              sx={{ backgroundColor: '#FFF4E5' }}
                              action={
                                <Tooltip title="Copiar nota">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyField(address.note || '')}
                                  >
                                    <ContentCopy fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              }
                            >
                              <Typography variant="body2" className="font-semibold">
                                {address.note}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar for copy success */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Dirección copiada al portapapeles"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
