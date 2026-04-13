'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Avatar,
  Grid,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Tooltip,
  Snackbar,
  Paper,
} from '@mui/material'
import {
  Person,
  Email,
  Phone,
  Security,
  Badge as BadgeIcon,
  CalendarToday,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  LocationOn,
  Flight,
  DirectionsBoat,
  Home,
  Info,
  ContentCopy,
} from '@mui/icons-material'

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  mailbox: string | null
  address: string | null
  ruc_id: string | null
  twoFactorEnabled: boolean
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

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  WORKER: 'Trabajador',
  BUSINESS_USER: 'Usuario de Empresa',
}

const roleColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  ADMIN: 'error',
  WORKER: 'info',
  BUSINESS_USER: 'success',
}

export default function PerfilCuentaPage() {
  const { data: session, status } = useSession()
  const [showSuccess, setShowSuccess] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [twoFASecret, setTwoFASecret] = useState('')
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAError, setTwoFAError] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')

  // Password change state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Shipping addresses - dynamically generated based on user data
  const getShippingAddresses = (): ShippingAddress[] => [
    {
      id: 'china-air',
      type: 'air',
      countryCode: '中国 (China)',
      province: '广东省',
      city: '广州市',
      district: '南沙区',
      street: '大岗镇',
      address: '荔岗路 1号2栋101厂之121',
      recipient: `AIR ${userData?.mailbox || ''} - ${userData?.name || ''}`.trim(),
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
      recipient: `${userData?.mailbox || ''} - ${userData?.name || ''}`.trim(),
      phone: '13536140636',
      note: '注：送货前一定要先联系仓库，如货物太大件，太重，太多，仓库不负责卸货',
      color: 'success',
      borderColor: 'border-green-600',
    },
  ]

  const shippingAddresses = getShippingAddresses()
  const airShippingAddresses = shippingAddresses.filter(addr => addr.type === 'air')
  const maritimeShippingAddresses = shippingAddresses.filter(addr => addr.type === 'maritime')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
      setError('No autenticado')
    } else if (status === 'loading') {
      setLoading(true)
    }
  }, [status, session])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (response.ok) {
        setUserData(data)
        setTwoFAEnabled(data.twoFactorEnabled ?? false)
        setError(null)
      } else {
        console.error('API Error:', response.status, data)
        setError(data.error || 'Error al cargar los datos')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
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

  const handlePasswordChange = async () => {
    setPasswordError(null)

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos los campos son requeridos')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(true)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => {
          setOpenPasswordDialog(false)
          setPasswordSuccess(false)
        }, 2000)
      } else {
        setPasswordError(data.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Error de conexión')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordError(null)
    setPasswordSuccess(false)
  }

  const handleCopyAddress = async (address: ShippingAddress) => {
    const formattedText = `Provincia: ${address.province}
ciudad: ${address.city}
distrito: ${address.district}
calle: ${address.street}
direccion: ${address.address} (${userData?.mailbox})
Nombre del destinatario: ${address.recipient}
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

  return (
    <Box className="space-y-6">
      {/* Page Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-ink mb-2">
          Perfil de la Cuenta
        </Typography>
        <Typography variant="body1" className="text-medium-gray">
          Información personal y detalles de cuenta
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Perfil actualizado exitosamente
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchUserData}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Profile Card */}
      <Card elevation={2}>
        <CardContent className="p-8">
          {/* Header Section with Avatar and Role */}
          <Box className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <Avatar
              sx={{ width: 140, height: 140 }}
              className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white text-5xl font-bold shadow-lg"
            >
              {userData?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>

            <Box className="flex-1 text-center md:text-left">
              <Box className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                <Typography variant="h4" className="font-bold text-ink">
                  {userData?.name || 'Usuario'}
                </Typography>
                {userData?.role && (
                  <Chip
                    label={roleLabels[userData.role] || userData.role}
                    color={roleColors[userData.role] || 'default'}
                    size="medium"
                    icon={<BadgeIcon />}
                    className="font-semibold"
                  />
                )}
              </Box>

              <Box className="flex flex-col sm:flex-row gap-4 text-medium-gray">
                <Box className="flex items-center gap-2">
                  <Email fontSize="small" />
                  <Typography variant="body2">
                    {userData?.email || 'No disponible'}
                  </Typography>
                </Box>
                {userData?.phone && (
                  <Box className="flex items-center gap-2">
                    <Phone fontSize="small" />
                    <Typography variant="body2">{userData.phone}</Typography>
                  </Box>
                )}
              </Box>

              {userData?.createdAt && (
                <Box className="flex items-center gap-2 mt-3 text-medium-gray">
                  <CalendarToday fontSize="small" />
                  <Typography variant="body2">
                    Miembro desde {formatDate(userData.createdAt)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Edit Button - Future functionality */}
            {/* <Button
              variant="outlined"
              startIcon={<EditIcon />}
              className="self-start"
            >
              Editar Perfil
            </Button> */}
          </Box>

          <Divider className="mb-6" />

          {/* Detailed Information */}
          <Typography variant="h6" className="font-semibold text-ink mb-4 flex items-center gap-2">
            <Person />
            Información Personal
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  Nombre Completo
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink">
                  {userData?.name || 'No disponible'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  Cargo/Posición
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink">
                  {userData?.role ? (roleLabels[userData.role] || userData.role) : 'No disponible'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  Correo Electrónico
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink break-all">
                  {userData?.email || 'No disponible'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  Teléfono
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink">
                  {userData?.phone || ''}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  Dirección
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink">
                  {userData?.address || ''}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Typography variant="caption" className="text-medium-gray font-medium block mb-1">
                  RUC ID
                </Typography>
                <Typography variant="body1" className="font-semibold text-ink font-mono">
                  {userData?.ruc_id || ''}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card elevation={2}>
        <CardContent className="p-6">
          <Typography variant="h6" className="font-semibold text-ink mb-4 flex items-center gap-2">
            <Security />
            Seguridad de la Cuenta
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className="p-5 border-2 border-light-gray rounded-xl hover:border-brand-primary transition-colors">
                <Typography variant="subtitle1" className="font-semibold text-ink mb-2">
                  Contraseña
                </Typography>
                <Typography variant="body2" className="text-medium-gray mb-4">
                  Mantén tu cuenta segura con una contraseña fuerte
                </Typography>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => setOpenPasswordDialog(true)}
                >
                  Cambiar Contraseña
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box className="p-5 border-2 border-light-gray rounded-xl hover:border-brand-primary transition-colors">
                <Typography variant="subtitle1" className="font-semibold text-ink mb-2">
                  Autenticación de Dos Factores (2FA)
                </Typography>
                <Typography variant="body2" className="text-medium-gray mb-4">
                  {twoFAEnabled
                    ? 'Tu cuenta está protegida con 2FA'
                    : 'Agrega una capa extra de seguridad a tu cuenta'}
                </Typography>
                {twoFAEnabled ? (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label="2FA Activo" color="success" icon={<Security />} />
                    <Button variant="outlined" color="error" size="small"
                      onClick={() => { setShow2FADisable(true); setDisablePassword(''); setTwoFAError('') }}>
                      Desactivar
                    </Button>
                  </Box>
                ) : (
                  <Button variant="contained" size="medium"
                    sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}
                    onClick={async () => {
                      setTwoFALoading(true)
                      setTwoFAError('')
                      try {
                        const res = await fetch('/api/2fa/setup', { method: 'POST' })
                        const data = await res.json()
                        if (res.ok) {
                          setQrCode(data.qrCode)
                          setTwoFASecret(data.secret)
                          setShow2FASetup(true)
                          setTwoFACode('')
                        } else {
                          setTwoFAError(data.error)
                        }
                      } catch { setTwoFAError('Error al configurar 2FA') }
                      finally { setTwoFALoading(false) }
                    }}
                    startIcon={twoFALoading ? <CircularProgress size={16} color="inherit" /> : <Security />}>
                    Activar 2FA
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Shipping Addresses Section - Only for CUSTOMER_USER role */}
      {userData?.role === 'CUSTOMER_USER' && (
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
                                {address.address} ({userData?.mailbox})
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.address} (${userData?.mailbox})`)}>
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
                                {address.recipient}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(address.recipient)}>
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
                                {address.address} ({userData?.mailbox})
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(`${address.address} (${userData?.mailbox})`)}>
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
                                {address.recipient}
                              </Typography>
                              <Tooltip title="Copiar">
                                <IconButton size="small" onClick={() => handleCopyField(address.recipient)}>
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
      )}

      {/* Change Password Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Security color="primary" />
            <Typography variant="h6">Cambiar Contraseña</Typography>
          </Box>
          <IconButton onClick={handleClosePasswordDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {passwordError && (
            <Alert severity="error" className="mb-4" onClose={() => setPasswordError(null)}>
              {passwordError}
            </Alert>
          )}

          {passwordSuccess && (
            <Alert severity="success" className="mb-4">
              ¡Contraseña actualizada exitosamente!
            </Alert>
          )}

          <Box className="space-y-4">
            <TextField
              fullWidth
              label="Contraseña Actual"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              disabled={changingPassword || passwordSuccess}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Nueva Contraseña"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              disabled={changingPassword || passwordSuccess}
              helperText="Mínimo 6 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              disabled={changingPassword || passwordSuccess}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions className="p-4">
          <Button onClick={handleClosePasswordDialog} disabled={changingPassword}>
            Cancelar
          </Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={changingPassword || passwordSuccess}
            startIcon={changingPassword ? <CircularProgress size={20} /> : <Security />}
          >
            {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onClose={() => setShow2FASetup(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          Configurar Autenticación 2FA
          <IconButton onClick={() => setShow2FASetup(false)} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              1. Escanea este código QR con tu app de autenticación (Google Authenticator, Authy, etc.)
            </Typography>
            {qrCode && (
              <Box component="img" src={qrCode} alt="QR Code" sx={{ width: 200, height: 200, mx: 'auto', mb: 2, border: '1px solid #E5E7EB', borderRadius: 2 }} />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
              Clave manual: <code style={{ background: '#0A0A0A', padding: '2px 8px', borderRadius: 4 }}>{twoFASecret}</code>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              2. Ingresa el código de 6 dígitos que muestra tu app
            </Typography>
            <TextField
              value={twoFACode}
              onChange={e => { setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6)); setTwoFAError('') }}
              placeholder="000000"
              inputProps={{ maxLength: 6, inputMode: 'numeric', style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 } }}
              sx={{ width: 220 }}
            />
            {twoFAError && <Alert severity="error" sx={{ mt: 2 }}>{twoFAError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShow2FASetup(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={twoFACode.length !== 6 || twoFALoading}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' } }}
            startIcon={twoFALoading ? <CircularProgress size={16} color="inherit" /> : <Security />}
            onClick={async () => {
              setTwoFALoading(true)
              setTwoFAError('')
              try {
                const res = await fetch('/api/2fa/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: twoFACode }),
                })
                const data = await res.json()
                if (res.ok) {
                  setTwoFAEnabled(true)
                  setShow2FASetup(false)
                  setShowSuccess(true)
                } else {
                  setTwoFAError(data.error || 'Código inválido')
                }
              } catch { setTwoFAError('Error al verificar') }
              finally { setTwoFALoading(false) }
            }}>
            Activar 2FA
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Disable Dialog */}
      <Dialog open={show2FADisable} onClose={() => setShow2FADisable(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Desactivar 2FA</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa tu contraseña para confirmar la desactivación de 2FA.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Contraseña"
            value={disablePassword}
            onChange={e => { setDisablePassword(e.target.value); setTwoFAError('') }}
          />
          {twoFAError && <Alert severity="error" sx={{ mt: 2 }}>{twoFAError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShow2FADisable(false)}>Cancelar</Button>
          <Button
            variant="contained" color="error"
            disabled={!disablePassword || twoFALoading}
            startIcon={twoFALoading ? <CircularProgress size={16} color="inherit" /> : null}
            onClick={async () => {
              setTwoFALoading(true)
              setTwoFAError('')
              try {
                const res = await fetch('/api/2fa/disable', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: disablePassword }),
                })
                const data = await res.json()
                if (res.ok) {
                  setTwoFAEnabled(false)
                  setShow2FADisable(false)
                } else {
                  setTwoFAError(data.error || 'Contraseña incorrecta')
                }
              } catch { setTwoFAError('Error al desactivar') }
              finally { setTwoFALoading(false) }
            }}>
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>

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
