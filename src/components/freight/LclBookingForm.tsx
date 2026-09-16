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
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { Save, ArrowBack, ExpandMore, Add, Delete } from '@mui/icons-material'
import { STAMP_LIBRARY, STAMP_ANCHORS, STAMP_SIZES, type AppliedStamp } from '@/lib/hblStamps'
import { defaultForwardingAgent, defaultNotifyParty } from '@/lib/hblDefaults'

interface MblOption {
  id: string
  mblNumber: string
  status: string
  vessel?: string | null
  voyage?: string | null
  portOfLoading?: string | null
  portOfDischarge?: string | null
  shipperName?: string | null
  shipperAddress?: string | null
}

interface ClientOption {
  id: string
  name: string
  type: 'user' | 'company'
  label: string
  ruc?: string | null
  dv?: string | null
  email?: string | null
  address?: string | null
}

export interface CargoItemInput {
  id?: string
  hsCode?: string | null
  description: string
  packages: number
  packageType?: string | null
  grossWeightKg?: number | null
  cbm?: number | null
  marks?: string | null
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
  omitQr?: boolean
  groupedCargo?: boolean
  cargoItems?: CargoItemInput[]
  lclContainerId?: string | null
  stamps?: AppliedStamp[] | null
  clientRuc?: string | null
  clientDv?: string | null
  clientEmail?: string | null
  notifyAddress?: string | null
  notifyRuc?: string | null
  notifyDv?: string | null
  notifyEmail?: string | null
  forwardingAgent?: string | null
}

const emptyCargoItem = (): CargoItemInput => ({
  hsCode: '',
  description: '',
  packages: 1,
  packageType: 'CTNS',
  grossWeightKg: null,
  cbm: null,
  marks: '',
})

interface Props {
  id?: string
  initial?: LclBookingData
  origin?: 'CHINA' | 'PANAMA'
}

const PACKAGE_TYPES = ['CTNS', 'PKGS', 'PLTS', 'BAGS', 'PCS']

export function LclBookingForm({ id, initial, origin = 'CHINA' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wrId = searchParams.get('wr')

  const isPanama = origin === 'PANAMA'
  const listPath = isPanama ? '/dashboard/freight/pa/hbl' : '/dashboard/freight/lcl/bookings'

  const [mbls, setMbls] = useState<MblOption[]>([])
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
    clientRuc: '',
    clientDv: '',
    clientEmail: '',
    ...(defaultNotifyParty(origin) ?? {
      notifyParty: '', notifyAddress: '', notifyRuc: '',
      notifyDv: '', notifyEmail: '', notifyPhone: '',
    }),
    forwardingAgent: defaultForwardingAgent(origin),
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
    omitQr: false,
    groupedCargo: false,
    cargoItems: [emptyCargoItem()],
    lclContainerId: null,
    stamps: [],
  })

  // Cargar MBLs de Panamá para el selector (HBL Panamá debe ir bajo un MBL)
  useEffect(() => {
    if (!isPanama) return
    fetch('/api/lcl-containers?origin=PANAMA')
      .then(r => r.ok ? r.json() : { containers: [] })
      .then(d => setMbls((d.containers || []).map((c: any) => ({
        id: c.id, mblNumber: c.mblNumber, status: c.status,
        vessel: c.vessel, voyage: c.voyage, portOfLoading: c.portOfLoading, portOfDischarge: c.portOfDischarge,
        shipperName: c.shipperName, shipperAddress: c.shipperAddress,
      }))))
      .catch(() => {})
  }, [isPanama])

  // Al elegir el MBL, heredar sus datos de viaje (vessel, voyage, puertos) y el
  // shipper: todos los HBL de un MBL comparten el mismo proveedor en origen.
  // El shipper solo se pisa si el usuario aun no escribio uno propio.
  const selectMbl = (mblId: string) => {
    const mbl = mbls.find(m => m.id === mblId)
    setForm(prev => ({
      ...prev,
      lclContainerId: mblId || null,
      ...(mbl ? {
        vessel: mbl.vessel || prev.vessel,
        voyage: mbl.voyage || prev.voyage,
        portOfLoading: mbl.portOfLoading || prev.portOfLoading,
        portOfDischarge: mbl.portOfDischarge || prev.portOfDischarge,
        ...(mbl.shipperName && !prev.shipperName.trim()
          ? { shipperName: mbl.shipperName, shipperAddress: mbl.shipperAddress || '' }
          : {}),
      } : {}),
    }))
  }

  // Load clients
  useEffect(() => {
    const load = async () => {
      const [usersRes, companiesRes] = await Promise.all([
        fetch('/api/users').then(r => r.ok ? r.json() : { users: [] }),
        fetch('/api/companies').then(r => r.ok ? r.json() : { companies: [] }),
      ])
      const opts: ClientOption[] = [
        ...(usersRes.users || []).map((u: any) => ({ id: u.id, name: u.name, type: 'user' as const, label: `${u.name} (Usuario)`, ruc: u.ruc_id, email: u.email, address: u.address })),
        ...(companiesRes.companies || []).map((c: any) => ({ id: c.id, name: c.name, type: 'company' as const, label: `${c.name} (Empresa)`, ruc: c.ruc, dv: c.dv, email: c.email, address: c.address })),
      ]
      setClients(opts)
    }
    load()
  }, [])

  // Pre-fill from initial
  useEffect(() => {
    if (initial) {
      // If the booking already has cargo line items, use them. Otherwise seed
      // one item from the legacy single-cargo fields so existing HBLs keep
      // their data when the form switches to the multi-line layout.
      const items: CargoItemInput[] =
        initial.cargoItems && initial.cargoItems.length > 0
          ? initial.cargoItems.map(i => ({
              id: i.id,
              hsCode: i.hsCode ?? '',
              description: i.description || '',
              packages: i.packages || 1,
              packageType: i.packageType ?? 'CTNS',
              grossWeightKg: i.grossWeightKg ?? null,
              cbm: i.cbm ?? null,
              marks: i.marks ?? '',
            }))
          : [{
              hsCode: initial.hsCode ?? '',
              description: initial.description ?? '',
              packages: initial.packages || 1,
              packageType: initial.packageType || 'CTNS',
              grossWeightKg: initial.grossWeightKg ?? null,
              cbm: initial.cbm ?? null,
              marks: '',
            }]

      setForm({
        warehouseEntryId: initial.warehouseEntryId ?? null,
        shipperName: initial.shipperName || '',
        shipperAddress: initial.shipperAddress || '',
        clientId: initial.clientId ?? null,
        clientType: initial.clientType ?? null,
        clientName: initial.clientName || '',
        clientAddress: initial.clientAddress || '',
        clientRuc: initial.clientRuc || '',
        clientDv: initial.clientDv || '',
        clientEmail: initial.clientEmail || '',
        notifyParty: initial.notifyParty || '',
        notifyAddress: initial.notifyAddress || '',
        notifyRuc: initial.notifyRuc || '',
        notifyDv: initial.notifyDv || '',
        notifyEmail: initial.notifyEmail || '',
        notifyPhone: initial.notifyPhone || '',
        forwardingAgent: initial.forwardingAgent || defaultForwardingAgent(origin),
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
        omitQr: initial.omitQr ?? false,
        groupedCargo: initial.groupedCargo ?? false,
        cargoItems: items,
        lclContainerId: initial.lclContainerId ?? null,
        stamps: Array.isArray(initial.stamps) ? initial.stamps : [],
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

  const updateItem = (idx: number, field: keyof CargoItemInput, value: any) =>
    setForm(prev => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }))

  const addItem = () =>
    setForm(prev => ({ ...prev, cargoItems: [...(prev.cargoItems || []), emptyCargoItem()] }))

  const removeItem = (idx: number) =>
    setForm(prev => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).filter((_, i) => i !== idx),
    }))

  // ── Sellos (Panamá) ──
  const stamps = form.stamps || []
  const addStamp = () => {
    const primero = STAMP_LIBRARY[0]
    if (!primero) return
    setForm(prev => ({
      ...prev,
      stamps: [...(prev.stamps || []), { key: primero.key, anchor: 'br', size: STAMP_SIZES[1].px }],
    }))
  }
  const updateStamp = (idx: number, field: keyof AppliedStamp, value: any) =>
    setForm(prev => ({
      ...prev,
      stamps: (prev.stamps || []).map((st, i) => (i === idx ? { ...st, [field]: value } : st)),
    }))
  const removeStamp = (idx: number) =>
    setForm(prev => ({ ...prev, stamps: (prev.stamps || []).filter((_, i) => i !== idx) }))

  // Live totals derived from cargo items — shown to the user and sent to the
  // backend as the booking-level packages/weight/CBM aggregates.
  const items = form.cargoItems || []
  const totalPackages = items.reduce((s, it) => s + (Number(it.packages) || 0), 0)
  const totalWeight = items.reduce((s, it) => s + (Number(it.grossWeightKg) || 0), 0)
  const totalCbm = items.reduce((s, it) => s + (Number(it.cbm) || 0), 0)
  // `null` cuando NINGUNA línea trae el dato, para distinguir "no hay líneas"
  // de "las líneas suman cero" y no pisar con 0 lo que escribió el usuario.
  const hayPeso = items.some(it => it.grossWeightKg != null)
  const hayCbm = items.some(it => it.cbm != null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shipperName || !form.clientName) {
      setError('Shipper y Cliente son requeridos')
      return
    }
    if (isPanama && !form.lclContainerId) {
      setError('Debe seleccionar el MBL al que pertenece este HBL')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = id ? `/api/lcl-bookings/${id}` : '/api/lcl-bookings'
      const method = id ? 'PUT' : 'POST'
      const cleanItems = (form.cargoItems || []).filter(it => (it.description || '').trim() || it.hsCode)
      // `description` y `hsCode` a nivel de HBL ya no se escriben a mano: la
      // mercancía se captura por líneas. Pero el resumen de una línea sola sigue
      // leyéndose de ahí — la página pública del QR (/api/hbl-validate), el
      // manifiesto del consolidado y el detalle del MBL muestran
      // `booking.description`. Si no se rellena, el cliente escanea el QR y ve
      // la carga en blanco. Se arma juntando las líneas.
      const resumenCarga = cleanItems.map(it => (it.description || '').trim()).filter(Boolean).join(' / ')
      const payload = {
        ...form,
        origin,
        cargoItems: cleanItems,
        description: (form.description || '').trim() || resumenCarga || null,
        hsCode: form.hsCode || cleanItems.find(it => it.hsCode)?.hsCode || null,
        // Sync booking-level totals from line items so they stay consistent.
        // En modo agrupado mandan los totales que el usuario escribe directamente.
        // `!= null` en vez de `||`: un total legítimo de 0 no debe caer al otro
        // origen y reimprimir un peso viejo.
        packages: form.groupedCargo ? (Number(form.packages) || totalPackages) : (totalPackages || form.packages),
        grossWeightKg: form.groupedCargo
          ? (form.grossWeightKg != null ? Number(form.grossWeightKg) : (hayPeso ? totalWeight : null))
          : (hayPeso ? totalWeight : (form.grossWeightKg ?? null)),
        cbm: form.groupedCargo
          ? (form.cbm != null ? Number(form.cbm) : (hayCbm ? totalCbm : null))
          : (hayCbm ? totalCbm : (form.cbm ?? null)),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }
      router.push(listPath)
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
          {id ? 'Editar HBL' : 'Nuevo HBL'} {isPanama ? '— Panamá' : '— China'}
        </Typography>
        {wrLinked && (
          <Chip label={`WR: ${wrLinked.wrNumber}`} color="info" size="small" />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* MBL obligatorio en Panamá */}
      {isPanama && (
        <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" required error={!form.lclContainerId}>
                <InputLabel>MBL (contenedor) *</InputLabel>
                <Select
                  label="MBL (contenedor) *"
                  value={form.lclContainerId || ''}
                  onChange={e => selectMbl(e.target.value)}
                >
                  <MenuItem value=""><em>Seleccionar MBL…</em></MenuItem>
                  {mbls.map(m => (
                    <MenuItem key={m.id} value={m.id}>{m.mblNumber} ({m.status})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                El HBL de Panamá debe pertenecer a un MBL. Si no existe, créalo primero en “Panamá — MBL”.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

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
                  setForm(prev => ({
                    ...prev,
                    clientId: v?.id || null,
                    clientType: v?.type || null,
                    clientName: v?.name || '',
                    clientAddress: v?.address || prev.clientAddress,
                    clientRuc: v?.ruc || prev.clientRuc,
                    clientDv: v?.dv || prev.clientDv,
                    clientEmail: v?.email || prev.clientEmail,
                  }))
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
                label="Dirección del Cliente"
                fullWidth
                value={form.clientAddress || ''}
                onChange={e => set('clientAddress', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="RUC Cliente" fullWidth size="small" value={form.clientRuc || ''} onChange={e => set('clientRuc', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="DV" fullWidth size="small" value={form.clientDv || ''} onChange={e => set('clientDv', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email Cliente" fullWidth size="small" value={form.clientEmail || ''} onChange={e => set('clientEmail', e.target.value)} />
            </Grid>

            {/* Notify Party */}
            <Grid item xs={12}><Typography variant="caption" color="text.secondary" fontWeight={600}>Notify Party</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Notify Party (Nombre)"
                fullWidth
                value={form.notifyParty || ''}
                onChange={e => set('notifyParty', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Dirección Notify" fullWidth size="small" value={form.notifyAddress || ''} onChange={e => set('notifyAddress', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="RUC Notify" fullWidth size="small" value={form.notifyRuc || ''} onChange={e => set('notifyRuc', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="DV" fullWidth size="small" value={form.notifyDv || ''} onChange={e => set('notifyDv', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Email Notify" fullWidth size="small" value={form.notifyEmail || ''} onChange={e => set('notifyEmail', e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Notify Phone"
                fullWidth
                value={form.notifyPhone || ''}
                onChange={e => set('notifyPhone', e.target.value)}
                size="small"
              />
            </Grid>

            {/* Forwarding Agent / Party to contact for cargo release */}
            <Grid item xs={12}>
              <TextField
                label="Forwarding Agent / Party to contact for cargo release"
                fullWidth
                size="small"
                multiline
                minRows={3}
                value={form.forwardingAgent || ''}
                onChange={e => set('forwardingAgent', e.target.value)}
                helperText={isPanama
                  ? 'Por defecto IB FORWARDING PANAMA S.A. — puedes editarlo'
                  : 'Por defecto TP LOGISTICS — puedes editarlo'}
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

      {/* ── C. Cargo (multi-line) ── */}
      <Accordion defaultExpanded {...sectionProps}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={600}>
            C. Cargo &nbsp;
            <Typography component="span" variant="caption" color="text.secondary">
              {items.length} línea(s) · {totalPackages} pkgs · {totalWeight.toFixed(2)} kg · {totalCbm.toFixed(3)} CBM
            </Typography>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Marks & Numbers (cabecera)"
                fullWidth
                size="small"
                multiline
                minRows={2}
                value={form.marks || ''}
                onChange={e => set('marks', e.target.value)}
                helperText="Marcas comunes que aparecen al lado del cuadro de mercancías"
              />
            </Grid>
          </Grid>

          {items.map((it, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Línea {idx + 1}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {items.length > 1 && (
                  <Tooltip title="Eliminar línea">
                    <IconButton size="small" onClick={() => removeItem(idx)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={2}>
                  <TextField
                    label="HS Code"
                    fullWidth
                    size="small"
                    value={it.hsCode || ''}
                    onChange={e => updateItem(idx, 'hsCode', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Descripción"
                    fullWidth
                    size="small"
                    multiline
                    minRows={1}
                    value={it.description || ''}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Ej: 喷墨打印机 digital printer"
                  />
                </Grid>
                <Grid item xs={4} sm={1}>
                  <TextField
                    label="# Pkgs"
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={it.packages ?? ''}
                    onChange={e => updateItem(idx, 'packages', parseInt(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={4} sm={1}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={it.packageType || 'CTNS'}
                      label="Tipo"
                      onChange={e => updateItem(idx, 'packageType', e.target.value)}
                    >
                      {PACKAGE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={1}>
                  <TextField
                    label="Kg"
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: '0.01' }}
                    value={it.grossWeightKg ?? ''}
                    onChange={e => updateItem(idx, 'grossWeightKg', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </Grid>
                <Grid item xs={6} sm={1}>
                  <TextField
                    label="CBM"
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: '0.001' }}
                    value={it.cbm ?? ''}
                    onChange={e => updateItem(idx, 'cbm', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Button startIcon={<Add />} size="small" onClick={addItem} variant="outlined">
            Agregar línea
          </Button>

          <Box sx={{ display: 'flex', gap: 3, mt: 2, pt: 1.5, borderTop: '1px dashed #444' }}>
            <Typography variant="body2"><b>Total Packages:</b> {totalPackages}</Typography>
            <Typography variant="body2"><b>Total Weight:</b> {totalWeight.toFixed(2)} kg</Typography>
            <Typography variant="body2"><b>Total CBM:</b> {totalCbm.toFixed(3)}</Typography>
          </Box>
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
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.omitQr}
                    onChange={e => set('omitQr', e.target.checked)}
                  />
                }
                label="HBL solo para origen China — no incluir QR de validación en el PDF"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.groupedCargo}
                    onChange={e => {
                      const on = e.target.checked
                      set('groupedCargo', on)
                      if (on) {
                        if (totalPackages) set('packages', totalPackages)
                        if (totalWeight) set('grossWeightKg', totalWeight)
                        if (totalCbm) set('cbm', totalCbm)
                      }
                    }}
                  />
                }
                label="Agrupar ítems en una sola descripción (estilo BL) — usa los totales en lugar de una línea por ítem"
              />
            </Grid>
            {form.groupedCargo && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Total de paquetes"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.packages ?? ''}
                    onChange={e => set('packages', e.target.value === '' ? 0 : Number(e.target.value))}
                    helperText="Total del consolidado"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Peso bruto total (Kgs)"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.grossWeightKg ?? ''}
                    onChange={e => set('grossWeightKg', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="CBM total"
                    type="number"
                    fullWidth
                    size="small"
                    value={form.cbm ?? ''}
                    onChange={e => set('cbm', e.target.value === '' ? null : Number(e.target.value))}
                    helperText="Solo el total, no por ítem"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ── F. Sellos del HBL (solo Panamá) ── */}
      {isPanama && (
        <Accordion {...sectionProps}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>
              F. Sellos del HBL &nbsp;
              <Typography component="span" variant="caption" color="text.secondary">
                {stamps.length} sello(s) — se sobreponen en el PDF
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {stamps.map((st, idx) => (
              <Grid container spacing={1.5} key={idx} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sello</InputLabel>
                    <Select label="Sello" value={st.key} onChange={e => updateStamp(idx, 'key', e.target.value)}>
                      {STAMP_LIBRARY.map(s => <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Posición</InputLabel>
                    <Select label="Posición" value={st.anchor} onChange={e => updateStamp(idx, 'anchor', e.target.value)}>
                      {STAMP_ANCHORS.map(a => <MenuItem key={a.key} value={a.key}>{a.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tamaño</InputLabel>
                    <Select label="Tamaño" value={st.size} onChange={e => updateStamp(idx, 'size', Number(e.target.value))}>
                      {STAMP_SIZES.map(s => <MenuItem key={s.key} value={s.px}>{s.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => removeStamp(idx)}>
                    Quitar
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button startIcon={<Add />} size="small" variant="outlined" onClick={addStamp} disabled={STAMP_LIBRARY.length === 0}>
              Agregar sello
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              {STAMP_LIBRARY.length === 0
                ? 'Todavía no hay sellos de TP cargados. Deja los PNG en public/images/stamps/ y agrégalos a STAMP_LIBRARY (src/lib/hblStamps.ts) para habilitarlos.'
                : 'Los sellos se guardan al actualizar y aparecen sobre el HBL al descargar el PDF.'}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={saving}
          sx={{ bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#EAB308' }, px: 4 }}
        >
          {saving ? 'Guardando...' : id ? 'Actualizar HBL' : 'Crear HBL'}
        </Button>
      </Box>
    </Box>
  )
}
