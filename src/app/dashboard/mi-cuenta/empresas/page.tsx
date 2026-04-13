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
  Chip,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Add,
  Business,
  Edit,
  Delete,
  LocationOn,
  Email,
  Phone,
  Language,
  Domain,
  Person,
  Search,
  FilterList,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid'
import type { Company, CompanyWithCounts } from '@/types'

interface CompanyFormData {
  company_id: string
  name: string
  ruc: string
  dv: string
  address: string
  phone: string
  email: string
  website?: string
  industry?: string
  employees?: string
  established?: string
}

interface FormErrors {
  company_id: string
  name: string
  ruc: string
  dv: string
  address: string
  phone: string
  email: string
}

export default function EmpresasPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [companies, setCompanies] = useState<CompanyWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyWithCounts | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState<CompanyFormData>({
    company_id: '',
    name: '',
    ruc: '',
    dv: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    industry: '',
    employees: '',
    established: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({
    company_id: '',
    name: '',
    ruc: '',
    dv: '',
    address: '',
    phone: '',
    email: '',
  })

  // Fetch companies from API
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies?pageSize=100')
      const data = await response.json()
      setCompanies(data.data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusChip = (isActive: boolean) => {
    return (
      <Chip
        label={isActive ? 'Activa' : 'Inactiva'}
        color={isActive ? 'success' : 'default'}
        size="small"
        variant={isActive ? 'filled' : 'outlined'}
      />
    )
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {
      company_id: '',
      name: '',
      ruc: '',
      dv: '',
      address: '',
      phone: '',
      email: '',
    }

    let isValid = true

    if (!formData.company_id.trim()) {
      errors.company_id = 'ID de la empresa es requerido'
      isValid = false
    }

    if (!formData.name.trim()) {
      errors.name = 'Nombre de la empresa es requerido'
      isValid = false
    }

    if (!formData.ruc.trim()) {
      errors.ruc = 'RUC es requerido'
      isValid = false
    }

    if (!formData.dv.trim()) {
      errors.dv = 'DV es requerido'
      isValid = false
    }

    if (!formData.address.trim()) {
      errors.address = 'Dirección es requerida'
      isValid = false
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Teléfono es requerido'
      isValid = false
    }

    if (!formData.email.trim()) {
      errors.email = 'Email es requerido'
      isValid = false
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email inválido'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleAddCompany = () => {
    setEditingCompany(null)
    setFormData({
      company_id: '',
      name: '',
      ruc: '',
      dv: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      industry: '',
      employees: '',
      established: '',
    })
    setFormErrors({
      company_id: '',
      name: '',
      ruc: '',
      dv: '',
      address: '',
      phone: '',
      email: '',
    })
    setError(null)
    setOpenDialog(true)
  }

  const handleEditCompany = async (company: CompanyWithCounts) => {
    // Fetch full company details including users
    try {
      const response = await fetch(`/api/companies/${company.id}`)
      const fullCompany = await response.json()
      setEditingCompany(fullCompany)
      setFormData({
        company_id: fullCompany.company_id || '',
        name: fullCompany.name,
        ruc: fullCompany.ruc,
        dv: fullCompany.dv,
        address: fullCompany.address,
        phone: fullCompany.phone,
        email: fullCompany.email,
        website: fullCompany.website || '',
        industry: fullCompany.industry || '',
        employees: fullCompany.employees || '',
        established: fullCompany.established || '',
      })
      setFormErrors({
        company_id: '',
        name: '',
        ruc: '',
        dv: '',
        address: '',
        phone: '',
        email: '',
      })
      setError(null)
      setOpenDialog(true)
    } catch (error) {
      console.error('Error fetching company details:', error)
      setError('Error al cargar los detalles de la empresa')
    }
  }

  const handleDeleteCompany = () => {
    setOpenDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (editingCompany) {
      try {
        // If company is active, deactivate it (DELETE). If inactive, activate it (PATCH)
        if (editingCompany.isActive) {
          // Deactivate
          await fetch(`/api/companies/${editingCompany.id}`, {
            method: 'DELETE',
          })
        } else {
          // Activate
          await fetch(`/api/companies/${editingCompany.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          })
        }
        await fetchCompanies()
        setOpenDeleteDialog(false)
        setOpenDialog(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (error) {
        console.error('Error toggling company status:', error)
      }
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('Por favor complete todos los campos requeridos')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Prepare data - only send optional fields if they have values
      const dataToSend = {
        company_id: formData.company_id,
        name: formData.name,
        ruc: formData.ruc,
        dv: formData.dv,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        ...(formData.website && { website: formData.website }),
        ...(formData.industry && { industry: formData.industry }),
        ...(formData.employees && { employees: formData.employees }),
        ...(formData.established && { established: formData.established }),
      }

      let response
      if (editingCompany) {
        // Update existing company
        response = await fetch(`/api/companies/${editingCompany.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      } else {
        // Add new company
        response = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
      }

      if (response.ok) {
        await fetchCompanies()
        setOpenDialog(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        setError(errorData.error || 'Error al guardar la empresa')
      }
    } catch (error) {
      console.error('Error saving company:', error)
      setError('Error de conexión al guardar la empresa')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter companies based on search and filters
  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      company.name.toLowerCase().includes(searchLower) ||
      company.ruc.toLowerCase().includes(searchLower) ||
      company.email.toLowerCase().includes(searchLower) ||
      (company.industry && company.industry.toLowerCase().includes(searchLower)) ||
      company.phone.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && company.isActive) ||
      (statusFilter === 'inactive' && !company.isActive)

    return matchesSearch && matchesStatus
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
  }

  const columns: GridColDef[] = [
    {
      field: 'company_id',
      headerName: 'ID Empresa',
      width: 130,
    },
    {
      field: 'name',
      headerName: 'Nombre de la Empresa',
      width: 220,
      flex: 1,
    },
    {
      field: 'ruc',
      headerName: 'RUC',
      width: 150,
      renderCell: (params) => `${params.value}-${params.row.dv}`,
    },
    {
      field: 'industry',
      headerName: 'Industria',
      width: 140,
      flex: 1,
    },
    {
      field: 'userCount',
      headerName: 'Usuarios',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row._count?.users || 0}
          color="primary"
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      width: 130,
    },
    {
      field: 'isActive',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => getStatusChip(params.value),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        isAdmin ? (
          <Box className="flex gap-1">
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => handleEditCompany(params.row)}
            >
              Editar Empresa
            </Button>
          </Box>
        ) : null
      ),
    },
  ]

  const rows: GridRowsProp = filteredCompanies.map(company => ({
    id: company.id,
    company_id: (company as any).company_id || '',
    name: company.name,
    ruc: company.ruc,
    dv: company.dv,
    industry: company.industry,
    phone: company.phone,
    email: company.email,
    isActive: company.isActive,
    _count: company._count,
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
            Gestión de Empresas
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Administra las empresas registradas en el sistema
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCompany}
            className="bg-brand-primary hover:bg-brand-secondary"
          >
            Añadir empresa
          </Button>
        )}
      </Box>

      {showSuccess && (
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Operación realizada exitosamente
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Companies Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-ink">
                {companies.length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Total Empresas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-success">
                {companies.filter(c => c.isActive).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Empresas Activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-info">
                {companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Usuarios Asociados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-warning">
                {companies.filter(c => !c.isActive).length}
              </Typography>
              <Typography variant="body2" className="text-medium-gray">
                Inactivas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card elevation={2}>
        <CardContent className="p-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, RUC, email, industria o teléfono..."
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
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="active">Activas</MenuItem>
                  <MenuItem value="inactive">Inactivas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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

      {/* Companies Table */}
      <Card>
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-semibold text-ink">
              Lista de Empresas
            </Typography>
            <Typography variant="body2" className="text-medium-gray">
              Mostrando {filteredCompanies.length} de {companies.length} empresas
            </Typography>
          </Box>
          <Box style={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={rows}
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

      {/* Add/Edit Company Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCompany ? 'Editar Empresa' : 'Agregar Nueva Empresa'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} className="mb-4">
              {error}
            </Alert>
          )}
          <Grid container spacing={3} className="pt-2">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ID de la Empresa"
                value={formData.company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value.toUpperCase() }))}
                error={!!formErrors.company_id}
                helperText={formErrors.company_id || "Identificador único de la empresa"}
                required
                placeholder="ej: CNC-001"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                InputProps={{
                  startAdornment: <Business className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RUC"
                value={formData.ruc}
                onChange={(e) => setFormData(prev => ({ ...prev, ruc: e.target.value }))}
                error={!!formErrors.ruc}
                helperText={formErrors.ruc || "Registro Único de Contribuyente"}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="DV"
                value={formData.dv}
                onChange={(e) => setFormData(prev => ({ ...prev, dv: e.target.value }))}
                error={!!formErrors.dv}
                helperText={formErrors.dv || "Dígito Verificador"}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                error={!!formErrors.address}
                helperText={formErrors.address}
                required
                multiline
                rows={2}
                InputProps={{
                  startAdornment: <LocationOn className="mr-2 text-medium-gray mt-2" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono Corporativo"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
                InputProps={{
                  startAdornment: <Phone className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Corporativo"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                InputProps={{
                  startAdornment: <Email className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sitio Web"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                InputProps={{
                  startAdornment: <Language className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Industria"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                InputProps={{
                  startAdornment: <Domain className="mr-2 text-medium-gray" />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Empleados"
                value={formData.employees}
                onChange={(e) => setFormData(prev => ({ ...prev, employees: e.target.value }))}
                placeholder="ej: 50-100"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Año de Establecimiento"
                value={formData.established}
                onChange={(e) => setFormData(prev => ({ ...prev, established: e.target.value }))}
                placeholder="ej: 2020"
              />
            </Grid>

            {/* Users Associated Section - Only show when editing */}
            {editingCompany && editingCompany._count && (
              <>
                <Grid item xs={12}>
                  <Divider className="my-4" />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" className="font-semibold text-ink mb-3 flex items-center">
                    <Person className="mr-2" />
                    Usuarios Asociados ({editingCompany._count?.users || 0})
                  </Typography>
                  {editingCompany._count && editingCompany._count.users > 0 ? (
                    <Card variant="outlined">
                      <CardContent className="p-0">
                        <List>
                          {/* Users would need to be fetched separately - placeholder */}
                          {/* {editingCompany.users.map((user: any, index: number) => (
                            <div key={user.id}>
                              <ListItem>
                                <ListItemAvatar>
                                  <Avatar className="bg-brand-primary">
                                    {user.name.charAt(0)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={user.name}
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" className="text-medium-gray">
                                        {user.email}
                                      </Typography>
                                      <Chip
                                        label={user.role}
                                        size="small"
                                        variant="outlined"
                                        className="mt-1"
                                      />
                                    </Box>
                                  }
                                />
                              </ListItem>
                              {/* {index < editingCompany.users.length - 1 && <Divider />} */}
                            {/* </div> */}
                          {/* ))} */}
                        </List>
                      </CardContent>
                    </Card>
                  ) : (
                    <Alert severity="info">
                      No hay usuarios asociados a esta empresa.
                    </Alert>
                  )}
                  */
                  <Alert severity="info">
                    Los usuarios asociados se cargan por separado
                  </Alert>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            Cancelar
          </Button>
          {isAdmin && editingCompany && (
            <Button
              onClick={handleDeleteCompany}
              variant="contained"
              color={editingCompany.isActive ? "error" : "success"}
              startIcon={editingCompany.isActive ? <Delete /> : <Business />}
              disabled={submitting}
            >
              {editingCompany.isActive ? "Desactivar Empresa" : "Activar Empresa"}
            </Button>
          )}
          {isAdmin && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              className="bg-brand-primary hover:bg-brand-secondary"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : (editingCompany ? 'Actualizar' : 'Agregar')}
            </Button>
          )}
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
          {editingCompany?.isActive ? "Desactivar Empresa" : "Activar Empresa"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" className="mb-2">
            ¿Estás seguro de que deseas {editingCompany?.isActive ? "desactivar" : "activar"} la empresa <strong>{editingCompany?.name}</strong>?
          </Typography>
          <Typography variant="body2" className="text-medium-gray">
            Esta acción cambiará el estado de la empresa a "{editingCompany?.isActive ? "Inactiva" : "Activa"}".
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color={editingCompany?.isActive ? "error" : "success"}
          >
            {editingCompany?.isActive ? "Desactivar Empresa" : "Activar Empresa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
