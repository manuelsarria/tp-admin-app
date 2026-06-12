'use client'

import { useMemo, useState, useEffect } from 'react'
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
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Autocomplete,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material'
import { Add, Search, FilterList, Download, LocalShipping, CloseRounded, Edit, Delete, Flight, Warning, Visibility, DirectionsBoat, UploadFile, CalendarToday, Inventory2, NotificationsActive, ExpandMore, ExpandLess } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowsProp, GridToolbar } from '@mui/x-data-grid'
import * as XLSX from 'xlsx'
import {
  buildContainerGroups,
  ARRIVAL_CONFIG,
  arrivalCountdown,
  type ContainerGroup,
} from '@/lib/containerGroups'

type TipoTransporte = 'AIR' | 'MAR'

type FclPiece = {
  id?: string
  quantity: number
  length: number | null
  width: number | null
  height: number | null
  weight: number | null
}

type Envio = {
  id: string
  trackingWH: string
  forwarder: string
  consolidador: string
  tipoTransporte: TipoTransporte
  numeroContenedor: string
  fechaAproximada?: Date
  malIdentificado?: boolean
  dg?: boolean
  rp?: boolean
  createdAt: Date
  updatedAt: Date
  empresaId?: string
  empresaName?: string
  empresaCode?: string
  totalCbm?: number | null
  totalWeight?: number | null
  comments?: string | null
  additionalCode?: string | null
  pieces?: FclPiece[]
}

type LCLRow = {
  id: string
  blNumber: string
  eta: Date
  notas?: string
  fechaSalida: Date
  montoCarga: number
  totalCBM: number
  empresaId?: string
  empresaName?: string
  empresaCode?: string
  itemType?: 'company' | 'user'
  userId?: string
  mailbox?: string
  userName?: string
  createdAt?: Date
}

type LCLForm = {
  blNumber: string
  eta: Date | string
  notas: string
  fechaSalida: Date | string
  montoCarga: string // Changed to string for better form handling
  totalCBM: string // Changed to string for better form handling
  empresaId: string
  itemType?: 'company' | 'user' // Type of the selected item
  userId?: string // ID of the user if itemType is 'user'
}

type ContainerShipmentRow = {
  id: string
  blNumber: string
  eta: Date
  notas?: string
  fechaSalida: Date
  montoCarga: number
  totalCBM: number
  empresaId?: string
  empresaName?: string
  empresaCode?: string
  itemType?: 'company' | 'user'
  userId?: string
  mailbox?: string
  userName?: string
  createdAt?: Date
}

type ContainerShipmentForm = {
  blNumber: string
  eta: Date | string
  notas: string
  fechaSalida: Date | string
  montoCarga: string
  totalCBM: string
  empresaId: string
  itemType?: 'company' | 'user' // Type of the selected item
  userId?: string // ID of the user if itemType is 'user'
}

const trackingWHOpts = ['Logística Panamá', 'Depósito Colón', 'Terminal Balboa', 'Zona Libre Pacífico']
const forwarderOpts = ['DHL Forwarding', 'Kuehne+Nagel', 'Maersk Logistics', 'UPS Supply Chain']
const consolidadorOpts = ['TP-101', 'MBX', 'PBX', 'TP']
const tipoOpts: TipoTransporte[] = ['AIR', 'MAR']


// Helper for filtering Reference No. options
function filterReferenceNos(input: string, referenceNos: string[]) {
  if (!input) return referenceNos
  return referenceNos.filter(ref =>
    ref.toLowerCase().includes(input.toLowerCase())
  )
}

// ============== Vista de Contenedores (agrupada por cliente) ==============
function AdminContainerCard({ group }: { group: ContainerGroup }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = ARRIVAL_CONFIG[group.arrivalLevel]
  const countdown = arrivalCountdown(group)

  return (
    <Card
      sx={{
        borderRadius: '14px',
        border: `1px solid ${group.arrivalLevel === 'imminent' ? cfg.border : 'rgba(10,10,10,0.08)'}`,
        height: '100%',
        transition: 'all 0.2s',
        '&:hover': { boxShadow: '0 10px 22px -12px rgba(10,10,10,0.18)' },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Box sx={{ p: 0.75, borderRadius: '9px', bgcolor: 'rgba(250,204,21,0.16)', display: 'flex', flexShrink: 0 }}>
              {group.transportType === 'AIR'
                ? <Flight sx={{ fontSize: '1.15rem', color: '#A16207' }} />
                : <DirectionsBoat sx={{ fontSize: '1.15rem', color: '#A16207' }} />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, color: '#0A0A0A', fontSize: '0.95rem', lineHeight: 1.2, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.containerNumber}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#78716C' }}>
                {group.shippingLine || (group.transportType === 'AIR' ? 'Aéreo' : 'Marítimo')}
                {group.referenceNo ? ` · ${group.referenceNo}` : ''}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={countdown ? `${cfg.label} · ${countdown}` : cfg.label}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}
          />
        </Box>

        {/* Metrics row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.25 }}>
          {group.eta && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <CalendarToday sx={{ fontSize: '0.8rem', color: '#FACC15' }} />
              <Typography sx={{ fontSize: '0.76rem', color: '#57534E', fontWeight: 600 }}>
                ETA {new Date(group.eta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Box>
          )}
          <Typography sx={{ fontSize: '0.76rem', color: '#57534E', fontWeight: 600 }}>
            {group.clientCount} cliente{group.clientCount !== 1 ? 's' : ''}
          </Typography>
          <Typography sx={{ fontSize: '0.76rem', color: '#57534E', fontWeight: 600 }}>
            {group.shipmentCount} envío{group.shipmentCount !== 1 ? 's' : ''}
          </Typography>
          {group.totalCbm > 0 && (
            <Typography sx={{ fontSize: '0.76rem', color: '#57534E', fontWeight: 600 }}>
              {group.totalCbm.toFixed(2)} CBM
            </Typography>
          )}
          {group.totalWeight > 0 && (
            <Typography sx={{ fontSize: '0.76rem', color: '#57534E', fontWeight: 600 }}>
              {group.totalWeight.toFixed(0)} kg
            </Typography>
          )}
        </Box>

        {/* Status / flags */}
        {(group.statusLabel || group.location || group.dgCount > 0 || group.flaggedCount > 0) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
            {group.statusLabel && (
              <Chip label={group.statusLabel} size="small" variant="outlined"
                sx={{ height: 22, fontSize: '0.64rem', fontWeight: 600, borderRadius: '6px' }} />
            )}
            {group.location && (
              <Chip label={group.location} size="small" variant="outlined"
                sx={{ height: 22, fontSize: '0.64rem', fontWeight: 500, borderRadius: '6px', color: '#78716C' }} />
            )}
            {group.dgCount > 0 && (
              <Chip label={`DG · ${group.dgCount}`} size="small"
                sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: '#FEF2F2', color: '#B91C1C' }} />
            )}
            {group.flaggedCount > 0 && (
              <Chip label={`Mal ident. · ${group.flaggedCount}`} size="small"
                sx={{ height: 22, fontSize: '0.64rem', fontWeight: 700, bgcolor: '#FFFBEB', color: '#B45309' }} />
            )}
          </Box>
        )}

        {/* Clients */}
        <Box sx={{ borderTop: '1px solid rgba(10,10,10,0.06)', pt: 1.25 }}>
          <Box
            onClick={() => setExpanded(e => !e)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#A16207', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clientes en el contenedor
            </Typography>
            {expanded ? <ExpandLess sx={{ fontSize: '1.1rem', color: '#A16207' }} /> : <ExpandMore sx={{ fontSize: '1.1rem', color: '#A16207' }} />}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
            {group.clients.length === 0 && (
              <Typography sx={{ fontSize: '0.8rem', color: '#A8A29E', fontStyle: 'italic' }}>
                Sin clientes asignados todavía
              </Typography>
            )}
            {(expanded ? group.clients : group.clients.slice(0, 3)).map(c => (
              <Box key={c.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#FACC15', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#292524', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.display}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: '#78716C', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {c.shipmentCount} env.{c.totalCbm > 0 ? ` · ${c.totalCbm.toFixed(1)} CBM` : ''}
                </Typography>
              </Box>
            ))}
            {!expanded && group.clients.length > 3 && (
              <Typography
                onClick={() => setExpanded(true)}
                sx={{ fontSize: '0.74rem', color: '#A16207', fontWeight: 600, pl: '13px', cursor: 'pointer' }}
              >
                +{group.clients.length - 3} más
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function ContainerGroupedView({ groups, loading }: { groups: ContainerGroup[]; loading: boolean }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter(g =>
      g.containerNumber.toLowerCase().includes(q) ||
      (g.shippingLine || '').toLowerCase().includes(q) ||
      g.clients.some(c => c.display.toLowerCase().includes(q))
    )
  }, [groups, search])

  const imminent = groups.filter(g => g.arrivalLevel === 'imminent').length
  const soon = groups.filter(g => g.arrivalLevel === 'soon').length
  const totalClients = new Set(groups.flatMap(g => g.clients.map(c => c.key))).size

  return (
    <Box className="space-y-4">
      {/* Summary stats */}
      <Grid container spacing={3}>
        <Grid item xs={6} sm={3}>
          <Card><CardContent className="p-4">
            <Box className="flex items-center justify-between">
              <Box>
                <Typography variant="h5" className="font-bold text-ink">{groups.length}</Typography>
                <Typography variant="body2" className="text-medium-gray">Contenedores</Typography>
              </Box>
              <Inventory2 className="text-brand-primary text-3xl" />
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent className="p-4">
            <Typography variant="h5" className="font-bold text-error">{imminent}</Typography>
            <Typography variant="body2" className="text-medium-gray">Llegan en 48h</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent className="p-4">
            <Typography variant="h5" className="font-bold text-warning">{soon}</Typography>
            <Typography variant="body2" className="text-medium-gray">Esta semana</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card><CardContent className="p-4">
            <Typography variant="h5" className="font-bold text-info">{totalClients}</Typography>
            <Typography variant="body2" className="text-medium-gray">Clientes</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Arrival alert */}
      {(imminent > 0 || soon > 0) && (
        <Alert severity={imminent > 0 ? 'error' : 'warning'} icon={<NotificationsActive />} sx={{ borderRadius: 3, fontWeight: 600 }}>
          {imminent > 0 && `${imminent} contenedor(es) llegan en las próximas 48 horas. `}
          {soon > 0 && `${soon} con llegada esta semana. Avisa a los clientes.`}
        </Alert>
      )}

      {/* Search */}
      <Card><CardContent className="p-4">
        <TextField
          fullWidth
          placeholder="Buscar por contenedor, naviera o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search className="mr-2 text-medium-gray" /> }}
        />
      </CardContent></Card>

      {/* Cards */}
      {loading ? (
        <LinearProgress />
      ) : filtered.length > 0 ? (
        <Grid container spacing={2}>
          {filtered.map(g => (
            <Grid item xs={12} sm={6} lg={4} key={g.containerNumber}>
              <AdminContainerCard group={g} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card><CardContent className="p-6">
          <Typography variant="body2" className="text-medium-gray text-center">
            {groups.length === 0 ? 'No hay contenedores con carga de clientes' : 'Ningún contenedor coincide con la búsqueda'}
          </Typography>
        </CardContent></Card>
      )}
    </Box>
  )
}

export default function AdminCargaPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  // Vista principal: 0 = Contenedores (agrupado por cliente), 1 = Detalle de envíos
  const [mainTab, setMainTab] = useState(0)
  // CargoManagement (ETA / estado / naviera por contenedor)
  const [cargoMgmt, setCargoMgmt] = useState<any[]>([])
  // Reference numbers from database
  const [recibidosEnBodegaReferenceNos, setRecibidosEnBodegaReferenceNos] = useState<string[]>([])
  const [isLoadingReferenceNos, setIsLoadingReferenceNos] = useState(false)

  // Envíos (FCL)
  const [envios, setEnvios] = useState<Envio[]>([])
  const [isLoadingEnvios, setIsLoadingEnvios] = useState(false)
  const [openEnvioDialog, setOpenEnvioDialog] = useState(false)
  const [editingEnvio, setEditingEnvio] = useState<Envio | null>(null)
  const [envioForm, setEnvioForm] = useState<Omit<Envio, 'id' | 'createdAt' | 'updatedAt'>>({
    trackingWH: '',
    forwarder: '',
    consolidador: '',
    tipoTransporte: 'MAR',
    numeroContenedor: '',
    fechaAproximada: undefined,
    malIdentificado: false,
    dg: false,
    rp: false,
    additionalCode: '',
    comments: '',
    totalCbm: null,
    totalWeight: null,
    pieces: [],
  })

  // LCL
  const [lcl, setLcl] = useState<LCLRow[]>([])
  const [isLoadingLcl, setIsLoadingLcl] = useState(false)
  const [openLclDialog, setOpenLclDialog] = useState(false)
  const [editingLcl, setEditingLcl] = useState<LCLRow | null>(null)
  const [lclForm, setLclForm] = useState<LCLForm>({
    blNumber: '',
    eta: new Date(),
    notas: '',
    fechaSalida: new Date(),
    montoCarga: '', // Empty string instead of 0
    totalCBM: '', // Empty string instead of 0
    empresaId: '',
  })

  // Container Shipments
  const [containerShipments, setContainerShipments] = useState<ContainerShipmentRow[]>([])
  const [isLoadingContainerShipments, setIsLoadingContainerShipments] = useState(false)
  const [openContainerDialog, setOpenContainerDialog] = useState(false)
  const [editingContainer, setEditingContainer] = useState<ContainerShipmentRow | null>(null)
  const [containerForm, setContainerForm] = useState<ContainerShipmentForm>({
    blNumber: '',
    eta: new Date(),
    notas: '',
    fechaSalida: new Date(),
    montoCarga: '',
    totalCBM: '',
    empresaId: '',
  })

  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'FCL' | 'LCL' | 'CONTAINER'>('LCL')

  // Companies for LCL empresa field
  const [companies, setCompanies] = useState<Array<{
    id: string
    name: string
    company_id?: string
    companyId: string
    mailbox?: string
    userId?: string
    userName?: string
    displayLabel?: string
    type?: 'company' | 'user'
  }>>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)

  // Snackbar/Toast notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info',
  })

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  // Excel Import
  type XlsxRow = {
    trackingWH: string; consolidador: string; numeroContenedor: string
    tipoTransporte: string; forwarder: string; dg: boolean; rp: boolean
    malIdentificado: boolean; additionalCode: string; comments: string
    cantPiezas: number; largo: number | null; ancho: number | null; alto: number | null; peso: number | null
    _errors: string[]
  }
  const [xlsxOpen, setXlsxOpen] = useState(false)
  const [xlsxRows, setXlsxRows] = useState<XlsxRow[]>([])
  const [xlsxUploading, setXlsxUploading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<TipoTransporte | ''>('')
  const [filterFlagged, setFilterFlagged] = useState<'all' | 'yes' | 'no'>('all')

  // LCL Filters
  const [lclSearch, setLclSearch] = useState('')
  const [lclFilterStartDate, setLclFilterStartDate] = useState('')
  const [lclFilterEndDate, setLclFilterEndDate] = useState('')

  const [containerSearch, setContainerSearch] = useState('')
  const [containerFilterStartDate, setContainerFilterStartDate] = useState('')
  const [containerFilterEndDate, setContainerFilterEndDate] = useState('')

  // For searchable select
  const [numeroContenedorSearch, setNumeroContenedorSearch] = useState('')
  const filteredReferenceNos = useMemo(
    () => filterReferenceNos(numeroContenedorSearch, recibidosEnBodegaReferenceNos),
    [numeroContenedorSearch, recibidosEnBodegaReferenceNos]
  )

  // Fetch FCL shipments from database
  const fetchEnvios = async () => {
    setIsLoadingEnvios(true)
    try {
      const response = await fetch('/api/fcl-shipments?pageSize=1000')

      if (response.ok) {
        const data = await response.json()

        const shipments = (data.data || []).map((item: any) => ({
          id: item.id,
          trackingWH: item.trackingWarehouse,
          forwarder: item.forwarder || '',
          consolidador: item.mailbox,
          tipoTransporte: item.transportType,
          numeroContenedor: item.containerNumber,
          fechaAproximada: item.approximateDate ? new Date(item.approximateDate) : undefined,
          malIdentificado: item.misidentified,
          dg: item.dangerousGoods,
          rp: item.refrigeratedProduct,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          empresaId: item.companyId,
          empresaName: item.company?.name,
          empresaCode: item.company?.company_id,
          totalCbm: item.totalCbm ?? null,
          totalWeight: item.totalWeight ?? null,
          comments: item.comments ?? null,
          additionalCode: item.additionalCode ?? null,
          pieces: (item.pieces || []).map((p: any) => ({
            id: p.id,
            quantity: p.quantity,
            length: p.length ?? null,
            width: p.width ?? null,
            height: p.height ?? null,
            weight: p.weight ?? null,
          })),
        }))

        setEnvios(shipments)
      } else {
        console.error('❌ Failed to fetch FCL shipments:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching FCL shipments:', error)
    } finally {
      setIsLoadingEnvios(false)
    }
  }

  // Fetch LCL shipments from database
  const fetchLcl = async () => {
    setIsLoadingLcl(true)
    try {
      const response = await fetch('/api/lcl-shipments?pageSize=1000')
      if (response.ok) {
        const data = await response.json()
        const shipments = (data.data || []).map((item: any) => ({
          id: item.id,
          blNumber: item.blNumber,
          eta: new Date(item.eta),
          notas: item.notes,
          fechaSalida: new Date(item.departureDate),
          montoCarga: item.cargoAmount,
          totalCBM: item.totalCbm,
          empresaId: item.companyId,
          empresaName: item.company?.name,
          empresaCode: item.company?.company_id,
          itemType: item.itemType,
          userId: item.userId,
        }))
        setLcl(shipments)
      } else {
        console.error('Failed to fetch LCL shipments:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching LCL shipments:', error)
    } finally {
      setIsLoadingLcl(false)
    }
  }

  const fetchContainerShipments = async () => {
    setIsLoadingContainerShipments(true)
    try {
      const response = await fetch('/api/container-shipments?pageSize=1000')
      if (response.ok) {
        const data = await response.json()
        const shipments = (data.data || []).map((item: any) => ({
          id: item.id,
          blNumber: item.blNumber,
          eta: new Date(item.eta),
          notas: item.notes,
          fechaSalida: new Date(item.departureDate),
          montoCarga: item.cargoAmount,
          totalCBM: item.totalCbm,
          empresaId: item.companyId,
          empresaName: item.company?.name,
          empresaCode: item.company?.company_id,
          itemType: item.itemType,
          userId: item.userId,
        }))
        setContainerShipments(shipments)
      } else {
        console.error('Failed to fetch Container shipments:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching Container shipments:', error)
    } finally {
      setIsLoadingContainerShipments(false)
    }
  }

  // Fetch CargoManagement (ETA / estado / naviera por contenedor)
  const fetchCargoMgmt = async () => {
    try {
      const response = await fetch('/api/cargo-management?pageSize=1000')
      if (response.ok) {
        const data = await response.json()
        setCargoMgmt(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching cargo-management:', error)
    }
  }

  // Fetch companies from database - NO CACHING
  const fetchCompanies = async () => {
    setIsLoadingCompanies(true)
    try {
      const response = await fetch('/api/companies/with-users', {
        method: 'GET',
        cache: 'no-store', // Disable caching completely
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
      if (response.ok) {
        const result = await response.json()
        console.log('📦 Companies with users API response:', result)
        // Map companies with users to include mailbox display format
        const companiesWithUsers = result.map((item: any) => ({
          id: item.id,
          name: item.name,
          company_id: item.company_id || item.id,
          companyId: item.company_id || item.id,
          mailbox: item.mailbox,
          userId: item.userId,
          userName: item.userName,
          displayLabel: item.displayLabel, // "mailbox - Name" format
          type: item.type, // 'company' or 'user'
        }))
        console.log('✅ Companies with users:', companiesWithUsers)
        setCompanies(companiesWithUsers)
      } else {
        console.error('Failed to fetch companies with users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching companies with users:', error)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  // Fetch reference numbers from database - NO CACHING
  useEffect(() => {
    const fetchReferenceNumbers = async () => {
      setIsLoadingReferenceNos(true)
      try {
        const response = await fetch('/api/cargo-management/reference-numbers', {
          method: 'GET',
          cache: 'no-store', // Disable caching completely
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        })
        if (response.ok) {
          const data = await response.json()
          setRecibidosEnBodegaReferenceNos(data.data || [])
        } else {
          console.error('Failed to fetch reference numbers:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching reference numbers:', error)
      } finally {
        setIsLoadingReferenceNos(false)
      }
    }

    fetchReferenceNumbers()
    fetchEnvios()
    fetchLcl()
    fetchContainerShipments()
    fetchCompanies()
    fetchCargoMgmt()
  }, [])

  // Contenedores agrupados por cliente (FCL + ETA/estado de CargoManagement)
  const containerGroups = useMemo(
    () => buildContainerGroups(
      envios.map(e => ({
        containerNumber: e.numeroContenedor,
        empresaId: e.empresaId,
        empresaName: e.empresaName,
        empresaCode: e.empresaCode,
        transportType: e.tipoTransporte,
        totalCbm: e.totalCbm,
        totalWeight: e.totalWeight,
        misidentified: e.malIdentificado,
        dangerousGoods: e.dg,
      })),
      cargoMgmt,
    ),
    [envios, cargoMgmt]
  )

  // Derived
  const filteredEnvios = useMemo(() => {
    console.log('🔍 Filtering envios. Total envios:', envios.length, envios)
    return envios.filter((e) => {
      const searchLower = search.toLowerCase()
      const empresaDisplay = e.empresaCode && e.empresaName
        ? `${e.empresaCode} - ${e.empresaName}`.toLowerCase()
        : (e.empresaName || '').toLowerCase()

      const hayCoincidencia =
        e.trackingWH.toLowerCase().includes(searchLower) ||
        e.forwarder.toLowerCase().includes(searchLower) ||
        e.consolidador.toLowerCase().includes(searchLower) ||
        e.numeroContenedor.toLowerCase().includes(searchLower) ||
        empresaDisplay.includes(searchLower)

      const coincideTipo = !filterTipo || e.tipoTransporte === filterTipo
      const coincideFlag =
        filterFlagged === 'all' ||
        (filterFlagged === 'yes' && !!e.malIdentificado) ||
        (filterFlagged === 'no' && !e.malIdentificado)

      return hayCoincidencia && coincideTipo && coincideFlag
    })
  }, [envios, search, filterTipo, filterFlagged])

  // Filtered LCL
  const filteredLcl = useMemo(() => {
    return lcl.filter((l) => {
      const searchLower = lclSearch.toLowerCase()
      const empresaDisplay = l.empresaCode && l.empresaName
        ? `${l.empresaCode} - ${l.empresaName}`.toLowerCase()
        : (l.empresaName || '').toLowerCase()

      const hayCoincidencia =
        l.blNumber.toLowerCase().includes(searchLower) ||
        (l.notas && l.notas.toLowerCase().includes(searchLower)) ||
        empresaDisplay.includes(searchLower)

      const coincideFechaInicio = !lclFilterStartDate ||
        new Date(l.eta) >= new Date(lclFilterStartDate)

      const coincideFechaFin = !lclFilterEndDate ||
        new Date(l.eta) <= new Date(lclFilterEndDate)

      return hayCoincidencia && coincideFechaInicio && coincideFechaFin
    })
  }, [lcl, lclSearch, lclFilterStartDate, lclFilterEndDate])

  const filteredContainerShipments = useMemo(() => {
    return containerShipments.filter((c) => {
      const searchLower = containerSearch.toLowerCase()
      const empresaDisplay = c.empresaCode && c.empresaName
        ? `${c.empresaCode} - ${c.empresaName}`.toLowerCase()
        : (c.empresaName || '').toLowerCase()

      const hayCoincidencia =
        c.blNumber.toLowerCase().includes(searchLower) ||
        (c.notas && c.notas.toLowerCase().includes(searchLower)) ||
        empresaDisplay.includes(searchLower)

      const coincideFechaInicio = !containerFilterStartDate ||
        new Date(c.eta) >= new Date(containerFilterStartDate)

      const coincideFechaFin = !containerFilterEndDate ||
        new Date(c.eta) <= new Date(containerFilterEndDate)

      return hayCoincidencia && coincideFechaInicio && coincideFechaFin
    })
  }, [containerShipments, containerSearch, containerFilterStartDate, containerFilterEndDate])

  // DataGrid columns
  const envioCols: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha Registro',
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '-',
    },
    { field: 'trackingWH', headerName: 'Tracking / WH', flex: 1, minWidth: 160 },
    { field: 'consolidador', headerName: 'Casillero', width: 140 },
    { field: 'additionalCode', headerName: 'Cód. Adic.', width: 110 },
    {
      field: 'empresaName',
      headerName: 'Empresa',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const row = params.row as Envio
        if (!row.empresaName) return '-'
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      },
      valueGetter: (params) => {
        const row = params.row as Envio
        if (!row.empresaName) return ''
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      }
    },
    {
      field: 'tipoTransporte',
      headerName: 'Tipo',
      width: 130,
      renderCell: (params) => {
        const isAir = params.value === 'AIR'
        return (
          <Chip
            icon={isAir ? <Flight fontSize="small" /> : <DirectionsBoat fontSize="small" />}
            label={isAir ? 'Aéreo' : 'Marítimo'}
            size="small"
            variant="outlined"
            sx={{
              color: isAir ? '#1976d2' : '#d32f2f',
              borderColor: isAir ? '#1976d2' : '#d32f2f',
              '& .MuiChip-icon': {
                color: isAir ? '#1976d2' : '#d32f2f'
              }
            }}
          />
        )
      },
    },
    { field: 'numeroContenedor', headerName: 'N° Contenedor', flex: 1, minWidth: 160 },
    {
      field: 'dg',
      headerName: 'DG',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return params.value ? (
          <Tooltip title="Dangerous Goods">
            <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
          </Tooltip>
        ) : (
          null
          // <Tooltip title="No Dangerous Goods">
          //   <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
          // </Tooltip>
        )
      },
    },
    {
      field: 'rp',
      headerName: 'RP',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return params.value ? (
          <Tooltip title="Refrigerated Product">
            <Warning sx={{ color: '#ff9800', fontSize: 20 }} />
          </Tooltip>
        ) : (
          null
          // <Tooltip title="No Refrigeration Required">
          //   <Cancel sx={{ color: '#9e9e9e', fontSize: 20 }} />
          // </Tooltip>
        )
      },
    },
    {
      field: 'fechaAproximada',
      headerName: 'Fecha Aproximada',
      width: 150,
      renderCell: (params) => {
        const row = params.row as Envio
        if (row.tipoTransporte === 'AIR' && row.fechaAproximada) {
          return (
            <Typography variant="body2">
              {new Date(row.fechaAproximada).toLocaleDateString('es-ES')}
            </Typography>
          )
        }
        return null
      },
    },
    {
      field: 'malIdentificado',
      headerName: 'Mal identificado',
      width: 170,
      renderCell: (params) =>
        params.value ? (
          <Chip
            label="Mal identificado"
            size="small"
            variant="outlined"
            color="error"
            icon={<CloseRounded fontSize="small" />}
          />
        ) : null,
    },
    { field: 'forwarder', headerName: 'Forwarder', flex: 1, minWidth: 160 },
    {
      field: 'totalCbm',
      headerName: 'CBM',
      width: 100,
      renderCell: (params) => params.value != null ? params.value.toFixed(3) : '-',
    },
    {
      field: 'totalWeight',
      headerName: 'Peso (kg)',
      width: 100,
      renderCell: (params) => params.value != null ? params.value.toFixed(1) : '-',
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box className="flex gap-1">
          {isAdmin ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditEnvio(params.row as Envio)
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEnvio((params.row as Envio).id)
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Ver detalles">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditEnvio(params.row as Envio)
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]

  const envioRows: GridRowsProp = filteredEnvios.map((e) => ({ ...e, id: e.id }))
  console.log('📋 Final envioRows for DataGrid:', envioRows.length, envioRows)

  // LCL columns
  const lclCols: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha Registro',
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '-',
    },
    { field: 'blNumber', headerName: 'BL Number', flex: 1, minWidth: 140 },
    {
      field: 'empresaName',
      headerName: 'Empresa',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const row = params.row as LCLRow
        if (!row.empresaName) return '-'
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      },
      valueGetter: (params) => {
        const row = params.row as LCLRow
        if (!row.empresaName) return ''
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      }
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES')
    },
    { field: 'notas', headerName: 'Notas', flex: 1.5, minWidth: 200 },
    {
      field: 'fechaSalida',
      headerName: 'Fecha de Salida',
      width: 140,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES')
    },
    {
      field: 'montoCarga',
      headerName: 'Monto de la carga',
      width: 150,
      renderCell: (params) => `$${params.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'totalCBM',
      headerName: 'Total CBM',
      width: 120,
      renderCell: (params) => `${params.value} m³`
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120, // Reduced width since we're using icon buttons
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box className="flex gap-1">
          {isAdmin ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditLcl(params.row as LCLRow)
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteLcl(params.row.id)
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Ver detalles">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditLcl(params.row as LCLRow)
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]
  const lclRows: GridRowsProp = filteredLcl.map((r) => ({ ...r, id: r.id }))

  const containerCols: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha Registro',
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString('es-ES') : '-',
    },
    { field: 'blNumber', headerName: 'BL Number', flex: 1, minWidth: 140 },
    {
      field: 'empresaName',
      headerName: 'Empresa',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const row = params.row as ContainerShipmentRow
        if (!row.empresaName) return '-'
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      },
      valueGetter: (params) => {
        const row = params.row as ContainerShipmentRow
        if (!row.empresaName) return ''
        return row.empresaCode ? `${row.empresaCode} - ${row.empresaName}` : row.empresaName
      }
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES')
    },
    { field: 'notas', headerName: 'Notas', flex: 1.5, minWidth: 200 },
    {
      field: 'fechaSalida',
      headerName: 'Fecha de Salida',
      width: 140,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES')
    },
    {
      field: 'montoCarga',
      headerName: 'Monto de la carga',
      width: 150,
      renderCell: (params) => `$${params.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
    },
    {
      field: 'totalCBM',
      headerName: 'Total CBM',
      width: 120,
      renderCell: (params) => `${params.value} m³`
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box className="flex gap-1">
          {isAdmin ? (
            <>
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditContainer(params.row as ContainerShipmentRow)
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteContainer(params.row.id)
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Ver detalles">
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditContainer(params.row as ContainerShipmentRow)
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ]
  const containerRows: GridRowsProp = filteredContainerShipments.map((r) => ({ ...r, id: r.id }))

  // Handlers Envíos
  const handleAddEnvio = () => {
    // open in bulk by default
    setEditingEnvio(null)
    setEnvioForm({
      trackingWH: '',
      forwarder: '',
      consolidador: '',
      tipoTransporte: 'MAR',
      numeroContenedor: '',
      fechaAproximada: undefined,
      malIdentificado: false,
      dg: false,
      rp: false,
      additionalCode: '',
      comments: '',
      totalCbm: null,
      totalWeight: null,
      pieces: [],
    })
    setIsBulkMode(true)
    setBulkRows([createEmptyBulkRow()])
    setOpenEnvioDialog(true)
  }

  const handleEditEnvio = (row: Envio) => {
    // keep single mode for editing
    setIsBulkMode(false)
    setEditingEnvio(row)
    setEnvioForm({
      trackingWH: row.trackingWH,
      forwarder: row.forwarder,
      consolidador: row.consolidador,
      tipoTransporte: row.tipoTransporte,
      numeroContenedor: row.numeroContenedor,
      fechaAproximada: row.fechaAproximada,
      malIdentificado: !!row.malIdentificado,
      dg: !!row.dg,
      rp: !!row.rp,
      additionalCode: row.additionalCode ?? '',
      comments: row.comments ?? '',
      totalCbm: row.totalCbm ?? null,
      totalWeight: row.totalWeight ?? null,
      pieces: row.pieces ?? [],
    })
    setOpenEnvioDialog(true)
  }

  // Delete for FCL using dialog
  const handleDeleteEnvio = (id: string) => {
    setItemToDelete(id)
    setDeleteType('FCL')
    setDeleteConfirmOpen(true)
  }

  const handleSubmitEnvio = async () => {
    // tightened validation: consolidador is also required
    if (
      !envioForm.trackingWH ||
      // forwarder now optional
      !envioForm.consolidador ||
      !envioForm.numeroContenedor.trim()
    ) return

    if (editingEnvio) {
      // Update existing via API
      try {
        const shipmentData = {
          trackingWarehouse: envioForm.trackingWH,
          forwarder: envioForm.forwarder || undefined,
          mailbox: envioForm.consolidador,
          transportType: envioForm.tipoTransporte,
          containerNumber: envioForm.numeroContenedor,
          approximateDate: envioForm.fechaAproximada ? envioForm.fechaAproximada.toISOString() : undefined,
          misidentified: envioForm.malIdentificado,
          dangerousGoods: envioForm.dg,
          refrigeratedProduct: envioForm.rp,
          additionalCode: envioForm.additionalCode || null,
          comments: envioForm.comments || null,
          totalCbm: envioForm.totalCbm,
          totalWeight: envioForm.totalWeight,
          pieces: (envioForm.pieces || []).map(p => ({
            quantity: p.quantity,
            length: p.length,
            width: p.width,
            height: p.height,
            weight: p.weight,
          })),
        }

        const response = await fetch(`/api/fcl-shipments/${editingEnvio.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to update shipment:', error)
          const errorMessage = error.details || error.error || 'Error al actualizar el envío. Por favor, intente de nuevo.'
          showSnackbar(errorMessage, 'error')
          return
        }

        // Refresh data from database
        await fetchEnvios()

        setOpenEnvioDialog(false)
        showSnackbar('Envío actualizado exitosamente', 'success')
      } catch (error) {
        console.error('Error updating shipment:', error)
        showSnackbar('Error al actualizar el envío. Por favor, intente de nuevo.', 'error')
      }
    } else {
      // Create new shipment via API
      try {
        const shipmentData = {
          trackingWarehouse: envioForm.trackingWH,
          forwarder: envioForm.forwarder || undefined,
          mailbox: envioForm.consolidador,
          transportType: envioForm.tipoTransporte,
          containerNumber: envioForm.numeroContenedor,
          approximateDate: envioForm.fechaAproximada ? envioForm.fechaAproximada.toISOString() : undefined,
          misidentified: envioForm.malIdentificado,
          dangerousGoods: envioForm.dg,
          refrigeratedProduct: envioForm.rp,
          additionalCode: envioForm.additionalCode || null,
          comments: envioForm.comments || null,
          totalCbm: envioForm.totalCbm,
          totalWeight: envioForm.totalWeight,
          pieces: (envioForm.pieces || []).map(p => ({
            quantity: p.quantity,
            length: p.length,
            width: p.width,
            height: p.height,
            weight: p.weight,
          })),
        }

        const response = await fetch('/api/fcl-shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to create shipment:', error)
          const errorMessage = error.details || error.error || 'Error al crear el envío. Por favor, intente de nuevo.'
          showSnackbar(errorMessage, 'error')
          return
        }

        const result = await response.json()
        console.log('Shipment created:', result)

        // Refresh data from database
        await fetchEnvios()

        setOpenEnvioDialog(false)
        showSnackbar('Envío creado exitosamente', 'success')
      } catch (error) {
        console.error('Error submitting shipment:', error)
        showSnackbar('Error al crear el envío. Por favor, intente de nuevo.', 'error')
      }
    }
  }

  // Bulk submit
  const handleSubmitBulkEnvios = async () => {
    const validRows = bulkRows.filter(
      r => r.trackingWH.trim() && r.consolidador.trim() && r.numeroContenedor.trim()
    )
    if (validRows.length === 0) return

    try {
      // Prepare data for API
      const shipmentsData = validRows.map(r => ({
        trackingWarehouse: r.trackingWH,
        forwarder: r.forwarder || undefined,
        mailbox: r.consolidador,
        transportType: r.tipoTransporte,
        containerNumber: r.numeroContenedor,
        approximateDate: r.fechaAproximada ? r.fechaAproximada.toISOString() : undefined,
        misidentified: r.malIdentificado,
        dangerousGoods: r.dg,
        refrigeratedProduct: r.rp,
      }))

      // Submit to API
      const response = await fetch('/api/fcl-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentsData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create shipments:', error)
        // Show detailed error message if available (e.g., validation errors)
        let errorMessage = 'Error al crear los envíos. Por favor, intente de nuevo.'
        if (typeof error.error === 'string') {
          errorMessage = error.error
        } else if (Array.isArray(error.details)) {
          errorMessage = error.details.map((detail: any) => detail.message || detail).join(', ')
        }
        showSnackbar(errorMessage, 'error')
        return
      }

      const result = await response.json()
      console.log('Shipments created:', result)

      // Refresh data from database
      await fetchEnvios()

      setOpenEnvioDialog(false)
      showSnackbar(`${result.count || validRows.length} envío(s) creado(s) exitosamente`, 'success')
    } catch (error) {
      console.error('Error submitting bulk shipments:', error)
      showSnackbar('Error al crear los envíos. Por favor, intente de nuevo.', 'error')
    }
  }

  // Handlers LCL
  const handleAddLcl = () => {
    setEditingLcl(null)
    setLclForm({
      blNumber: '',
      eta: '' as any, // Empty for new entries
      notas: '',
      fechaSalida: '' as any, // Empty for new entries
      montoCarga: '', // Empty string for new entries
      totalCBM: '', // Empty string for new entries
      empresaId: '',
      itemType: undefined,
      userId: undefined,
    })
    // Fetch fresh company data when dialog opens (NO CACHING)
    fetchCompanies()
    setOpenLclDialog(true)
  }

  const handleEditLcl = (row: LCLRow) => {
    setEditingLcl(row)
    setLclForm({
      blNumber: row.blNumber,
      eta: row.eta,
      notas: row.notas ?? '',
      fechaSalida: row.fechaSalida,
      montoCarga: row.montoCarga.toString(), // Convert to string for editing
      totalCBM: row.totalCBM.toString(), // Convert to string for editing
      empresaId: row.empresaId || '',
      itemType: row.itemType,
      userId: row.userId,
    })
    setOpenLclDialog(true)
  }

  const handleSubmitLcl = async () => {
    if (!lclForm.blNumber.trim()) return

    // Convert string values to numbers, defaulting to 0 if empty or invalid
    const montoCarga = parseFloat(lclForm.montoCarga) || 0
    const totalCBM = parseFloat(lclForm.totalCBM) || 0

    // Ensure dates are Date objects
    const eta = lclForm.eta instanceof Date ? lclForm.eta : new Date(lclForm.eta)
    const fechaSalida = lclForm.fechaSalida instanceof Date ? lclForm.fechaSalida : new Date(lclForm.fechaSalida)

    const shipmentData = {
      blNumber: lclForm.blNumber,
      eta: eta.toISOString(),
      notes: lclForm.notas || undefined,
      departureDate: fechaSalida.toISOString(),
      cargoAmount: montoCarga,
      totalCbm: totalCBM,
      empresaId: lclForm.empresaId || undefined,
      itemType: lclForm.itemType,
      userId: lclForm.userId,
    }

    try {
      if (editingLcl) {
        // Update existing
        const response = await fetch(`/api/lcl-shipments/${editingLcl.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to update LCL shipment:', error)
          let errorMessage = 'Error al actualizar el envío LCL. Por favor, intente de nuevo.'
          if (typeof error.error === 'string') {
            errorMessage = error.error
          } else if (Array.isArray(error.details)) {
            errorMessage = error.details.map((detail: any) => detail.message || detail).join(', ')
          }
          showSnackbar(errorMessage, 'error')
          return
        }

        await fetchLcl()
        showSnackbar('Envío LCL actualizado exitosamente', 'success')
      } else {
        // Create new
        const response = await fetch('/api/lcl-shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to create LCL shipment:', error)
          let errorMessage = 'Error al crear el envío LCL. Por favor, intente de nuevo.'
          if (typeof error.error === 'string') {
            errorMessage = error.error
          } else if (Array.isArray(error.details)) {
            errorMessage = error.details.map((detail: any) => detail.message || detail).join(', ')
          }
          showSnackbar(errorMessage, 'error')
          return
        }

        await fetchLcl()
        showSnackbar('Envío LCL creado exitosamente', 'success')
      }

      setOpenLclDialog(false)
    } catch (error) {
      console.error('Error submitting LCL shipment:', error)
      showSnackbar('Error al procesar el envío LCL. Por favor, intente de nuevo.', 'error')
    }
  }

  const handleDeleteLcl = (id: string) => {
    setItemToDelete(id)
    setDeleteType('LCL')
    setDeleteConfirmOpen(true)
  }

  const handleAddContainer = () => {
    setEditingContainer(null)
    setContainerForm({
      blNumber: '',
      eta: '' as any,
      notas: '',
      fechaSalida: '' as any,
      montoCarga: '',
      totalCBM: '',
      empresaId: '',
      itemType: undefined,
      userId: undefined,
    })
    // Fetch fresh company data when dialog opens (NO CACHING)
    fetchCompanies()
    setOpenContainerDialog(true)
  }

  const handleEditContainer = (row: ContainerShipmentRow) => {
    setEditingContainer(row)
    setContainerForm({
      blNumber: row.blNumber,
      eta: row.eta,
      notas: row.notas ?? '',
      fechaSalida: row.fechaSalida,
      montoCarga: row.montoCarga.toString(),
      totalCBM: row.totalCBM.toString(),
      empresaId: row.empresaId || '',
      itemType: row.itemType,
      userId: row.userId,
    })
    setOpenContainerDialog(true)
  }

  const handleSubmitContainer = async () => {
    if (!containerForm.blNumber.trim()) return

    const montoCarga = parseFloat(containerForm.montoCarga) || 0
    const totalCBM = parseFloat(containerForm.totalCBM) || 0

    const eta = containerForm.eta instanceof Date ? containerForm.eta : new Date(containerForm.eta)
    const fechaSalida = containerForm.fechaSalida instanceof Date ? containerForm.fechaSalida : new Date(containerForm.fechaSalida)

    const shipmentData = {
      blNumber: containerForm.blNumber,
      eta: eta.toISOString(),
      notes: containerForm.notas || undefined,
      departureDate: fechaSalida.toISOString(),
      cargoAmount: montoCarga,
      totalCbm: totalCBM,
      empresaId: containerForm.empresaId || undefined,
      itemType: containerForm.itemType,
      userId: containerForm.userId,
    }

    try {
      if (editingContainer) {
        const response = await fetch(`/api/container-shipments/${editingContainer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to update Container shipment:', error)
          let errorMessage = 'Error al actualizar el envío de contenedor. Por favor, intente de nuevo.'
          if (typeof error.error === 'string') {
            errorMessage = error.error
          } else if (Array.isArray(error.details)) {
            errorMessage = error.details.map((detail: any) => detail.message || detail).join(', ')
          }
          showSnackbar(errorMessage, 'error')
          return
        }

        await fetchContainerShipments()
        showSnackbar('Envío de contenedor actualizado exitosamente', 'success')
      } else {
        const response = await fetch('/api/container-shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('Failed to create Container shipment:', error)
          let errorMessage = 'Error al crear el envío de contenedor. Por favor, intente de nuevo.'
          if (typeof error.error === 'string') {
            errorMessage = error.error
          } else if (Array.isArray(error.details)) {
            errorMessage = error.details.map((detail: any) => detail.message || detail).join(', ')
          }
          showSnackbar(errorMessage, 'error')
          return
        }

        await fetchContainerShipments()
        showSnackbar('Envío de contenedor creado exitosamente', 'success')
      }

      setOpenContainerDialog(false)
    } catch (error) {
      console.error('Error submitting Container shipment:', error)
      showSnackbar('Error al procesar el envío de contenedor. Por favor, intente de nuevo.', 'error')
    }
  }

  const handleDeleteContainer = (id: string) => {
    setItemToDelete(id)
    setDeleteType('CONTAINER')
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        if (deleteType === 'FCL') {
          const response = await fetch(`/api/fcl-shipments/${itemToDelete}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to delete FCL shipment:', error)
            const errorMessage = error.details || error.error || 'Error al eliminar el envío FCL. Por favor, intente de nuevo.'
            showSnackbar(errorMessage, 'error')
            return
          }

          await fetchEnvios()
          showSnackbar('Envío FCL eliminado exitosamente', 'success')
        } else if (deleteType === 'LCL') {
          const response = await fetch(`/api/lcl-shipments/${itemToDelete}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to delete LCL shipment:', error)
            const errorMessage = error.details || error.error || 'Error al eliminar el envío LCL. Por favor, intente de nuevo.'
            showSnackbar(errorMessage, 'error')
            return
          }

          await fetchLcl()
          showSnackbar('Envío LCL eliminado exitosamente', 'success')
        } else if (deleteType === 'CONTAINER') {
          const response = await fetch(`/api/container-shipments/${itemToDelete}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to delete Container shipment:', error)
            const errorMessage = error.details || error.error || 'Error al eliminar el envío de contenedor. Por favor, intente de nuevo.'
            showSnackbar(errorMessage, 'error')
            return
          }

          await fetchContainerShipments()
          showSnackbar('Envío de contenedor eliminado exitosamente', 'success')
        }
      } catch (error) {
        console.error(`Error deleting ${deleteType} shipment:`, error)
        showSnackbar(`Error al eliminar el envío ${deleteType}. Por favor, intente de nuevo.`, 'error')
      }
    }
    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  const cancelDelete = () => {
    setDeleteConfirmOpen(false)
    setItemToDelete(null)
  }

  // Stats
  const totalEnvios = envios.length
  const totalAir = envios.filter((e) => e.tipoTransporte === 'AIR').length
  const totalMar = envios.filter((e) => e.tipoTransporte === 'MAR').length
  const totalFlagged = envios.filter((e) => e.malIdentificado).length

  // Validation helpers for numeric inputs
  const formatMoneyInput = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Limit to 2 decimal places for money
    if (parts[1] && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2)
    }
    
    return cleaned
  }

  const formatCBMInput = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '')
    
    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Limit to 3 decimal places for CBM
    if (parts[1] && parts[1].length > 3) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 3)
    }
    
    return cleaned
  }

  // Auto-calculate CBM and weight from pieces
  const calcTotals = (pieces: FclPiece[]) => {
    const totalCbm = pieces.reduce((acc, p) => {
      if (p.length && p.width && p.height && p.quantity) {
        return acc + (p.quantity * p.length * p.width * p.height) / 1_000_000
      }
      return acc
    }, 0)
    const totalWeight = pieces.reduce((acc, p) => acc + (p.quantity * (p.weight ?? 0)), 0)
    return { totalCbm: totalCbm || null, totalWeight: totalWeight || null }
  }

  const updateEnvioPieces = (pieces: FclPiece[]) => {
    const { totalCbm, totalWeight } = calcTotals(pieces)
    setEnvioForm(p => ({ ...p, pieces, totalCbm, totalWeight }))
  }

  // ── Excel Import helpers ────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const headers = [
      'Tracking/WH*', 'Casillero*', 'Num. Contenedor*', 'Tipo (MAR/AIR)',
      'Forwarder', 'DG (SI/NO)', 'RP (SI/NO)', 'Mal Identificado (SI/NO)',
      'Cod. Adicional', 'Comentarios', 'Cant. Piezas', 'Largo (cm)', 'Ancho (cm)', 'Alto (cm)', 'Peso (kg)',
    ]
    const example = [
      'TRACK-001', 'TP-101', 'CONT-12345', 'MAR',
      'DHL', 'NO', 'NO', 'NO', '', '', '2', '100', '80', '90', '25',
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }))
    XLSX.utils.book_append_sheet(wb, ws, 'Envios FCL')
    XLSX.writeFile(wb, 'plantilla_envios_fcl.xlsx')
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (rows.length < 2) { showSnackbar('El archivo no contiene datos', 'warning'); return }
        const parsed: XlsxRow[] = rows.slice(1)
          .filter(row => row.some((c: any) => c !== ''))
          .map(row => {
            const trackingWH = String(row[0] ?? '').trim()
            const consolidador = String(row[1] ?? '').trim()
            const numeroContenedor = String(row[2] ?? '').trim()
            const tipoStr = String(row[3] ?? 'MAR').trim().toUpperCase()
            const tipoTransporte = (tipoStr === 'AIR' || tipoStr === 'MAR') ? tipoStr : 'MAR'
            const forwarder = String(row[4] ?? '').trim()
            const dg = String(row[5] ?? '').trim().toUpperCase() === 'SI'
            const rp = String(row[6] ?? '').trim().toUpperCase() === 'SI'
            const malIdentificado = String(row[7] ?? '').trim().toUpperCase() === 'SI'
            const additionalCode = String(row[8] ?? '').trim()
            const comments = String(row[9] ?? '').trim()
            const cantPiezas = parseInt(String(row[10] ?? '0')) || 0
            const largo = parseFloat(String(row[11] ?? '')) || null
            const ancho = parseFloat(String(row[12] ?? '')) || null
            const alto = parseFloat(String(row[13] ?? '')) || null
            const peso = parseFloat(String(row[14] ?? '')) || null
            const _errors: string[] = []
            if (!trackingWH) _errors.push('Tracking/WH requerido')
            if (!consolidador) _errors.push('Casillero requerido')
            if (!numeroContenedor) _errors.push('Num. Contenedor requerido')
            return { trackingWH, consolidador, numeroContenedor, tipoTransporte, forwarder, dg, rp, malIdentificado, additionalCode, comments, cantPiezas, largo, ancho, alto, peso, _errors }
          })
        setXlsxRows(parsed)
      } catch {
        showSnackbar('Error al leer el archivo Excel', 'error')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleXlsxImport = async () => {
    const validRows = xlsxRows.filter(r => r._errors.length === 0)
    if (validRows.length === 0) { showSnackbar('No hay filas válidas para importar', 'warning'); return }
    setXlsxUploading(true)
    try {
      const payload = validRows.map(r => ({
        trackingWarehouse: r.trackingWH,
        mailbox: r.consolidador,
        containerNumber: r.numeroContenedor,
        transportType: r.tipoTransporte,
        forwarder: r.forwarder || undefined,
        dangerousGoods: r.dg,
        refrigeratedProduct: r.rp,
        misidentified: r.malIdentificado,
        additionalCode: r.additionalCode || null,
        comments: r.comments || null,
        ...(r.cantPiezas > 0 ? { pieces: [{ quantity: r.cantPiezas, length: r.largo, width: r.ancho, height: r.alto, weight: r.peso }] } : {}),
      }))
      const res = await fetch('/api/fcl-shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        showSnackbar(err.details || err.error || 'Error al importar', 'error')
        return
      }
      const result = await res.json()
      showSnackbar(`${result.count} envío(s) importado(s) exitosamente`, 'success')
      setXlsxOpen(false)
      setXlsxRows([])
      fetchEnvios()
    } catch {
      showSnackbar('Error de conexión al importar', 'error')
    } finally {
      setXlsxUploading(false)
    }
  }

  // Bulk add types/state
  type EnvioFormRow = Omit<Envio, 'id' | 'createdAt' | 'updatedAt'>
  type BulkEnvioRow = EnvioFormRow & { _id: string }

  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkRows, setBulkRows] = useState<BulkEnvioRow[]>([])

  const createEmptyBulkRow = (): BulkEnvioRow => ({
    _id: Math.random().toString(36).slice(2),
    trackingWH: '',
    forwarder: '',
    consolidador: '',
    tipoTransporte: 'MAR',
    numeroContenedor: '',
    fechaAproximada: undefined,
    malIdentificado: false,
    dg: false,
    rp: false,
  })

  const addBulkRow = () => setBulkRows(prev => [...prev, createEmptyBulkRow()])
  const removeBulkRow = (id: string) =>
    setBulkRows(prev => prev.filter(r => r._id !== id))
  const updateBulkRow = <K extends keyof EnvioFormRow>(id: string, key: K, value: EnvioFormRow[K]) =>
    setBulkRows(prev => prev.map(r => (r._id === id ? { ...r, [key]: value } : r)))

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex justify-between items-center">
        <Box>
          <Typography variant="h4" className="font-bold text-ink mb-2">
            Admin Carga
          </Typography>
          <Typography variant="body1" className="text-medium-gray">
            Administra información de envíos FCL y LCL
          </Typography>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={() => { setXlsxRows([]); setXlsxOpen(true) }}
              sx={{ borderColor: '#FACC15', color: '#FACC15', textTransform: 'none', fontWeight: 600 }}
            >
              Importar Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddEnvio}
              className="bg-brand-primary hover:bg-brand-secondary"
            >
              Agregar Envío
            </Button>
          </Box>
        )}
      </Box>

      {/* Pestañas principales */}
      <Card>
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{ px: 1, borderBottom: '1px solid rgba(10,10,10,0.06)', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab icon={<Inventory2 sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Contenedores" />
          <Tab icon={<LocalShipping sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Detalle de envíos" />
        </Tabs>
      </Card>

      {/* Tab 0: Contenedores agrupados por cliente */}
      {mainTab === 0 && (
        <ContainerGroupedView groups={containerGroups} loading={isLoadingEnvios} />
      )}

      {/* Tab 1: Detalle de envíos (FCL / LCL / Contenedores) */}
      {mainTab === 1 && (
      <>
      {/* Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="h5" className="font-bold text-ink">{totalEnvios}</Typography>
                  <Typography variant="body2" className="text-medium-gray">Total Envíos</Typography>
                </Box>
                <LocalShipping className="text-brand-primary text-3xl" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-info">{totalAir}</Typography>
              <Typography variant="body2" className="text-medium-gray">Aéreos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-warning">{totalMar}</Typography>
              <Typography variant="body2" className="text-medium-gray">Marítimos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="p-4">
              <Typography variant="h5" className="font-bold text-error">{totalFlagged}</Typography>
              <Typography variant="body2" className="text-medium-gray">Mal identificados</Typography>
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
                placeholder="Buscar por contenedor, casillero, forwarder, empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <Search className="mr-2 text-medium-gray" /> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo de transporte</InputLabel>
                <Select
                  label="Tipo de transporte"
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value as TipoTransporte | '')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {tipoOpts.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box className="flex gap-2 items-center">
                <FormControl fullWidth>
                  <InputLabel>Mal identificado</InputLabel>
                  <Select
                    label="Mal identificado"
                    value={filterFlagged}
                    onChange={(e) => setFilterFlagged(e.target.value as 'all' | 'yes' | 'no')}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="yes">Solo mal identificados</MenuItem>
                    <MenuItem value="no">Solo correctos</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearch('')
                    setFilterTipo('')
                    setFilterFlagged('all')
                  }}
                >
                  Limpiar
                </Button>
                <Button startIcon={<Download />} variant="outlined">
                  Exportar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Envíos (FCL) table */}
      <Card>
        <CardContent className="p-6">
          <Box style={{ height: 480, width: '100%' }}>
            <DataGrid
              rows={envioRows}
              columns={envioCols}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              pageSizeOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true } }}
              onRowDoubleClick={isAdmin ? (params) => handleEditEnvio(params.row as Envio) : undefined}
            />
          </Box>
        </CardContent>
      </Card>

      {/* LCL section */}
      <Box className="flex justify-between items-center">
        <Typography variant="h5" className="font-bold text-ink">LCL</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={handleAddLcl} className="bg-brand-primary hover:bg-brand-secondary">
            Agregar
          </Button>
        )}
      </Box>

      {/* LCL Filters */}
      <Card>
        <CardContent className="p-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por BL Number o notas..."
                value={lclSearch}
                onChange={(e) => setLclSearch(e.target.value)}
                InputProps={{ startAdornment: <Search className="mr-2 text-medium-gray" /> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ETA desde"
                type="date"
                value={lclFilterStartDate}
                onChange={(e) => setLclFilterStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ETA hasta"
                type="date"
                value={lclFilterEndDate}
                onChange={(e) => setLclFilterEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Box className="flex gap-2">
                <Button
                  startIcon={<FilterList />}
                  onClick={() => {
                    setLclSearch('')
                    setLclFilterStartDate('')
                    setLclFilterEndDate('')
                  }}
                  variant="outlined"
                  fullWidth
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Box style={{ height: 360, width: '100%' }}>
            <DataGrid
              rows={lclRows}
              columns={lclCols}
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Contenedores section */}
      <Box className="flex justify-between items-center">
        <Typography variant="h5" className="font-bold text-ink">Contenedores</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={handleAddContainer} className="bg-brand-primary hover:bg-brand-secondary">
            Agregar
          </Button>
        )}
      </Box>

      {/* Contenedores Filters */}
      <Card>
        <CardContent className="p-4">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por BL Number o notas..."
                value={containerSearch}
                onChange={(e) => setContainerSearch(e.target.value)}
                InputProps={{ startAdornment: <Search className="mr-2 text-medium-gray" /> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ETA desde"
                type="date"
                value={containerFilterStartDate}
                onChange={(e) => setContainerFilterStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="ETA hasta"
                type="date"
                value={containerFilterEndDate}
                onChange={(e) => setContainerFilterEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Box className="flex gap-2">
                <Button
                  startIcon={<FilterList />}
                  onClick={() => {
                    setContainerSearch('')
                    setContainerFilterStartDate('')
                    setContainerFilterEndDate('')
                  }}
                  variant="outlined"
                  fullWidth
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Box style={{ height: 360, width: '100%' }}>
            <DataGrid
              rows={containerRows}
              columns={containerCols}
              pageSizeOptions={[5, 10, 25]}
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>
      </>
      )}

      {/* Dialog Envío */}
      <Dialog open={openEnvioDialog} onClose={() => setOpenEnvioDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEnvio
            ? (isAdmin ? 'Editar Envío FCL' : 'Detalles del Envío FCL')
            : isBulkMode
              ? 'Agregar Envíos FCL (Carga masiva)'
              : 'Agregar Envío FCL'}
        </DialogTitle>
        <DialogContent>
          {!editingEnvio && (
            <Box className="mb-2">
              <FormControlLabel
                control={
                  <Switch
                    checked={isBulkMode}
                    onChange={(e) => setIsBulkMode(e.target.checked)}
                  />
                }
                label="Carga masiva"
              />
            </Box>
          )}

          {isBulkMode && !editingEnvio ? (
            <>
              <Typography variant="subtitle2" className="text-medium-gray">Añade múltiples envíos</Typography>
              <Divider className="my-2" />
              <Box>
                {bulkRows.map((row, idx) => (
                  <Box key={row._id} sx={{ py: 1 }}>
                    <Grid container spacing={2} alignItems="center">
                      {/* Línea 1: campos principales */}
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          required
                          label="Tracking / WH"
                          value={row.trackingWH}
                          onChange={(e) => updateBulkRow(row._id, 'trackingWH', e.target.value)}
                          placeholder="WHCNC100000122"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          required
                          label="Casillero"
                          value={row.consolidador}
                          onChange={(e) => updateBulkRow(row._id, 'consolidador', e.target.value.toUpperCase())}
                          placeholder="TP-101"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControl fullWidth required>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            label="Tipo"
                            value={row.tipoTransporte}
                            onChange={(e) => {
                              const newTipo = e.target.value as 'AIR' | 'MAR'
                              updateBulkRow(row._id, 'tipoTransporte', newTipo)
                              if (newTipo === 'MAR') updateBulkRow(row._id, 'fechaAproximada', undefined)
                            }}
                          >
                            <MenuItem value="AIR">AIR</MenuItem>
                            <MenuItem value="MAR">MAR</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        {/* N.º Contenedor as ComboBox */}
                        <Autocomplete
                          options={recibidosEnBodegaReferenceNos}
                          value={row.numeroContenedor}
                          onChange={(_, newValue) => updateBulkRow(row._id, 'numeroContenedor', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="N.º Contenedor"
                              required
                              fullWidth
                              variant="outlined"
                              size="medium" // match other fields
                              sx={{
                                borderRadius: 2,
                                minHeight: 56, // match MUI default
                              }}
                            />
                          )}
                          disableClearable
                          autoHighlight
                          openOnFocus
                          size="medium" // match other fields
                          disablePortal
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          fullWidth
                          label="Forwarder (opc)"
                          value={row.forwarder}
                          onChange={(e) => updateBulkRow(row._id, 'forwarder', e.target.value)}
                        />
                      </Grid>

                      {/* Fecha Aproximada solo para AIR */}
                      {row.tipoTransporte === 'AIR' && (
                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Fecha Aproximada"
                            type="date"
                            value={row.fechaAproximada ? new Date(row.fechaAproximada).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateBulkRow(row._id, 'fechaAproximada', e.target.value ? new Date(e.target.value) : undefined)}
                            InputLabelProps={{ shrink: true }}
                            helperText="Para envíos aéreos"
                            size="small"
                          />
                        </Grid>
                      )}

                      {/* Línea 2: switches y acciones */}
                      <Grid item xs={12} md={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!row.dg}
                              onChange={(e) => updateBulkRow(row._id, 'dg', e.target.checked)}
                            />
                          }
                          label="DG"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!row.rp}
                              onChange={(e) => updateBulkRow(row._id, 'rp', e.target.checked)}
                            />
                          }
                          label="RP"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!row.malIdentificado}
                              onChange={(e) => updateBulkRow(row._id, 'malIdentificado', e.target.checked)}
                            />
                          }
                          label="Mal Identificado"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box className="flex gap-1" sx={{ justifyContent: 'flex-end' }}>
                          <Tooltip title="Eliminar fila">
                            <IconButton color="error" onClick={() => removeBulkRow(row._id)} size="small">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Separador entre filas */}
                    {idx < bulkRows.length - 1 && <Divider sx={{ my: 1.5 }} />}
                  </Box>
                ))}

                {/* Acción global para añadir filas */}
                <Box className="flex justify-end" sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={addBulkRow}
                    sx={{
                      color: '#000',
                      borderColor: '#000',
                      '&:hover': {
                        borderColor: '#000',
                        backgroundColor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Agregar fila
                  </Button>
                </Box>
              </Box>
            </>
          ) : (
            <>
              {/* Single (existing) form */}
              <Typography variant="subtitle2" className="text-medium-gray">Datos del envío</Typography>
              <Divider className="my-2" />
              <Grid container spacing={3} className="pt-2">
                {/* 1. Tracking / WH */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Tracking / WH"
                    value={envioForm.trackingWH}
                    onChange={(e) => setEnvioForm((p) => ({ ...p, trackingWH: e.target.value }))}
                    placeholder="Ej: WHCNC100000122"
                    disabled={!isAdmin}
                  />
                </Grid>

                {/* 2. Casillero (renamed) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Casillero" // renamed
                    value={envioForm.consolidador}
                    onChange={(e) => setEnvioForm((p) => ({ ...p, consolidador: e.target.value.toUpperCase() }))}
                    placeholder="Ej: CNC-101"
                    disabled={!isAdmin}
                  />
                </Grid>

                {/* 3. Tipo de transporte + Número de Contenedor + Forwarder (misma fila) */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required disabled={!isAdmin}>
                    <InputLabel>Tipo de transporte</InputLabel>
                    <Select
                      label="Tipo de transporte"
                      value={envioForm.tipoTransporte}
                      onChange={(e) => {
                        const newTipo = e.target.value as TipoTransporte
                        setEnvioForm((p) => ({
                          ...p,
                          tipoTransporte: newTipo,
                          fechaAproximada: newTipo === 'MAR' ? undefined : p.fechaAproximada
                        }))
                      }}
                    >
                      {tipoOpts.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  {/* N.º Contenedor as ComboBox */}
                  <Autocomplete
                    options={recibidosEnBodegaReferenceNos}
                    value={envioForm.numeroContenedor}
                    onChange={(_, newValue) => setEnvioForm((p) => ({ ...p, numeroContenedor: newValue || '' }))}
                    disabled={!isAdmin}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="N.º Contenedor"
                        required
                        fullWidth
                        variant="outlined"
                        size="medium" // match other fields
                        sx={{
                          borderRadius: 2,
                          minHeight: 56, // match MUI default
                        }}
                      />
                    )}
                    disableClearable
                    autoHighlight
                    openOnFocus
                    size="medium" // match other fields
                    disablePortal
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Forwarder"
                    value={envioForm.forwarder}
                    onChange={(e) => setEnvioForm((p) => ({ ...p, forwarder: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </Grid>

                {/* Fecha Aproximada solo AIR */}
                {envioForm.tipoTransporte === 'AIR' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha Aproximada"
                      type="date"
                      value={envioForm.fechaAproximada ? envioForm.fechaAproximada.toISOString().split('T')[0] : ''}
                      onChange={(e) => setEnvioForm((p) => ({
                        ...p,
                        fechaAproximada: e.target.value ? new Date(e.target.value) : undefined
                      }))}
                      InputLabelProps={{ shrink: true }}
                      helperText="Solo requerido para envíos aéreos"
                      disabled={!isAdmin}
                    />
                  </Grid>
                )}
              </Grid>

              <Box className="mt-4">
                <Typography variant="subtitle2" className="text-medium-gray">Características</Typography>
                <Divider className="my-2" />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!envioForm.dg}
                          onChange={(e) => setEnvioForm((p) => ({ ...p, dg: e.target.checked }))}
                          disabled={!isAdmin}
                        />
                      }
                      label="DG (Dangerous Goods)"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!envioForm.rp}
                          onChange={(e) => setEnvioForm((p) => ({ ...p, rp: e.target.checked }))}
                          disabled={!isAdmin}
                        />
                      }
                      label="RP (Refrigerated Product)"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!envioForm.malIdentificado}
                          onChange={(e) => setEnvioForm((p) => ({ ...p, malIdentificado: e.target.checked }))}
                          disabled={!isAdmin}
                        />
                      }
                      label="Mal identificado"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Detalles de carga */}
              <Box className="mt-4">
                <Typography variant="subtitle2" className="text-medium-gray">Detalles de carga</Typography>
                <Divider className="my-2" />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Código adicional"
                      value={envioForm.additionalCode ?? ''}
                      onChange={(e) => setEnvioForm((p) => ({ ...p, additionalCode: e.target.value }))}
                      placeholder="Ej: 001"
                      disabled={!isAdmin}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Comentarios"
                      value={envioForm.comments ?? ''}
                      onChange={(e) => setEnvioForm((p) => ({ ...p, comments: e.target.value }))}
                      multiline
                      minRows={2}
                      placeholder="Comentarios adicionales sobre el envío"
                      disabled={!isAdmin}
                    />
                  </Grid>

                  {/* Pieces table */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Piezas / Bultos</Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <th style={{ padding: '4px 8px', textAlign: 'left', width: 70 }}>Cant.</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', width: 100 }}>Largo (cm)</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', width: 100 }}>Ancho (cm)</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', width: 100 }}>Alto (cm)</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', width: 100 }}>Peso (kg)</th>
                            {isAdmin && <th style={{ padding: '4px 8px', width: 40 }}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {(envioForm.pieces || []).map((piece, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '4px 8px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={piece.quantity}
                                  onChange={(e) => {
                                    const updated = [...(envioForm.pieces || [])]
                                    updated[idx] = { ...updated[idx], quantity: Math.max(1, parseInt(e.target.value) || 1) }
                                    updateEnvioPieces(updated)
                                  }}
                                  inputProps={{ min: 1 }}
                                  sx={{ width: 60 }}
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={piece.length ?? ''}
                                  onChange={(e) => {
                                    const updated = [...(envioForm.pieces || [])]
                                    updated[idx] = { ...updated[idx], length: e.target.value ? parseFloat(e.target.value) : null }
                                    updateEnvioPieces(updated)
                                  }}
                                  inputProps={{ min: 0, step: 0.1 }}
                                  sx={{ width: 88 }}
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={piece.width ?? ''}
                                  onChange={(e) => {
                                    const updated = [...(envioForm.pieces || [])]
                                    updated[idx] = { ...updated[idx], width: e.target.value ? parseFloat(e.target.value) : null }
                                    updateEnvioPieces(updated)
                                  }}
                                  inputProps={{ min: 0, step: 0.1 }}
                                  sx={{ width: 88 }}
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={piece.height ?? ''}
                                  onChange={(e) => {
                                    const updated = [...(envioForm.pieces || [])]
                                    updated[idx] = { ...updated[idx], height: e.target.value ? parseFloat(e.target.value) : null }
                                    updateEnvioPieces(updated)
                                  }}
                                  inputProps={{ min: 0, step: 0.1 }}
                                  sx={{ width: 88 }}
                                  disabled={!isAdmin}
                                />
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={piece.weight ?? ''}
                                  onChange={(e) => {
                                    const updated = [...(envioForm.pieces || [])]
                                    updated[idx] = { ...updated[idx], weight: e.target.value ? parseFloat(e.target.value) : null }
                                    updateEnvioPieces(updated)
                                  }}
                                  inputProps={{ min: 0, step: 0.01 }}
                                  sx={{ width: 88 }}
                                  disabled={!isAdmin}
                                />
                              </td>
                              {isAdmin && (
                                <td style={{ padding: '4px 8px' }}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      const updated = (envioForm.pieces || []).filter((_, i) => i !== idx)
                                      updateEnvioPieces(updated)
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                    {isAdmin && (
                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => {
                          const updated = [...(envioForm.pieces || []), { quantity: 1, length: null, width: null, height: null, weight: null }]
                          updateEnvioPieces(updated)
                        }}
                        sx={{ mt: 1 }}
                      >
                        Agregar pieza
                      </Button>
                    )}
                    {/* Totals */}
                    {(envioForm.pieces || []).length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 3 }}>
                        <Typography variant="body2">
                          <strong>Total CBM:</strong> {envioForm.totalCbm != null ? envioForm.totalCbm.toFixed(3) : '0.000'} m³
                        </Typography>
                        <Typography variant="body2">
                          <strong>Peso total:</strong> {envioForm.totalWeight != null ? envioForm.totalWeight.toFixed(1) : '0.0'} kg
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnvioDialog(false)}>Cerrar</Button>
          {isAdmin && (
            <>
              {isBulkMode && !editingEnvio ? (
                <Button
                  onClick={handleSubmitBulkEnvios}
                  variant="contained"
                  className="bg-brand-primary hover:bg-brand-secondary"
                  disabled={
                    !bulkRows.some(r => r.trackingWH.trim() && r.consolidador.trim() && r.numeroContenedor.trim())
                  }
                >
                  Agregar todos
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitEnvio}
                  variant="contained"
                  className="bg-brand-primary hover:bg-brand-secondary"
                  disabled={
                    !envioForm.trackingWH ||
                    !envioForm.consolidador ||
                    !envioForm.numeroContenedor.trim()
                  }
                >
                  {editingEnvio ? 'Actualizar' : 'Agregar'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog LCL */}
      <Dialog open={openLclDialog} onClose={() => setOpenLclDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingLcl ? (isAdmin ? 'Editar LCL' : 'Detalles del LCL') : 'Agregar LCL'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} className="pt-2">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="BL Number"
                value={lclForm.blNumber}
                onChange={(e) => setLclForm((p) => ({ ...p, blNumber: e.target.value }))}
                placeholder="Ej: BL-789456123"
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={companies}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  // Display format: "mailbox - Name" for users, "CODE - Company" for companies
                  return option.displayLabel || `${option.company_id} - ${option.name}`
                }}
                value={
                  lclForm.itemType === 'user'
                    ? companies.find(c => c.userId === lclForm.userId && c.type === 'user') || null
                    : companies.find(c => c.id === lclForm.empresaId && c.type === 'company') || null
                }
                onChange={(_, newValue) => {
                  console.log('🔄 Selected company/user:', newValue)
                  setLclForm((p) => ({
                    ...p,
                    empresaId: newValue?.id || '',
                    itemType: newValue?.type,
                    userId: newValue?.userId,
                  }))
                }}
                disabled={!isAdmin}
                loading={isLoadingCompanies}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empresa"
                    required
                    placeholder="Buscar por código, nombre o casillero"
                    helperText="Seleccione la empresa o casillero asociado"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`${option.id}-${option.userId || 'company'}`}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        {option.type === 'user' ? (
                          <>
                            <strong>{option.mailbox}</strong> - {option.userName}
                          </>
                        ) : (
                          <>
                            <strong>{option.company_id}</strong> - {option.name}
                          </>
                        )}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id && option.type === value?.type}
                noOptionsText="No hay empresas activas disponibles"
                filterOptions={(options, { inputValue }) => {
                  const searchTerm = inputValue.toLowerCase()
                  return options.filter(
                    (option) =>
                      option.name.toLowerCase().includes(searchTerm) ||
                      option.company_id?.toLowerCase().includes(searchTerm) ||
                      (option.mailbox?.toLowerCase().includes(searchTerm) ?? false) ||
                      (option.userName?.toLowerCase().includes(searchTerm) ?? false)
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ETA"
                type="date"
                value={lclForm.eta instanceof Date ? lclForm.eta.toISOString().split('T')[0] : lclForm.eta}
                onChange={(e) => setLclForm((p) => ({ ...p, eta: e.target.value ? new Date(e.target.value) : '' }))}
                InputLabelProps={{ shrink: true }}
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Salida"
                type="date"
                value={lclForm.fechaSalida instanceof Date ? lclForm.fechaSalida.toISOString().split('T')[0] : lclForm.fechaSalida}
                onChange={(e) => setLclForm((p) => ({ ...p, fechaSalida: e.target.value ? new Date(e.target.value) : '' }))}
                InputLabelProps={{ shrink: true }}
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto de la carga (USD)"
                value={lclForm.montoCarga}
                onChange={(e) => {
                  const formattedValue = formatMoneyInput(e.target.value)
                  setLclForm((p) => ({ ...p, montoCarga: formattedValue }))
                }}
                placeholder="Ej: 15000.50"
                helperText="Ingrese el valor total de la carga en dólares (máximo 2 decimales)"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,2}'
                }}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total CBM (metros cúbicos)"
                value={lclForm.totalCBM}
                onChange={(e) => {
                  const formattedValue = formatCBMInput(e.target.value)
                  setLclForm((p) => ({ ...p, totalCBM: formattedValue }))
                }}
                placeholder="Ej: 25.8"
                helperText="Volumen total en metros cúbicos (máximo 3 decimales)"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,3}'
                }}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                value={lclForm.notas}
                onChange={(e) => setLclForm((p) => ({ ...p, notas: e.target.value }))}
                multiline
                minRows={3}
                placeholder="Instrucciones especiales, tipo de carga, precauciones, etc."
                helperText="Información adicional sobre el manejo de la carga"
                disabled={!isAdmin}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLclDialog(false)}>Cerrar</Button>
          {isAdmin && (
            <Button
              onClick={handleSubmitLcl}
              variant="contained"
              className="bg-brand-primary hover:bg-brand-secondary"
              disabled={!lclForm.blNumber.trim()}
            >
              {editingLcl ? 'Actualizar' : 'Agregar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Contenedor */}
      <Dialog open={openContainerDialog} onClose={() => setOpenContainerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingContainer ? (isAdmin ? 'Editar Contenedor' : 'Detalles del Contenedor') : 'Agregar Contenedor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} className="pt-2">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="BL Number"
                value={containerForm.blNumber}
                onChange={(e) => setContainerForm((p) => ({ ...p, blNumber: e.target.value }))}
                placeholder="Ej: BL-789456123"
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={companies}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  // Display format: "mailbox - Name" for users, "CODE - Company" for companies
                  return option.displayLabel || `${option.company_id} - ${option.name}`
                }}
                value={
                  containerForm.itemType === 'user'
                    ? companies.find(c => c.userId === containerForm.userId && c.type === 'user') || null
                    : companies.find(c => c.id === containerForm.empresaId && c.type === 'company') || null
                }
                onChange={(_, newValue) => {
                  console.log('🔄 Selected company/user:', newValue)
                  setContainerForm((p) => ({
                    ...p,
                    empresaId: newValue?.id || '',
                    itemType: newValue?.type,
                    userId: newValue?.userId,
                  }))
                }}
                disabled={!isAdmin}
                loading={isLoadingCompanies}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Empresa"
                    required
                    placeholder="Buscar por código, nombre o casillero"
                    helperText="Seleccione la empresa o casillero asociado"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`${option.id}-${option.userId || 'company'}`}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2">
                        {option.type === 'user' ? (
                          <>
                            <strong>{option.mailbox}</strong> - {option.userName}
                          </>
                        ) : (
                          <>
                            <strong>{option.company_id}</strong> - {option.name}
                          </>
                        )}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id && option.type === value?.type}
                noOptionsText="No hay empresas activas disponibles"
                filterOptions={(options, { inputValue }) => {
                  const searchTerm = inputValue.toLowerCase()
                  return options.filter(
                    (option) =>
                      option.name.toLowerCase().includes(searchTerm) ||
                      option.company_id?.toLowerCase().includes(searchTerm) ||
                      (option.mailbox?.toLowerCase().includes(searchTerm) ?? false) ||
                      (option.userName?.toLowerCase().includes(searchTerm) ?? false)
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ETA"
                type="date"
                value={containerForm.eta instanceof Date ? containerForm.eta.toISOString().split('T')[0] : containerForm.eta}
                onChange={(e) => setContainerForm((p) => ({ ...p, eta: e.target.value ? new Date(e.target.value) : '' }))}
                InputLabelProps={{ shrink: true }}
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Salida"
                type="date"
                value={containerForm.fechaSalida instanceof Date ? containerForm.fechaSalida.toISOString().split('T')[0] : containerForm.fechaSalida}
                onChange={(e) => setContainerForm((p) => ({ ...p, fechaSalida: e.target.value ? new Date(e.target.value) : '' }))}
                InputLabelProps={{ shrink: true }}
                required
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto de la carga (USD)"
                value={containerForm.montoCarga}
                onChange={(e) => {
                  const formattedValue = formatMoneyInput(e.target.value)
                  setContainerForm((p) => ({ ...p, montoCarga: formattedValue }))
                }}
                placeholder="Ej: 15000.50"
                helperText="Ingrese el valor total de la carga en dólares (máximo 2 decimales)"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,2}'
                }}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total CBM (metros cúbicos)"
                value={containerForm.totalCBM}
                onChange={(e) => {
                  const formattedValue = formatCBMInput(e.target.value)
                  setContainerForm((p) => ({ ...p, totalCBM: formattedValue }))
                }}
                placeholder="Ej: 25.8"
                helperText="Volumen total en metros cúbicos (máximo 3 decimales)"
                inputProps={{
                  inputMode: 'decimal',
                  pattern: '[0-9]*\.?[0-9]{0,3}'
                }}
                disabled={!isAdmin}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                value={containerForm.notas}
                onChange={(e) => setContainerForm((p) => ({ ...p, notas: e.target.value }))}
                multiline
                minRows={3}
                placeholder="Instrucciones especiales, tipo de carga, precauciones, etc."
                helperText="Información adicional sobre el manejo de la carga"
                disabled={!isAdmin}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContainerDialog(false)}>Cerrar</Button>
          {isAdmin && (
            <Button
              onClick={handleSubmitContainer}
              variant="contained"
              className="bg-brand-primary hover:bg-brand-secondary"
              disabled={!containerForm.blNumber.trim()}
            >
              {editingContainer ? 'Actualizar' : 'Agregar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Excel Import Dialog */}
      <Dialog open={xlsxOpen} onClose={() => setXlsxOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Importar Envíos FCL desde Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<Download />} onClick={downloadTemplate} sx={{ textTransform: 'none' }}>
              Descargar Plantilla
            </Button>
            <Button variant="contained" component="label" startIcon={<UploadFile />}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, textTransform: 'none' }}>
              Seleccionar Excel
              <input type="file" hidden accept=".xlsx,.xls" onChange={e => {
                const file = e.target.files?.[0]
                if (file) parseExcelFile(file)
                e.target.value = ''
              }} />
            </Button>
            {xlsxRows.length > 0 && (
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                {xlsxRows.length} fila(s) · <span style={{ color: '#16A34A', fontWeight: 700 }}>{xlsxRows.filter(r => r._errors.length === 0).length} válidas</span> · <span style={{ color: '#DC2626', fontWeight: 700 }}>{xlsxRows.filter(r => r._errors.length > 0).length} con errores</span>
              </Typography>
            )}
          </Box>

          {xlsxRows.length > 0 ? (
            <Box sx={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 2 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                    {['#', 'Tracking/WH', 'Casillero', 'Contenedor', 'Tipo', 'Forwarder', 'DG', 'RP', 'Mal ID', 'Cod. Adic.', 'Comentarios', 'Piezas', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {xlsxRows.map((row, i) => (
                    <tr key={i} style={{ background: row._errors.length > 0 ? '#FEF2F2' : '#F0FDF4', borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '6px 12px', color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: '6px 12px', fontWeight: 600 }}>{row.trackingWH || <span style={{ color: '#DC2626' }}>—</span>}</td>
                      <td style={{ padding: '6px 12px' }}>{row.consolidador || <span style={{ color: '#DC2626' }}>—</span>}</td>
                      <td style={{ padding: '6px 12px' }}>{row.numeroContenedor || <span style={{ color: '#DC2626' }}>—</span>}</td>
                      <td style={{ padding: '6px 12px' }}>{row.tipoTransporte}</td>
                      <td style={{ padding: '6px 12px', color: '#6B7280' }}>{row.forwarder || '—'}</td>
                      <td style={{ padding: '6px 12px' }}>{row.dg ? 'SI' : 'NO'}</td>
                      <td style={{ padding: '6px 12px' }}>{row.rp ? 'SI' : 'NO'}</td>
                      <td style={{ padding: '6px 12px' }}>{row.malIdentificado ? 'SI' : 'NO'}</td>
                      <td style={{ padding: '6px 12px', color: '#6B7280' }}>{row.additionalCode || '—'}</td>
                      <td style={{ padding: '6px 12px', color: '#6B7280', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.comments || '—'}</td>
                      <td style={{ padding: '6px 12px', color: '#6B7280' }}>{row.cantPiezas > 0 ? `${row.cantPiezas} pz` : '—'}</td>
                      <td style={{ padding: '6px 12px' }}>
                        {row._errors.length > 0
                          ? <span style={{ color: '#DC2626', fontSize: 12 }}>{row._errors.join(', ')}</span>
                          : <span style={{ color: '#16A34A', fontSize: 12, fontWeight: 700 }}>✓ OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: '#9CA3AF' }}>
              <UploadFile sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
              <Typography variant="body1" sx={{ mb: 0.5 }}>Descarga la plantilla, llénala y súbela aquí</Typography>
              <Typography variant="caption">
                Columnas: Tracking/WH · Casillero · Num. Contenedor · Tipo · Forwarder · DG · RP · Mal Identificado · Cod. Adicional · Comentarios · Cant. Piezas · Largo · Ancho · Alto · Peso
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setXlsxOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          {xlsxRows.filter(r => r._errors.length === 0).length > 0 && (
            <Button onClick={handleXlsxImport} variant="contained" disabled={xlsxUploading}
              sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              {xlsxUploading ? 'Importando...' : `Importar ${xlsxRows.filter(r => r._errors.length === 0).length} envío(s)`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            ¿Estás seguro de que deseas eliminar este envío {deleteType}? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for toast notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}