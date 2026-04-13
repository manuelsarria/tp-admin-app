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
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  Add,
  Person,
  Edit,
  Email,
  Phone,
  PersonOff,
  PersonAdd,
  Business,
  Search,
  FilterList,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid'

interface User {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  companyId: string | null
  mailbox: string | null
  address: string | null
  ruc_id: string | null
  company?: {
    id: string
    name: string
  } | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Company {
  id: string
  name: string
  ruc: string
  company_id: string | null
  isActive: boolean
}

interface UserFormData {
  name: string
  email: string
  phone: string
  role: string
  companyId: string | null
  mailbox: string
  address: string
  ruc_id: string
  requiresMailbox: boolean
  password?: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  WORKER: 'Trabajador',
  BUSINESS_USER: 'Usuario de Empresa',
  CUSTOMER_USER: 'Usuario de Cliente',
  MBE_MANAGER: 'Gerencia MBE',
}

const roleColors: Record<string, 'error' | 'info' | 'success' | 'warning' | 'default'> = {
  ADMIN: 'error',
  WORKER: 'info',
  BUSINESS_USER: 'success',
  CUSTOMER_USER: 'warning',
  MBE_MANAGER: 'default',
}

export default function PermisosUsuariosPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'BUSINESS_USER',
    companyId: null,
    mailbox: '',
    address: '',
    ruc_id: '',
    requiresMailbox: false,
  })
  const [formErrors, setFormErrors] = useState({
    email: '',
    phone: '',
    password: '',
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchData()
    } else if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
      setLoading(false)
      setError('Acceso denegado')
    }
  }, [status, session])

  const fetchCompanies = async () => {
    try {
      // Fetch companies using the active companies endpoint - NO CACHING
      const companiesRes = await fetch('/api/companies/active', {
        method: 'GET',
        cache: 'no-store', // Disable caching completely
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })

      if (companiesRes.ok) {
        const companiesList = await companiesRes.json()
        console.log('Companies fetched:', companiesList)
        console.log('Companies count:', companiesList.length)
        console.log('Active companies:', companiesList.filter((c: Company) => c.isActive).length)
        setCompanies(companiesList)
      } else {
        console.error('Failed to fetch companies:', companiesRes.statusText)
        const errorData = await companiesRes.json().catch(() => ({}))
        console.error('Companies error data:', errorData)
        setCompanies([]) // Set empty array on error
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch users
      const usersRes = await fetch('/api/users')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        console.log('Users fetched:', usersData.length)
        setUsers(usersData)
      } else {
        const usersError = await usersRes.json()
        console.error('Users fetch error:', usersError)
        setError(usersError.error || 'Error al cargar usuarios')
      }

      // Fetch companies
      await fetchCompanies()
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7
  }

  const validatePassword = (password: string): boolean => {
    if (!password) return true // Password is optional when editing
    // Minimum 6 characters
    return password.length >= 6
  }

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }))
    if (email && !validateEmail(email)) {
      setFormErrors(prev => ({ ...prev, email: 'Email inválido' }))
    } else {
      setFormErrors(prev => ({ ...prev, email: '' }))
    }
  }

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers, spaces, dashes, parentheses and plus sign
    const sanitized = phone.replace(/[^\d\s\-+()]/g, '')
    setFormData(prev => ({ ...prev, phone: sanitized }))
    if (sanitized && !validatePhone(sanitized)) {
      setFormErrors(prev => ({ ...prev, phone: 'Teléfono debe tener al menos 7 dígitos' }))
    } else {
      setFormErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }))
    if (password && !validatePassword(password)) {
      setFormErrors(prev => ({
        ...prev,
        password: 'La contraseña debe tener al menos 6 caracteres'
      }))
    } else {
      setFormErrors(prev => ({ ...prev, password: '' }))
    }
  }

  const isFormValid = (): boolean => {
    const hasName = formData.name.trim().length > 0
    const hasValidEmail = formData.email.trim().length > 0 && validateEmail(formData.email)
    const hasValidPhone = !formData.phone || validatePhone(formData.phone)
    const hasValidPassword = !formData.password || validatePassword(formData.password)
    return hasName && hasValidEmail && hasValidPhone && hasValidPassword
  }

  const handleAddUser = async () => {
    console.log('Opening add user dialog, companies available:', companies)
    // Fetch fresh company data when dialog opens (NO CACHING)
    await fetchCompanies()
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'BUSINESS_USER',
      companyId: null,
      mailbox: '',
      address: '',
      ruc_id: '',
      requiresMailbox: false,
      password: '',
    })
    setFormErrors({ email: '', phone: '', password: '' })
    setOpenDialog(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      companyId: user.companyId || null,
      mailbox: user.mailbox || '',
      address: user.address || '',
      ruc_id: user.ruc_id || '',
      requiresMailbox: !!user.mailbox,
      password: '',
    }
    setFormData(userData)

    // Validate existing data
    const errors = { email: '', phone: '', password: '' }
    if (userData.email && !validateEmail(userData.email)) {
      errors.email = 'Email inválido'
    }
    if (userData.phone && !validatePhone(userData.phone)) {
      errors.phone = 'Teléfono debe tener al menos 7 dígitos'
    }
    setFormErrors(errors)

    setOpenDialog(true)
  }

  const handleDeleteUser = () => {
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!editingUser) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !editingUser.isActive,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
        setOpenDeleteDialog(false)
        setOpenDialog(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar usuario')
      }
    } catch (err) {
      console.error('Error toggling user status:', err)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Por favor corrige los errores en el formulario')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Prepare data for API (exclude requiresMailbox which is frontend only)
      const apiData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        companyId: formData.companyId,
        mailbox: formData.mailbox,
        address: formData.address,
        ruc_id: formData.ruc_id,
      }

      // Only include password when editing and if it's provided
      if (editingUser && formData.password) {
        apiData.password = formData.password
      }

      if (editingUser) {
        // Update existing user
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        })

        if (response.ok) {
          const updatedUser = await response.json()
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
          setOpenDialog(false)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Error al actualizar usuario')
        }
      } else {
        // Create new user
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        })

        if (response.ok) {
          const newUser = await response.json()
          setUsers(prev => [newUser, ...prev])
          setOpenDialog(false)
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Error al crear usuario')
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleChip = (role: string) => {
    return (
      <Chip
        label={roleLabels[role] || role}
        color={roleColors[role] || 'default'}
        size="small"
        variant="outlined"
      />
    )
  }

  const getStatusChip = (isActive: boolean) => {
    return (
      <Chip
        label={isActive ? 'Activo' : 'Inactivo'}
        color={isActive ? 'success' : 'default'}
        size="small"
        variant={isActive ? 'filled' : 'outlined'}
      />
    )
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.mailbox && user.mailbox.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower))

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const columns: GridColDef[] = [
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      flex: 1,
    },
    {
      field: 'name',
      headerName: 'Nombre',
      width: 150,
      flex: 1,
    },
    {
      field: 'mailbox',
      headerName: 'Casillero (Mailbox)',
      width: 180,
      flex: 1,
      valueGetter: (params) => params.row.mailbox || 'Sin casillero',
    },
    {
      field: 'role',
      headerName: 'Rol',
      width: 150,
      renderCell: (params) => getRoleChip(params.value),
    },
    {
      field: 'isActive',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => handleEditUser(params.row)}
        >
          Editar
        </Button>
      ),
    },
  ]

  if (loading || status === 'loading') {
    return (
      <Box className="flex justify-center items-center h-96">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error && error.includes('denegado')) {
    return (
      <Box className="space-y-6">
        <Alert severity="error">
          Acceso denegado. Solo los administradores pueden gestionar usuarios.
        </Alert>
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      {/* Page Header */}
      <Box className="flex justify-between items-center">
        <Box>
          <Typography variant="h4" className="font-bold text-ink mb-2">
            Permisos de Usuarios
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Gestiona los usuarios del sistema y sus permisos de acceso
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddUser}
          className="bg-brand-primary hover:bg-brand-secondary"
        >
          Añadir Usuario
        </Button>
      </Box>

      {showSuccess && (
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Operación realizada exitosamente
        </Alert>
      )}

      {error && !error.includes('denegado') && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-ink">
                {users.length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Total Usuarios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Usuarios Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-blue-600">
                {users.filter(u => u.companyId).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Con Empresa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-orange-600">
                {users.filter(u => !u.companyId).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Sin Empresa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card elevation={2}>
        <CardContent className="p-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, email, casillero o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search className="mr-2 text-medium-gray" />,
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={roleFilter}
                  label="Rol"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="WORKER">Trabajador</MenuItem>
                  <MenuItem value="BUSINESS_USER">Usuario de Empresa</MenuItem>
                  <MenuItem value="CUSTOMER_USER">Usuario de Cliente</MenuItem>
                  <MenuItem value="MBE_MANAGER">Gerencia MBE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="inactive">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box className="flex gap-2">
                <Button
                  startIcon={<FilterList />}
                  onClick={handleClearFilters}
                  size="small"
                  variant="outlined"
                  fullWidth
                >
                  Limpiar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card elevation={2}>
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-semibold text-ink">
              Lista de Usuarios
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </Typography>
          </Box>
          <Box style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '1.5rem',
            fontWeight: 600,
            paddingBottom: '8px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
        </DialogTitle>
        <DialogContent
          sx={{
            paddingTop: '24px',
          }}
        >
          <Grid container spacing={2.5} className="pt-1">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                variant="outlined"
                size="small"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#d1d5db',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                variant="outlined"
                size="small"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#d1d5db',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                placeholder="+507 999 999 999"
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#d1d5db',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={companies}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return `${option.company_id || ''} - ${option.name}`
                }}
                value={companies.find(c => c.id === formData.companyId) || null}
                onChange={(_, newValue) => {
                  console.log('Company selected:', newValue)
                  setFormData((prev) => ({ ...prev, companyId: newValue?.id || null }))
                }}
                loading={companies.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empresa"
                    placeholder="Buscar por código o nombre"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#fafbfc',
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: '#d1d5db',
                        opacity: 1,
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2">
                        <strong>{option.company_id || ''}</strong> - {option.name}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="No hay empresas disponibles"
                filterOptions={(options, { inputValue }) => {
                  const searchTerm = inputValue.toLowerCase()
                  return options.filter(
                    (option) =>
                      option.name.toLowerCase().includes(searchTerm) ||
                      (option.company_id ? option.company_id.toLowerCase().includes(searchTerm) : false)
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol del Usuario</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol del Usuario"
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  sx={{
                    borderRadius: '8px',
                  }}
                >
                  <MenuItem value="ADMIN">Administrador</MenuItem>
                  <MenuItem value="WORKER">Trabajador</MenuItem>
                  <MenuItem value="BUSINESS_USER">Usuario de Empresa</MenuItem>
                  <MenuItem value="CUSTOMER_USER">Usuario de Cliente</MenuItem>
                  <MenuItem value="MBE_MANAGER">Gerencia MBE</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Calle y número"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#d1d5db',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RUC ID"
                value={formData.ruc_id}
                onChange={(e) => setFormData(prev => ({ ...prev, ruc_id: e.target.value }))}
                placeholder="Ej: 12345678"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#fafbfc',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: '#d1d5db',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ py: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requiresMailbox}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        requiresMailbox: e.target.checked,
                        mailbox: e.target.checked ? prev.mailbox : ''
                      }))}
                      size="medium"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Requiere Casillero (Mailbox)
                    </Typography>
                  }
                />
              </Box>
            </Grid>
            {formData.requiresMailbox && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Casillero (Mailbox) *"
                  value={formData.mailbox}
                  onChange={(e) => setFormData(prev => ({ ...prev, mailbox: e.target.value }))}
                  placeholder="Ej: BOX-001 o CNC-55555"
                  required={formData.requiresMailbox}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#fafbfc',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#d1d5db',
                      opacity: 1,
                    },
                  }}
                />
              </Grid>
            )}
            {editingUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  error={!!formErrors.password}
                  helperText={formErrors.password || 'Mínimo 6 caracteres (dejar vacío para no cambiar)'}
                  placeholder="Dejar vacío para no cambiar"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      backgroundColor: '#fafbfc',
                    },
                    '& .MuiOutlinedInput-input::placeholder': {
                      color: '#d1d5db',
                      opacity: 1,
                    },
                  }}
                />
              </Grid>
            )}
            {!editingUser && (
              <Grid item xs={12}>
                <Alert severity="info" variant="outlined" sx={{ borderRadius: '8px' }}>
                  <Typography variant="body2">
                    La contraseña por defecto será: <strong>ChangeMe123!</strong>
                    <br />
                    El usuario deberá cambiarla en su primer inicio de sesión.
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            gap: 1,
          }}
        >
          <Button
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
            sx={{
              color: '#6b7280',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            Cancelar
          </Button>
          {editingUser && (
            <Button
              onClick={handleDeleteUser}
              variant="outlined"
              color={editingUser.isActive ? "error" : "success"}
              startIcon={editingUser.isActive ? <PersonOff /> : <PersonAdd />}
              disabled={submitting}
              size="small"
            >
              {editingUser.isActive ? "Desactivar" : "Activar"}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#dc3545',
              '&:hover': {
                backgroundColor: '#c82333',
              },
              textTransform: 'none',
              fontWeight: 600,
            }}
            disabled={!isFormValid() || submitting}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editingUser ? 'Actualizar' : 'Agregar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingUser?.isActive ? "Desactivar Usuario" : "Activar Usuario"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-2">
            ¿Estás seguro de que deseas {editingUser?.isActive ? "desactivar" : "activar"} la cuenta de <strong>{editingUser?.name}</strong>?
          </Typography>
          <Typography variant="body2" className="text-medium-gray">
            Esta acción cambiará el estado del usuario a "{editingUser?.isActive ? "Inactivo" : "Activo"}".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color={editingUser?.isActive ? "error" : "success"}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : (editingUser?.isActive ? "Desactivar" : "Activar")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
