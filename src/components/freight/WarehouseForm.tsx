'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'

interface ClientOption {
  id: string
  name: string
  type: 'user' | 'company'
  label: string
}

interface WarehouseEntryData {
  id: string
  clientId: string | null
  clientType: string | null
  clientName: string
  consigneeName: string | null
  description: string | null
  pieces: number
  pieceType: string
  weight: number | null
  largo: number | null
  ancho: number | null
  alto: number | null
  unidadMedida: string
  destWarehouse: string | null
  notes: string | null
}

interface Props {
  id?: string
  initial?: WarehouseEntryData
}

const PIECE_TYPES = ['Cajas', 'Pallets', 'Bultos', 'Sacos']
const DEST_OPTIONS = [
  { value: 'PANAMA_OESTE', label: 'Bodega Panamá Oeste' },
  { value: 'COLON_FREE_ZONE', label: 'Colón Free Zone' },
  { value: 'PANAMA_CIUDAD', label: 'Bodega Ciudad Panamá' },
]
const UNIT_OPTIONS = ['cm', 'm']

export function WarehouseForm({ id, initial }: Props) {
  const router = useRouter()
  const isEditing = Boolean(id)

  // Client autocomplete
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [clientsLoading, setClientsLoading] = useState(false)

  // Form fields
  const [clientName, setClientName] = useState(initial?.clientName || '')
  const [consigneeName, setConsigneeName] = useState(initial?.consigneeName || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [pieces, setPieces] = useState(initial?.pieces?.toString() || '1')
  const [pieceType, setPieceType] = useState(initial?.pieceType || 'Cajas')
  const [weight, setWeight] = useState(initial?.weight?.toString() || '')
  const [largo, setLargo] = useState(initial?.largo?.toString() || '')
  const [ancho, setAncho] = useState(initial?.ancho?.toString() || '')
  const [alto, setAlto] = useState(initial?.alto?.toString() || '')
  const [unidadMedida, setUnidadMedida] = useState(initial?.unidadMedida || 'cm')
  const [destWarehouse, setDestWarehouse] = useState(initial?.destWarehouse || '')
  const [notes, setNotes] = useState(initial?.notes || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load clients (users + companies)
  const loadClients = useCallback(async () => {
    setClientsLoading(true)
    try {
      const [usersRes, companiesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/companies'),
      ])

      const options: ClientOption[] = []

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const users = Array.isArray(usersData) ? usersData : (usersData.users || [])
        users.forEach((u: any) => {
          if (u.isActive !== false) {
            options.push({
              id: u.id,
              name: u.name,
              type: 'user',
              label: `${u.name} (Usuario)`,
            })
          }
        })
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        const companies = Array.isArray(companiesData) ? companiesData : (companiesData.companies || [])
        companies.forEach((c: any) => {
          if (c.isActive !== false) {
            options.push({
              id: c.id,
              name: c.name,
              type: 'company',
              label: `${c.name} (Empresa)`,
            })
          }
        })
      }

      setClientOptions(options)

      // Restore selection if editing
      if (initial?.clientId) {
        const found = options.find(o => o.id === initial.clientId && o.type === initial.clientType)
        if (found) setSelectedClient(found)
      }
    } catch {
      // non-critical
    } finally {
      setClientsLoading(false)
    }
  }, [initial?.clientId, initial?.clientType])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const handleClientChange = (_: any, value: ClientOption | null) => {
    setSelectedClient(value)
    if (value) {
      setClientName(value.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!clientName.trim()) {
      setError('El nombre del cliente es requerido.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        clientId: selectedClient?.id || null,
        clientType: selectedClient?.type || null,
        clientName: clientName.trim(),
        consigneeName: consigneeName.trim() || null,
        description: description.trim() || null,
        pieces,
        pieceType,
        weight: weight || null,
        largo: largo || null,
        ancho: ancho || null,
        alto: alto || null,
        unidadMedida,
        destWarehouse: destWarehouse || null,
        notes: notes.trim() || null,
      }

      const url = isEditing ? `/api/warehouse/${id}` : '/api/warehouse'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      router.push('/dashboard/freight/bodega')
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/dashboard/freight/bodega')}
          variant="outlined"
          size="small"
        >
          Volver
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {isEditing ? 'Editar Entrada' : 'Nueva Entrada de Bodega'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Client autocomplete */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={clientOptions}
              loading={clientsLoading}
              value={selectedClient}
              onChange={handleClientChange}
              getOptionLabel={o => o.label}
              groupBy={o => o.type === 'user' ? 'Usuarios' : 'Empresas'}
              isOptionEqualToValue={(o, v) => o.id === v.id && o.type === v.type}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Buscar usuario o empresa..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {clientsLoading && <CircularProgress size={16} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {/* Client name override */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Nombre del Cliente"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              fullWidth
              required
              helperText="Se autocompleta al seleccionar cliente, o escribe manualmente"
            />
          </Grid>

          {/* Consignee */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Consignee"
              value={consigneeName}
              onChange={e => setConsigneeName(e.target.value)}
              fullWidth
              placeholder="Igual que el cliente si se deja vacío"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Descripción de la Carga"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
            />
          </Grid>

          {/* Piece type */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Pieza</InputLabel>
              <Select
                value={pieceType}
                label="Tipo de Pieza"
                onChange={e => setPieceType(e.target.value)}
              >
                {PIECE_TYPES.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Quantity */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Cantidad"
              type="number"
              value={pieces}
              onChange={e => setPieces(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Weight */}
          <Grid item xs={12} md={4}>
            <TextField
              label="Peso (KG)"
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>

          {/* Dimensions */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Dimensiones
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Largo"
              type="number"
              value={largo}
              onChange={e => setLargo(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Ancho"
              type="number"
              value={ancho}
              onChange={e => setAncho(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Alto"
              type="number"
              value={alto}
              onChange={e => setAlto(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Unidad</InputLabel>
              <Select
                value={unidadMedida}
                label="Unidad"
                onChange={e => setUnidadMedida(e.target.value)}
              >
                {UNIT_OPTIONS.map(u => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Destination */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Bodega Destino</InputLabel>
              <Select
                value={destWarehouse}
                label="Bodega Destino"
                onChange={e => setDestWarehouse(e.target.value)}
              >
                <MenuItem value="">Sin especificar</MenuItem>
                {DEST_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Notas"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/dashboard/freight/bodega')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                disabled={saving}
                sx={{
                  bgcolor: '#FACC15',
                  '&:hover': { bgcolor: '#EAB308' },
                }}
              >
                {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Entrada'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
