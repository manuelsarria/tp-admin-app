'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'
import { Save, ArrowBack, ExpandMore } from '@mui/icons-material'

interface ClientOption {
  id: string
  name: string
  type: 'user' | 'company'
  label: string
}

interface LclBookingData {
  id: string
  warehouseEntryId?: string | null
  shipperName: string
  shipperAddress?: string | null
  clientId?: string | null
  clientType?: string | null
  clientName: string
  clientAddress?: string | null
  notifyParty?: string | null
  notifyPhone?: string | null
  portOfLoading: string
  portOfDischarge: string
  placeOfReceipt?: string | null
  placeOfDelivery?: string | null
  preCarriageBy?: string | null
  vessel?: string | null
  voyage?: string | null
  description?: string | null
  marks?: string | null
  packages: number
  packageType: string
  grossWeightKg?: number | null
  cbm?: number | null
  hsCode?: string | null
  freightTerms: string
  freightAmount?: number | null
  freightCurrency: string
  freightDesc?: string | null
  exportReference?: string | null
  documentNumber?: string | null
  notes?: string | null
  blDate?: string | null
}

interface Props {
  id?: string
  initial?: LclBookingData
}

const PACKAGE_TYPES = ['CTNS', 'PKGS', 'PLTS', 'BAGS', 'PCS']

export function LclBookingForm({ id, initial }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wrId = searchParams.get('wr')

  const [clients, setClients] = useState<ClientOption[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null)
  const [wrLinked, setWrLinked] = useState<{ wrNumber: string; id: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<Omit<LclBookingData, 'id'>>({
    warehouseEntryId: null,
    shipperName: '',
    shipperAddress: '',
    clientId: null,
    clientType: null,
    clientName: '',
    clientAddress: '',
    notifyParty: '',
    notifyPhone: '',
    portOfLoading: 'QINGDAO',
    portOfDischarge: 'BALBOA',
    placeOfReceipt: '',
    placeOfDelivery: '',
    preCarriageBy: '',
    vessel: '',
    voyage: '',
    description: '',
    marks: '',
    packages: 1,
    packageType: 'CTNS',
    grossWeightKg: null,
    cbm: null,
    hsCode: '',
    freightTerms: 'PREPAID',
    freightAmount: null,
    freightCurrency: 'USD',
    freightDesc: 'OCEAN FREIGHT',
    exportReference: '',
    documentNumber: '',
    notes: '',
    blDate: null,
  })

  // Load clients
  useEffect(() => {
    const load = async () => {
      const [usersRes, companiesRes] = await Promise.all([
        fetch('/api/users').then(r => r.ok ? r.json() : { users: [] }),
        fetch('/api/companies').then(r => r.ok ? r.json() : { companies: [] }),
      ])
      const opts: ClientOption[] = [
        ...(usersRes.users || []).map((u: any) => ({ id: u.id, name: u.name, type: 'user' as const, label: `${u.name} (Usuario)` })),
        ...(companiesRes.companies || []).map((c: any) => ({ id: c.id, name: c.name, type: 'company' as const, label: `${c.name} (Empresa)` })),
      ]
      setClients(opts)
    }
    load()
  }, [])

  // Pre-fill from initial
  useEffect(() => {
    if (initial) {
      setForm({
        warehouseEntryId: initial.warehouseEntryId ?? null,
        shipperName: initial.shipperName || '',
        shipperAddress: initial.shipperAddress || '',
        clientId: initial.clientId ?? null,
        clientType: initial.clientType ?? null,
        clientName: initial.clientName || '',
        clientAddress: initial.clientAddress || '',
        notifyParty: initial.notifyParty || '',
        notifyPhone: initial.notifyPhone || '',
        portOfLoading: initial.portOfLoading || 'QINGDAO',
        portOfDischarge: initial.portOfDischarge || 'BALBOA',
        placeOfReceipt: initial.placeOfReceipt || '',
        placeOfDelivery: initial.placeOfDelivery || '',
        preCarriageBy: initial.preCarriageBy || '',
        vessel: initial.vessel || '',
        voyage: initial.voyage || '',
        description: initial.description || '',
        marks: initial.marks || '',
        packages: initial.packages || 1,
        packageType: initial.packageType || 'CTNS',
        grossWeightKg: initial.grossWeightKg ?? null,
        cbm: initial.cbm ?? null,
        hsCode: initial.hsCode || '',
        freightTerms: initial.freightTerms || 'PREPAID',
        freightAmount: initial.freightAmount ?? null,
        freightCurrency: initial.freightCurrency || 'USD',
        freightDesc: initial.freightDesc || 'OCEAN FREIGHT',
        exportReference: initial.exportReference || '',
        documentNumber: initial.documentNumber || '',
        notes: initial.notes || '',
        blDate: initial.blDate ? new Date(initial.blDate).toISOString().split('T')[0] : null,
      })
    }
  }, [initial])

  // Pre-fill from WR query param
  useEffect(() => {
    if (!wrId) return
    fetch(`/api/warehouse/${wrId}`)
      .then(r => r.ok ? r.json() : null)
      .then(wr => {
        if (!wr) return
        setWrLinked({ wrNumber: wr.wrNumber, id: wr.id })
        setForm(prev => ({
          ...prev,
          warehouseEntryId: wr.id,
          clientId: wr.clientId || null,
          clientType: wr.clientType || null,
          clientName: wr.clientName || '',
          description: wr.description || '',
          packages: wr.pieces || 1,
          packageType: wr.pieceType === 'Cajas' ? 'CTNS' : wr.pieceType === 'Pallets' ? 'PLTS' : wr.pieceType === 'Bultos' ? 'PKGS' : wr.pieceType === 'Sacos' ? 'BAGS' : 'CTNS',
          grossWeightKg: wr.weight || null,
          placeOfDelivery: wr.destWarehouse || '',
        }))
      })
  }, [wrId])

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shipperName || !form.clientName) {
      setError('Shipper y Cliente son requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = id ? `/api/lcl-bookings/${id}` : '/api/lcl-bookings'
      const method = id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }
      router.push('/dashboard/freight/lcl/bookings')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const sectionProps = {
    sx: {
      mb: 1,
      border: '1px solid #E5E7EB',
      borderRadius: '8px !important',
      '&:before': { display: 'none' },
      boxShadow: 'none',
    },
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} variant="outlined" size="small">
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {id ? 'Editar Booking LCL' : 'Nuevo Booking LCL / HBL'}
        </Typography>
        {wrLinked && (
          <Chip label={`WR: ${wrLinked.wrNumber}`} color="info" size="small" />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── A. Shipper / Consignee ── */}
      <Accordion defaultExpanded {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>A. Shipper / Consignee</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shipper Name *"
                fullWidth
                value={form.shipperName}
                onChange={e => set('shipperName', e.target.value)}
                size="small"
                helperText="Proveedor China"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shipper Address"
                fullWidth
                value={form.shipperAddress || ''}
                onChange={e => set('shipperAddress', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={clients}
                getOptionLabel={o => o.label}
                value={selectedClient}
                onChange={(_, v) => {
                  setSelectedClient(v)
                  set('clientId', v?.id || null)
                  set('clientType', v?.type || null)
                  set('clientName', v?.name || '')
                }}
                renderInput={p => (
                  <TextField {...p} label="Cliente (Consignee)" size="small" helperText="Buscar usuario o empresa" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre Cliente *"
                fullWidth
                value={form.clientName}
                onChange={e => set('clientName', e.target.value)}
                size="small"
                helperText="Se auto-llena al seleccionar, o escribe directo"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Client Address"
                fullWidth
                value={form.clientAddress || ''}
                onChange={e => set('clientAddress', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notify Party"
                fullWidth
                value={form.notifyParty || ''}
                onChange={e => set('notifyParty', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notify Phone"
                fullWidth
                value={form.notifyPhone || ''}
                onChange={e => set('notifyPhone', e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── B. Routing ── */}
      <Accordion {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>B. Routing</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField label="Port of Loading" fullWidth size="small" value={form.portOfLoading} onChange={e => set('portOfLoading', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Port of Discharge" fullWidth size="small" value={form.portOfDischarge} onChange={e => set('portOfDischarge', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Place of Receipt" fullWidth size="small" value={form.placeOfReceipt || ''} onChange={e => set('placeOfReceipt', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Place of Delivery" fullWidth size="small" value={form.placeOfDelivery || ''} onChange={e => set('placeOfDelivery', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Pre-Carriage By" fullWidth size="small" value={form.preCarriageBy || ''} onChange={e => set('preCarriageBy', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Vessel" fullWidth size="small" value={form.vessel || ''} onChange={e => set('vessel', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField label="Voyage" fullWidth size="small" value={form.voyage || ''} onChange={e => set('voyage', e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── C. Cargo ── */}
      <Accordion defaultExpanded {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>C. Cargo</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField label="Description of Goods" fullWidth size="small" multiline rows={2} value={form.description || ''} onChange={e => set('description', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Marks & Numbers" fullWidth size="small" multiline rows={2} value={form.marks || ''} onChange={e => set('marks', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="# Packages"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                value={form.packages}
                onChange={e => set('packages', parseInt(e.target.value) || 1)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Package Type</InputLabel>
                <Select value={form.packageType} label="Package Type" onChange={e => set('packageType', e.target.value)}>
                  {PACKAGE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Gross Weight (KG)"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.grossWeightKg ?? ''}
                onChange={e => set('grossWeightKg', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="CBM"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.001' }}
                value={form.cbm ?? ''}
                onChange={e => set('cbm', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="HS Code" fullWidth size="small" value={form.hsCode || ''} onChange={e => set('hsCode', e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── D. Freight ── */}
      <Accordion {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>D. Flete</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Freight Terms</InputLabel>
                <Select value={form.freightTerms} label="Freight Terms" onChange={e => set('freightTerms', e.target.value)}>
                  <MenuItem value="PREPAID">PREPAID</MenuItem>
                  <MenuItem value="COLLECT">COLLECT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Freight Amount"
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.freightAmount ?? ''}
                onChange={e => set('freightAmount', e.target.value ? parseFloat(e.target.value) : null)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Currency</InputLabel>
                <Select value={form.freightCurrency} label="Currency" onChange={e => set('freightCurrency', e.target.value)}>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="PAB">PAB</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Freight Description" fullWidth size="small" value={form.freightDesc || ''} onChange={e => set('freightDesc', e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── E. Referencias ── */}
      <Accordion {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>E. Referencias</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField label="Export Reference" fullWidth size="small" value={form.exportReference || ''} onChange={e => set('exportReference', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Document Number" fullWidth size="small" value={form.documentNumber || ''} onChange={e => set('documentNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Fecha del B/L"
                fullWidth
                size="small"
                type="date"
                value={form.blDate || ''}
                onChange={e => set('blDate', e.target.value || null)}
                InputLabelProps={{ shrink: true }}
                helperText="Fecha que aparece en el HBL"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Notas" fullWidth size="small" multiline rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={saving}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, px: 4 }}
        >
          {saving ? 'Guardando...' : id ? 'Actualizar Booking' : 'Crear Booking / HBL'}
        </Button>
      </Box>
    </Box>
  )
}
