'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  TrendingUp,
  LocalShipping,
  Inventory,
  CheckCircle,
  Schedule,
  Warning,
  DirectionsBoat,
  Flight,
  ArrowBackIos,
  ArrowForwardIos,
  Close,
  AccessTime,
  LocationOn,
  Business,
  CalendarToday,
  EditOutlined,
  DirectionsBoatOutlined,
  BoltOutlined,
  PhoneCallback,
  NotificationsActive,
  WarningAmber,
  AddPhotoAlternate,
  DeleteOutline,
  CloudUpload,
  Public,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import {
  buildContainerGroups,
  ARRIVAL_CONFIG,
  arrivalCountdown,
  type ContainerGroup,
} from '@/lib/containerGroups'

// ============== Live Clocks ==============
function useLiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatClock(now: Date, tz: string) {
  const time = now.toLocaleTimeString('es-PA', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const date = now.toLocaleDateString('es-PA', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  return { time, date }
}

function LiveClocks() {
  const now = useLiveClock()
  const panama = formatClock(now, 'America/Panama')
  const china = formatClock(now, 'Asia/Shanghai')

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      {[
        { label: 'Panam\u00e1', flag: '\ud83c\uddf5\ud83c\udde6', ...panama },
        { label: 'China', flag: '\ud83c\udde8\ud83c\uddf3', ...china },
      ].map(c => (
        <Box key={c.label} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1, borderRadius: '12px',
          bgcolor: 'rgba(10, 10, 10, 0.05)', border: '1px solid rgba(10, 10, 10, 0.08)',
        }}>
          <Typography sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{c.flag}</Typography>
          <Box>
            <Typography sx={{ fontSize: '0.68rem', color: '#78716C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
              {c.label}
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A0A0A', fontFamily: 'monospace', lineHeight: 1.3 }}>
              {c.time}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#78716C', fontWeight: 500, lineHeight: 1 }}>
              {c.date}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// ============== Types ==============
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
  subtitle?: string
}

interface CargoManagement {
  id: string
  containerNumber: string
  eta: Date | null
  location: string
  status: string
  shippingLine: string | null
  departureDate: Date | null
  referenceNo: string | null
}

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
  status: string
  location: string
  eta: Date | null
  referenceNo: string | null
}

interface FclShipment {
  id: string
  trackingWarehouse: string
  forwarder: string | null
  mailbox: string
  transportType: 'AIR' | 'MAR'
  containerNumber: string
  approximateDate: Date | null
  misidentified: boolean
  dangerousGoods: boolean
  refrigeratedProduct: boolean
  companyId: string | null
  company?: {
    id: string
    name: string
    company_id: string
  }
}

interface LclShipment {
  id: string
  blNumber: string
  eta: Date
  notes: string | null
  departureDate: Date
  cargoAmount: number
  totalCbm: number
  companyId: string | null
  company?: {
    id: string
    name: string
    company_id: string
  }
}

// ============== Address Change Banner ==============
function AddressChangeBanner({ mailbox, name }: { mailbox?: string | null; name?: string | null }) {
  const code = mailbox || ''
  const fullName = name || ''
  const addressText = [
    'Provincia: 广东省',
    'ciudad: 广州市',
    'distrito: 南沙区',
    'calle: 大岗镇',
    `direccion: 荔岗路 1号2栋101厂之121${code ? ` (${code})` : ''}`,
    ...(code || fullName ? [`Nombre del destinatario: ${code}${fullName ? ` - ${fullName}` : ''}`] : []),
    'Número de teléfono: 13536140636',
    '',
    '注：送货前一定要先联系仓库，如货物太大件，太重，太多，仓库不负责卸货',
  ].join('\n')

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
      px: 3,
      py: 2,
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #0A0A0A 0%, #292524 100%)',
      boxShadow: '0 12px 28px -8px rgba(10,10,10,0.22)',
      border: '1px solid rgba(250,204,21,0.25)',
    }}>
      <Warning sx={{ color: 'white', fontSize: '1.6rem', flexShrink: 0, mt: 0.25 }} />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ¡Actualización de dirección — China (广州)!
          </Typography>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 0.8, py: 0.15, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.25)' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Urgente
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', lineHeight: 1.6, mb: 1 }}>
          La dirección de nuestra bodega en China ha cambiado. Actualice sus próximos envíos.
        </Typography>
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.25)', borderRadius: '8px', px: 2, py: 1.5, display: 'inline-block' }}>
          <Typography component="pre" sx={{ color: 'white', fontSize: '0.82rem', lineHeight: 1.9, fontFamily: 'monospace', whiteSpace: 'pre-wrap', m: 0 }}>
            {addressText}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ============== Container Date Banner ==============
function ContainerDateBanner({ isAdmin }: { isAdmin: boolean }) {
  const [label, setLabel] = useState<'Cierre' | 'Salida'>('Cierre')
  const [date, setDate] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editLabel, setEditLabel] = useState<'Cierre' | 'Salida'>('Cierre')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/nextContainer')
      .then(r => r.json())
      .then(({ value }) => {
        if (value) {
          try {
            const parsed = JSON.parse(value)
            setLabel(parsed.label || 'Cierre')
            setDate(parsed.date || null)
          } catch { /* invalid JSON, ignore */ }
        }
      })
      .catch(() => { /* ignore network errors */ })
  }, [])

  const openEdit = () => {
    setEditLabel(label)
    setEditDate(date || '')
    setSaveError(null)
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/settings/nextContainer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify({ label: editLabel, date: editDate }) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSaveError(err.error || `Error ${res.status}`)
        return
      }
      setLabel(editLabel)
      setDate(editDate || null)
      setEditOpen(false)
    } catch {
      setSaveError('Error de conexión. Intente de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 2,
        borderRadius: '14px',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #171717 100%)',
        boxShadow: '0 12px 30px -10px rgba(10,10,10,0.25)',
        flexWrap: 'wrap',
      }}>
        <DirectionsBoatOutlined sx={{ color: '#FACC15', fontSize: '1.5rem', flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            {label === 'Cierre' ? 'Cierre de próximo contenedor' : 'Salida de próximo contenedor'}
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, mt: 0.25 }}>
            {formattedDate ?? <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontWeight: 400, fontSize: '1rem' }}>Sin fecha establecida</span>}
          </Typography>
        </Box>
        {isAdmin && (
          <Tooltip title="Editar fecha">
            <IconButton size="small" onClick={openEdit} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
              <EditOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar fecha de contenedor</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Tipo de evento</InputLabel>
            <Select
              label="Tipo de evento"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value as 'Cierre' | 'Salida')}
            >
              <MenuItem value="Cierre">Cierre de próximo contenedor</MenuItem>
              <MenuItem value="Salida">Salida de próximo contenedor</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Fecha"
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          {saveError && (
            <Typography variant="body2" color="error">{saveError}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !editDate}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ============== Stat Card Component ==============
function StatCard({ title, value, icon, color, trend, subtitle }: StatCardProps) {
  return (
    <Card sx={{
      height: '100%',
      borderRadius: '16px',
      border: '1px solid rgba(10, 10, 10, 0.06)',
      background: '#FFFFFF',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 14px 30px -10px rgba(10, 10, 10, 0.12)',
        borderColor: 'rgba(10, 10, 10, 0.12)',
      },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{
              color: '#A8A29E',
              mb: 1,
              fontSize: '0.82rem',
              fontWeight: 500,
              letterSpacing: '0.025em'
            }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{
              fontWeight: 700,
              color: '#0A0A0A',
              fontSize: '2rem',
              lineHeight: 1,
              mb: 0.5
            }}>
              {value.toLocaleString()}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{
                color: '#78716C',
                fontSize: '0.75rem',
                display: 'block',
                mt: 0.5
              }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{
                  fontSize: '1rem',
                  mr: 0.5,
                  color: trend > 0 ? '#10B981' : '#EF4444'
                }} />
                <Typography variant="caption" sx={{
                  color: trend > 0 ? '#10B981' : '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{
            p: 2,
            borderRadius: '16px',
            background: color,
            boxShadow: '0 6px 14px -4px rgba(10, 10, 10, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 56,
            minHeight: 56,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ============== Quote Follow-Up Alerts ==============
interface SentQuoteAlert {
  id: string
  quoteNumber: string
  cliente: string
  total: number
  createdAt: string
  updatedAt: string
  hoursInSent: number
  level: 'warning' | 'attention' | 'critical'
  source: 'fast-quote' | 'quote'
  quoteType?: string
}

const LEVEL_CONFIG = {
  critical:  { label: 'OBLIGATORIO llamar al cliente', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  attention: { label: 'Requiere seguimiento urgente', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  warning:   { label: 'Pendiente de seguimiento', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
}

function getLevelIcon(level: string) {
  if (level === 'critical') return <PhoneCallback sx={{ fontSize: 18 }} />
  if (level === 'attention') return <NotificationsActive sx={{ fontSize: 18 }} />
  return <WarningAmber sx={{ fontSize: 18 }} />
}

function formatHours(h: number) {
  if (h >= 24) return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`
  return `${Math.floor(h)}h`
}

function classifyAlerts(data: any[], source: 'fast-quote' | 'quote'): SentQuoteAlert[] {
  if (!Array.isArray(data)) return []
  const now = Date.now()
  return data
    .map(q => {
      const sentTime = new Date(q.updatedAt).getTime()
      const hoursInSent = (now - sentTime) / (1000 * 60 * 60)
      let level: 'warning' | 'attention' | 'critical' = 'warning'
      if (hoursInSent >= 48) level = 'critical'
      else if (hoursInSent >= 24) level = 'attention'
      return { ...q, hoursInSent, level, source } as SentQuoteAlert
    })
    .filter(q => q.hoursInSent >= 12)
    .sort((a, b) => b.hoursInSent - a.hoursInSent)
}

function AlertCountBadges({ alerts }: { alerts: SentQuoteAlert[] }) {
  const critical = alerts.filter(a => a.level === 'critical').length
  const attention = alerts.filter(a => a.level === 'attention').length
  const warning = alerts.filter(a => a.level === 'warning').length
  return (
    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
      {critical > 0 && (
        <Chip label={`${critical}`} size="small" icon={<PhoneCallback sx={{ fontSize: 13 }} />}
          sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', '& .MuiChip-icon': { color: '#B91C1C' } }} />
      )}
      {attention > 0 && (
        <Chip label={`${attention}`} size="small" icon={<NotificationsActive sx={{ fontSize: 13 }} />}
          sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', '& .MuiChip-icon': { color: '#B45309' } }} />
      )}
      {warning > 0 && (
        <Chip label={`${warning}`} size="small" icon={<WarningAmber sx={{ fontSize: 13 }} />}
          sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', '& .MuiChip-icon': { color: '#1D4ED8' } }} />
      )}
    </Box>
  )
}

function AlertItem({ q, onClick }: { q: SentQuoteAlert; onClick: () => void }) {
  const cfg = LEVEL_CONFIG[q.level]
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        p: 2, borderRadius: '12px',
        bgcolor: cfg.bg, border: `1px solid ${cfg.border}`,
        cursor: 'pointer', transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px -4px rgba(0,0,0,0.1)' },
      }}
    >
      <Box sx={{ color: cfg.color, display: 'flex' }}>{getLevelIcon(q.level)}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A0A0A', fontSize: '0.82rem' }}>
            {q.quoteNumber}
          </Typography>
          {q.quoteType && (
            <Chip label={q.quoteType} size="small"
              sx={{ height: 18, fontWeight: 700, fontSize: '0.6rem',
                bgcolor: q.quoteType === 'FCL' ? '#DBEAFE' : '#D1FAE5',
                color: q.quoteType === 'FCL' ? '#60A5FA' : '#34D399' }} />
          )}
          <Typography variant="caption" sx={{ color: '#78716C' }}>—</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#292524', fontSize: '0.82rem' }}>
            {q.cliente}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 600, fontSize: '0.72rem' }}>
          {cfg.label} · Enviada hace {formatHours(q.hoursInSent)}
        </Typography>
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A0A0A', whiteSpace: 'nowrap' }}>
        $ {q.total?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Typography>
    </Box>
  )
}

function FollowUpCard({ title, icon, alerts, editPath }: {
  title: string
  icon: React.ReactNode
  alerts: SentQuoteAlert[]
  editPath: (id: string) => string
}) {
  const router = useRouter()
  if (alerts.length === 0) return null

  const hasCritical = alerts.some(a => a.level === 'critical')

  return (
    <Card sx={{
      borderRadius: '16px',
      border: hasCritical ? '1px solid #FECACA' : '1px solid rgba(10, 10, 10, 0.06)',
      background: '#FFFFFF',
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
    }}>
      {/* ── Fixed header ── */}
      <Box sx={{ p: 2.5, pb: 2, borderBottom: '1px solid rgba(10, 10, 10, 0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 1, borderRadius: '10px',
              background: hasCritical ? 'linear-gradient(135deg, #DC2626, #EF4444)' : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
              display: 'flex',
            }}>
              {icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0A0A0A', lineHeight: 1.2, fontSize: '0.95rem' }}>
                {title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#78716C' }}>
                {alerts.length} enviada{alerts.length !== 1 ? 's' : ''} sin respuesta
              </Typography>
            </Box>
          </Box>
        </Box>
        <AlertCountBadges alerts={alerts} />
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ maxHeight: 340, overflowY: 'auto', p: 2.5, pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {alerts.map(q => (
            <AlertItem key={q.id} q={q} onClick={() => router.push(editPath(q.id))} />
          ))}
        </Box>
      </Box>
    </Card>
  )
}

function QuoteFollowUpAlerts() {
  const [fastAlerts, setFastAlerts] = useState<SentQuoteAlert[]>([])
  const [quoteAlerts, setQuoteAlerts] = useState<SentQuoteAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/fast-quotes?status=SENT').then(r => r.json()),
      fetch('/api/quotes?status=SENT').then(r => r.json()),
    ])
      .then(([fastData, quoteData]) => {
        setFastAlerts(classifyAlerts(fastData, 'fast-quote'))
        setQuoteAlerts(classifyAlerts(quoteData, 'quote'))
      })
      .catch(() => { setFastAlerts([]); setQuoteAlerts([]) })
      .finally(() => setLoading(false))
  }, [])

  if (loading || (fastAlerts.length === 0 && quoteAlerts.length === 0)) return null

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
      <FollowUpCard
        title="Fast Quotes"
        icon={<BoltOutlined sx={{ color: 'white', fontSize: '1.25rem' }} />}
        alerts={fastAlerts}
        editPath={(id) => `/dashboard/cotizaciones/fast-quotes/${id}/editar`}
      />
      <FollowUpCard
        title="Cotizaciones"
        icon={<Schedule sx={{ color: 'white', fontSize: '1.25rem' }} />}
        alerts={quoteAlerts}
        editPath={(id) => `/dashboard/cotizaciones/quotes/${id}/editar`}
      />
    </Box>
  )
}

// ============== Helper Functions ==============
function getStatusChip(status: string) {
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
      sx={{ borderRadius: '8px', fontWeight: 500 }}
    />
  )
}

// ============== Ads Section (Dynamic) ==============
const DEFAULT_ADS = ['/ads/ad1.jpeg', '/ads/ad2.jpeg', '/ads/ad3.jpeg', '/ads/ad4.jpeg']

function AdsSection({ isAdmin }: { isAdmin: boolean }) {
  const [images, setImages] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editImages, setEditImages] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/settings/adImages')
      .then(r => r.json())
      .then(({ value }) => {
        if (value) {
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed) && parsed.length > 0) { setImages(parsed); return }
          } catch { /* ignore */ }
        }
        setImages(DEFAULT_ADS)
      })
      .catch(() => setImages(DEFAULT_ADS))
  }, [])

  const openEdit = () => { setEditImages([...images]); setEditOpen(true) }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'ads')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      setEditImages(prev => [...prev, url])
    } catch (err) {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removeImage = (idx: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings/adImages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(editImages) }),
      })
      setImages(editImages)
      setEditOpen(false)
    } catch {
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (images.length === 0) return null

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: '16px',
            border: '1px solid rgba(10, 10, 10, 0.06)',
            background: '#FFFFFF',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{
                  fontWeight: 600, color: '#0A0A0A', fontSize: '1.15rem', fontFamily: '"Poppins", sans-serif',
                }}>
                  Promociones y Anuncios
                </Typography>
                {isAdmin && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={openEdit}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    Editar
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                {images.map((image, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box
                      onClick={() => setSelectedIndex(index)}
                      sx={{
                        position: 'relative', borderRadius: '12px', overflow: 'hidden',
                        paddingTop: '125%', cursor: 'pointer', transition: 'all 0.3s',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -8px rgba(0,0,0,0.15)' },
                      }}
                    >
                      <Box component="img" src={image} alt={`Anuncio ${index + 1}`}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Modal */}
      <Dialog open={selectedIndex !== null} onClose={() => setSelectedIndex(null)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { backgroundColor: 'transparent', boxShadow: 'none', maxWidth: '90vw', maxHeight: '90vh' } }}>
        <DialogContent sx={{ position: 'relative', p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton onClick={() => setSelectedIndex(null)}
            sx={{ position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1, '&:hover': { backgroundColor: 'white' } }}>
            <Close />
          </IconButton>
          <IconButton onClick={() => setSelectedIndex(prev => prev !== null ? (prev - 1 + images.length) % images.length : 0)}
            sx={{ position: 'absolute', left: 16, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1 }}>
            <ArrowBackIos sx={{ ml: 0.5 }} />
          </IconButton>
          <IconButton onClick={() => setSelectedIndex(prev => prev !== null ? (prev + 1) % images.length : 0)}
            sx={{ position: 'absolute', right: 16, backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 1 }}>
            <ArrowForwardIos />
          </IconButton>
          {selectedIndex !== null && (
            <Box component="img" src={images[selectedIndex]} alt={`Anuncio ${selectedIndex + 1}`}
              sx={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal (Admin only) */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar Promociones y Anuncios</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Typography variant="body2" sx={{ color: '#6B7280', mb: 2.5 }}>
            Sube, reordena o elimina imágenes. Los cambios se reflejan para todos los usuarios.
          </Typography>
          <Grid container spacing={2}>
            {editImages.map((img, idx) => (
              <Grid item xs={6} sm={4} md={3} key={idx}>
                <Box sx={{
                  position: 'relative', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid #E5E7EB', paddingTop: '125%',
                }}>
                  <Box component="img" src={img} alt={`Ad ${idx + 1}`}
                    sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                  <IconButton size="small" onClick={() => removeImage(idx)}
                    sx={{
                      position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(220,38,38,0.9)', color: 'white',
                      '&:hover': { bgcolor: '#DC2626' }, width: 28, height: 28,
                    }}>
                    <DeleteOutline sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Grid>
            ))}
            {/* Upload button */}
            <Grid item xs={6} sm={4} md={3}>
              <Box
                component="label"
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px', border: '2px dashed #D1D5DB', paddingTop: '125%', position: 'relative',
                  cursor: uploading ? 'wait' : 'pointer', transition: 'all 0.2s',
                  '&:hover': { borderColor: '#FACC15', bgcolor: '#FEF2F2' },
                }}
              >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  {uploading ? (
                    <CircularProgress size={28} sx={{ color: '#FACC15' }} />
                  ) : (
                    <>
                      <AddPhotoAlternate sx={{ fontSize: 32, color: '#9CA3AF', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, display: 'block' }}>
                        Subir imagen
                      </Typography>
                    </>
                  )}
                </Box>
                <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUpload />}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ============== Client Containers Panel ==============
function ContainerCard({ group }: { group: ContainerGroup }) {
  const router = useRouter()
  const cfg = ARRIVAL_CONFIG[group.arrivalLevel]
  const countdown = arrivalCountdown(group)
  const visibleClients = group.clients.slice(0, 3)
  const extraClients = group.clients.length - visibleClients.length

  return (
    <Box
      onClick={() => router.push('/dashboard/admin-carga')}
      sx={{
        p: 2.5,
        borderRadius: '14px',
        border: `1px solid ${group.arrivalLevel === 'imminent' ? cfg.border : 'rgba(10,10,10,0.08)'}`,
        background: '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 24px -10px rgba(10,10,10,0.16)' },
      }}
    >
      {/* Top: container number + arrival chip */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box sx={{ p: 0.75, borderRadius: '9px', bgcolor: 'rgba(250,204,21,0.16)', display: 'flex', flexShrink: 0 }}>
            {group.transportType === 'AIR'
              ? <Flight sx={{ fontSize: '1.15rem', color: '#A16207' }} />
              : <DirectionsBoat sx={{ fontSize: '1.15rem', color: '#A16207' }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: '#0A0A0A', fontSize: '0.92rem', lineHeight: 1.2, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {group.containerNumber}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#78716C' }}>
              {group.shippingLine || (group.transportType === 'AIR' ? 'Aéreo' : 'Marítimo')}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={countdown ? `${cfg.label} · ${countdown}` : cfg.label}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}
        />
      </Box>

      {/* Meta: ETA / status / metrics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {group.eta && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <CalendarToday sx={{ fontSize: '0.78rem', color: '#FACC15' }} />
            <Typography sx={{ fontSize: '0.74rem', color: '#57534E', fontWeight: 600 }}>
              ETA {new Date(group.eta).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </Typography>
          </Box>
        )}
        <Typography sx={{ fontSize: '0.74rem', color: '#57534E', fontWeight: 600 }}>
          {group.clientCount} cliente{group.clientCount !== 1 ? 's' : ''}
        </Typography>
        {group.totalCbm > 0 && (
          <Typography sx={{ fontSize: '0.74rem', color: '#57534E', fontWeight: 600 }}>
            {group.totalCbm.toFixed(1)} CBM
          </Typography>
        )}
      </Box>

      {/* Clients inside */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mt: 0.25 }}>
        {visibleClients.length === 0 && (
          <Typography sx={{ fontSize: '0.76rem', color: '#A8A29E', fontStyle: 'italic' }}>
            Sin clientes asignados
          </Typography>
        )}
        {visibleClients.map(c => (
          <Box key={c.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#FACC15', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.78rem', color: '#292524', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.display}
            </Typography>
          </Box>
        ))}
        {extraClients > 0 && (
          <Typography sx={{ fontSize: '0.74rem', color: '#A16207', fontWeight: 600, pl: '13px' }}>
            +{extraClients} más
          </Typography>
        )}
      </Box>

      {/* Flags */}
      {(group.dgCount > 0 || group.flaggedCount > 0 || group.statusLabel) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto', pt: 0.5 }}>
          {group.statusLabel && (
            <Chip label={group.statusLabel} size="small" variant="outlined"
              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600, borderRadius: '6px' }} />
          )}
          {group.dgCount > 0 && (
            <Chip label="Mercancía peligrosa" size="small"
              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#FEF2F2', color: '#B91C1C' }} />
          )}
          {group.flaggedCount > 0 && (
            <Chip label="Mal identificado" size="small"
              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#FFFBEB', color: '#B45309' }} />
          )}
        </Box>
      )}
    </Box>
  )
}

function ClientContainersPanel() {
  const router = useRouter()
  const [groups, setGroups] = useState<ContainerGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/fcl-shipments?pageSize=1000').then(r => r.ok ? r.json() : { data: [] }),
      fetch('/api/cargo-management?pageSize=1000').then(r => r.ok ? r.json() : { data: [] }),
    ])
      .then(([fclData, cargoData]) => {
        const fcls = (fclData.data || []).map((item: any) => ({
          containerNumber: item.containerNumber,
          empresaId: item.companyId,
          empresaName: item.company?.name,
          empresaCode: item.company?.company_id,
          transportType: item.transportType,
          totalCbm: item.totalCbm ?? null,
          totalWeight: item.totalWeight ?? null,
          misidentified: item.misidentified,
          dangerousGoods: item.dangerousGoods,
        }))
        setGroups(buildContainerGroups(fcls, cargoData.data || []))
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  const imminentCount = groups.filter(g => g.arrivalLevel === 'imminent').length
  const soonCount = groups.filter(g => g.arrivalLevel === 'soon').length
  const visible = groups.slice(0, 6)

  return (
    <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)', background: '#FFFFFF' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, borderRadius: '12px', background: 'linear-gradient(135deg, #FACC15 0%, #FDE047 100%)', display: 'flex' }}>
              <Inventory sx={{ color: 'white', fontSize: '1.4rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0A0A0A', fontSize: '1.15rem', fontFamily: '"Poppins", sans-serif', lineHeight: 1.2 }}>
                Contenedores de Clientes
              </Typography>
              <Typography variant="caption" sx={{ color: '#78716C' }}>
                {groups.length} contenedor{groups.length !== 1 ? 'es' : ''} en seguimiento
              </Typography>
            </Box>
          </Box>
          {groups.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => router.push('/dashboard/admin-carga')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Ver todos
            </Button>
          )}
        </Box>

        {/* Arrival alert */}
        {(imminentCount > 0 || soonCount > 0) && (
          <Alert
            severity={imminentCount > 0 ? 'error' : 'warning'}
            icon={<NotificationsActive />}
            sx={{ borderRadius: 3, mb: 2.5, fontWeight: 600 }}
          >
            {imminentCount > 0 && `${imminentCount} contenedor(es) llegan en 48h. `}
            {soonCount > 0 && `${soonCount} con llegada esta semana.`}
          </Alert>
        )}

        {/* Container cards */}
        {loading ? (
          <LinearProgress />
        ) : visible.length > 0 ? (
          <Grid container spacing={2}>
            {visible.map(g => (
              <Grid item xs={12} sm={6} lg={4} key={group_key(g)}>
                <ContainerCard group={g} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#78716C' }}>
              No hay contenedores registrados
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function group_key(g: ContainerGroup) {
  return g.containerNumber
}

// ============== ADMIN/WORKER DASHBOARD ==============
function AdminWorkerDashboard({ isAdmin }: { isAdmin: boolean }) {
  const [isLoading, setIsLoading] = useState(true)
  // Stats
  const [totalFclShipments, setTotalFclShipments] = useState(0)
  const [totalLclShipments, setTotalLclShipments] = useState(0)
  const [airShipments, setAirShipments] = useState(0)
  const [seaShipments, setSeaShipments] = useState(0)
  const [flaggedShipments, setFlaggedShipments] = useState(0)
  const [dangerousGoods, setDangerousGoods] = useState(0)

  // Data
  const [upcomingContainers, setUpcomingContainers] = useState<CargoManagement[]>([])
  const [lclShipments, setLclShipments] = useState<LclShipment[]>([])
  const [boletinPendientes, setBoletinPendientes] = useState(0)

  useEffect(() => {
    fetchAdminDashboardData()
  }, [])

  const fetchAdminDashboardData = async () => {
    try {
      const [fclRes, lclRes, cargoMgmtRes, boletinRes] = await Promise.all([
        fetch('/api/fcl-shipments?pageSize=1000'),
        fetch('/api/lcl-shipments?pageSize=1000'),
        fetch('/api/cargo-management?pageSize=1000'),
        fetch('/api/boletin').catch(() => null),
      ])

      const fclData = await fclRes.json()
      const lclData = await lclRes.json()
      const cargoMgmtData = await cargoMgmtRes.json()

      const fcl: FclShipment[] = fclData.data || []
      const lcl: LclShipment[] = lclData.data || []
      const cargoMgmt: CargoManagement[] = cargoMgmtData.data || []

      // Calculate stats — use meta.total for accurate counts beyond pageSize
      setTotalFclShipments(fclData.meta?.total ?? fcl.length)
      setTotalLclShipments(lclData.meta?.total ?? lcl.length)
      setAirShipments(fcl.filter(s => s.transportType === 'AIR').length)
      setSeaShipments(fcl.filter(s => s.transportType === 'MAR').length)
      setFlaggedShipments(fcl.filter(s => s.misidentified).length)
      setDangerousGoods(fcl.filter(s => s.dangerousGoods).length)

      // Get upcoming containers (next 5 by ETA)
      const upcoming = cargoMgmt
        .filter(c => c.eta && new Date(c.eta) >= new Date())
        .sort((a, b) => {
          if (!a.eta || !b.eta) return 0
          return new Date(a.eta).getTime() - new Date(b.eta).getTime()
        })
        .slice(0, 5)
      setUpcomingContainers(upcoming)

      // Get recent LCL shipments (next 5 by ETA)
      const upcomingLcl = lcl
        .filter(l => new Date(l.eta) >= new Date())
        .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime())
        .slice(0, 5)
      setLclShipments(upcomingLcl)

      // Boletin pending count
      if (boletinRes?.ok) {
        const boletinData = await boletinRes.json()
        setBoletinPendientes(boletinData.pendingCount || 0)
      }
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box className="space-y-6">
        <Typography variant="h4" className="font-bold text-ink">Dashboard Administrativo</Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid rgba(10, 10, 10, 0.06)',
        p: { xs: 2.5, sm: 3, md: 4 },
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 700,
            color: '#0A0A0A',
            mb: 0.5,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontFamily: '"Poppins", sans-serif',
            letterSpacing: '-0.025em'
          }}>
            Dashboard Administrativo
          </Typography>
          <Typography variant="body1" sx={{ color: '#78716C', fontSize: '0.9rem' }}>
            Vista general de operaciones y logística
          </Typography>
        </Box>
        <LiveClocks />
      </Box>

      {/* Address Change Banner */}
      <AddressChangeBanner />

      {/* Container Date Banner */}
      <ContainerDateBanner isAdmin={isAdmin} />

      {/* Boletin Pending Alert */}
      {boletinPendientes > 0 && (
        <Alert severity="warning" icon={<NotificationsActive />} sx={{ borderRadius: 3, border: '1px solid #F59E0B' }}
          action={<Button color="inherit" size="small" href="/dashboard/freight/boletin" sx={{ fontWeight: 700 }}>Ir al Boletín</Button>}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {boletinPendientes} contenedor(es) LCL sin notificación semanal. Envía el boletín a tus clientes.
          </Typography>
        </Alert>
      )}

      {/* Quote Follow-Up Alerts */}
      {isAdmin && <QuoteFollowUpAlerts />}

      {/* Client Containers — lo principal: contenedores agrupados por cliente */}
      <ClientContainersPanel />

      {/* Stats Grid - Row 1: Shipment Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Envíos FCL"
            value={totalFclShipments}
            icon={<Inventory sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #FACC15 0%, #FDE047 100%)"
            subtitle="Full Container Load"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Envíos LCL"
            value={totalLclShipments}
            icon={<LocalShipping sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
            subtitle="Less than Container Load"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Transporte Aéreo"
            value={airShipments}
            icon={<Flight sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Transporte Marítimo"
            value={seaShipments}
            icon={<DirectionsBoat sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)"
          />
        </Grid>
      </Grid>

      {/* Stats Grid - Row 2: Alerts & Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Mal Identificados"
            value={flaggedShipments}
            icon={<Warning sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
            subtitle="Requiere atención"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Mercancía Peligrosa"
            value={dangerousGoods}
            icon={<Warning sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #EF4444 0%, #F87171 100%)"
            subtitle="Dangerous Goods"
          />
        </Grid>
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={3}>
        {/* Upcoming Containers */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            height: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(10, 10, 10, 0.06)',
            background: '#FFFFFF',
          }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Inventory sx={{ color: '#FACC15', mr: 1.5, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  color: '#0A0A0A',
                  fontSize: '1.1rem',
                  fontFamily: '"Poppins", sans-serif'
                }}>
                  Contenedores Próximos
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingContainers.length > 0 ? upcomingContainers.map((container) => (
                  <Box
                    key={container.id}
                    sx={{
                      p: 2.5,
                      border: '1px solid rgba(10, 10, 10, 0.06)',
                      borderRadius: '12px',
                      background: 'rgba(10, 10, 10, 0.03)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(10, 10, 10, 0.06)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0A0A0A', mb: 0.5 }}>
                          {container.referenceNo || container.containerNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <LocationOn sx={{ fontSize: '0.875rem', color: '#78716C' }} />
                          <Typography variant="caption" sx={{ color: '#78716C' }}>
                            {container.location}
                          </Typography>
                        </Box>
                        {container.shippingLine && (
                          <Typography variant="caption" sx={{ color: '#78716C', display: 'block' }}>
                            {container.shippingLine}
                          </Typography>
                        )}
                      </Box>
                      <Box>{getStatusChip(container.status)}</Box>
                    </Box>
                    {container.eta && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <CalendarToday sx={{ fontSize: '0.75rem', color: '#FACC15' }} />
                        <Typography variant="caption" sx={{ color: '#FACC15', fontWeight: 600 }}>
                          ETA: {new Date(container.eta).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#78716C' }}>
                      No hay contenedores próximos
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming LCL Shipments */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            height: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(10, 10, 10, 0.06)',
            background: '#FFFFFF',
          }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LocalShipping sx={{ color: '#3B82F6', mr: 1.5, fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{
                  fontWeight: 600,
                  color: '#0A0A0A',
                  fontSize: '1.1rem',
                  fontFamily: '"Poppins", sans-serif'
                }}>
                  Próximos Envíos LCL
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {lclShipments.length > 0 ? lclShipments.map((shipment) => (
                  <Box
                    key={shipment.id}
                    sx={{
                      p: 2.5,
                      border: '1px solid rgba(10, 10, 10, 0.06)',
                      borderRadius: '12px',
                      background: 'rgba(10, 10, 10, 0.03)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(10, 10, 10, 0.06)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0A0A0A' }}>
                        BL: {shipment.blNumber}
                      </Typography>
                      <Typography variant="caption" sx={{
                        color: '#1D4ED8',
                        fontWeight: 600,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '6px',
                      }}>
                        {shipment.totalCbm.toFixed(2)} m³
                      </Typography>
                    </Box>
                    {shipment.company && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Business sx={{ fontSize: '0.875rem', color: '#78716C' }} />
                        <Typography variant="caption" sx={{ color: '#78716C' }}>
                          {shipment.company.company_id} - {shipment.company.name}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: '0.75rem', color: '#FACC15' }} />
                      <Typography variant="caption" sx={{ color: '#FACC15', fontWeight: 600 }}>
                        ETA: {new Date(shipment.eta).toLocaleDateString('es-ES')}
                      </Typography>
                    </Box>
                  </Box>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: '#78716C' }}>
                      No hay envíos LCL próximos
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ads Section */}
      <AdsSection isAdmin={isAdmin} />
    </Box>
  )
}

// ============== BUSINESS USER DASHBOARD ==============
function BusinessUserDashboard() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  // Stats
  const [myFclShipments, setMyFclShipments] = useState(0)
  const [myLclShipments, setMyLclShipments] = useState(0)
  const [myAirShipments, setMyAirShipments] = useState(0)
  const [mySeaShipments, setMySeaShipments] = useState(0)
  const [totalCbm, setTotalCbm] = useState(0)
  const [totalCargoValue, setTotalCargoValue] = useState(0)

  useEffect(() => {
    fetchBusinessDashboardData()
  }, [])

  const fetchBusinessDashboardData = async () => {
    try {
      const [fclRes, lclRes] = await Promise.all([
        fetch('/api/fcl-shipments?pageSize=1000'),
        fetch('/api/lcl-shipments?pageSize=1000'),
      ])

      const fclData = await fclRes.json()
      const lclData = await lclRes.json()

      const fcl: FclShipment[] = fclData.data || []
      const lcl: LclShipment[] = lclData.data || []

      // Calculate stats — use meta.total for accurate counts beyond pageSize
      setMyFclShipments(fclData.meta?.total ?? fcl.length)
      setMyLclShipments(lclData.meta?.total ?? lcl.length)
      setMyAirShipments(fcl.filter(s => s.transportType === 'AIR').length)
      setMySeaShipments(fcl.filter(s => s.transportType === 'MAR').length)

      // Calculate LCL totals
      const cbmTotal = lcl.reduce((sum, l) => sum + l.totalCbm, 0)
      const valueTotal = lcl.reduce((sum, l) => sum + l.cargoAmount, 0)
      setTotalCbm(cbmTotal)
      setTotalCargoValue(valueTotal)
    } catch (error) {
      console.error('Error fetching business dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Box className="space-y-6">
        <Typography variant="h4" className="font-bold text-ink">Mi Dashboard</Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #171717 100%)',
        borderRadius: '16px',
        p: { xs: 2.5, sm: 3, md: 4 },
        boxShadow: '0 12px 30px -8px rgba(10, 10, 10, 0.22)'
      }}>
        <Typography variant="h4" sx={{
          fontWeight: 700,
          color: 'white',
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
          fontFamily: '"Poppins", sans-serif',
        }}>
          Mi Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem' }}>
          Resumen de tus envíos y operaciones
        </Typography>
        <Box sx={{ mt: 2 }}>
          <LiveClocks />
        </Box>
      </Box>

      {/* Address Change Banner */}
      <AddressChangeBanner mailbox={session?.user?.mailbox} name={session?.user?.name} />

      {/* Container Date Banner */}
      <ContainerDateBanner isAdmin={false} />

      {/* Stats Grid */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Mis Envíos FCL"
            value={myFclShipments}
            icon={<Inventory sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #FACC15 0%, #FDE047 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Mis Envíos LCL"
            value={myLclShipments}
            icon={<LocalShipping sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Aéreos"
            value={myAirShipments}
            icon={<Flight sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Marítimos"
            value={mySeaShipments}
            icon={<DirectionsBoat sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)"
          />
        </Grid>
      </Grid>

      {/* LCL Summary Stats */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Volumen Total (LCL)"
            value={parseFloat(totalCbm.toFixed(2))}
            icon={<Inventory sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #10B981 0%, #34D399 100%)"
            subtitle="Metros cúbicos"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Valor de Carga (LCL)"
            value={parseFloat(totalCargoValue.toFixed(0))}
            icon={<CheckCircle sx={{ color: 'white', fontSize: '1.75rem' }} />}
            color="linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)"
            subtitle="USD"
          />
        </Grid>
      </Grid>

      {/* Ads Section */}
      <AdsSection isAdmin={false} />
    </Box>
  )
}

// ============== MAIN DASHBOARD COMPONENT ==============
export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role

  if (userRole === 'ADMIN' || userRole === 'WORKER') {
    return <AdminWorkerDashboard isAdmin={userRole === 'ADMIN'} />
  }

  return <BusinessUserDashboard />
}
