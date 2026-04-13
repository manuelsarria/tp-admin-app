'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tooltip, Switch, FormControlLabel, Alert,
} from '@mui/material'
import {
  EventAvailable, CalendarToday, Search, Refresh,
  CheckCircle, Cancel, HourglassEmpty, PersonOff,
  Warehouse, Settings, Close, Visibility,
} from '@mui/icons-material'

// ── Types ──────────────────────────────────────────────────────────────────

interface WarehouseData {
  id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  isActive: boolean
  scheduleConfig: Record<string, { open: string; close: string; slotMinutes: number } | null> | null
}

interface AppointmentData {
  id: string
  apptNumber: string
  warehouseId: string
  warehouse: { name: string; code: string }
  serviceType: string
  appointmentDate: string
  appointmentTime: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientRuc: string | null
  companyName: string | null
  description: string | null
  pieces: number | null
  weight: number | null
  paymentProofUrl: string | null
  status: string
  notes: string | null
  cancelReason: string | null
  createdAt: string
}

interface Stats {
  total: number
  confirmed: number
  cancelled: number
  completed: number
  noShow: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CONFIRMED: { label: 'Confirmada', color: '#10B981', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  COMPLETED: { label: 'Completada', color: '#3B82F6', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  CANCELLED: { label: 'Cancelada', color: '#EF4444', icon: <Cancel sx={{ fontSize: 14 }} /> },
  NO_SHOW: { label: 'No asistió', color: '#F59E0B', icon: <PersonOff sx={{ fontSize: 14 }} /> },
}

const SERVICE_LABELS: Record<string, string> = {
  ENTREGA_CARGA: 'Entrega',
  RETIRO_CARGA: 'Retiro',
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card sx={{
      borderRadius: '14px', border: '1px solid rgba(148,163,184,0.08)',
      background: '#111827',
      '&:hover': { borderColor: 'rgba(148,163,184,0.15)' },
    }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500, mb: 0.5 }}>{title}</Typography>
            <Typography sx={{ color: '#F1F5F9', fontSize: '1.5rem', fontWeight: 700 }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1.25, borderRadius: '10px', background: color, display: 'flex' }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Appointment Detail Dialog ──────────────────────────────────────────────

function AppointmentDetail({ appointment, open, onClose, onUpdate }: {
  appointment: AppointmentData | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, data: any) => Promise<void>
}) {
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status)
      setNotes(appointment.notes || '')
      setCancelReason(appointment.cancelReason || '')
    }
  }, [appointment])

  if (!appointment) return null

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(appointment.id, { status, notes, cancelReason })
    setSaving(false)
    onClose()
  }

  const date = new Date(appointment.appointmentDate).toLocaleDateString('es-PA', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Panama',
  })

  const sc = STATUS_CONFIG[appointment.status]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#F1F5F9' }}>Cita {appointment.apptNumber}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{appointment.warehouse.name}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#64748B' }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Fecha</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>{date}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Hora</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>{appointment.appointmentTime}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Servicio</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
              {SERVICE_LABELS[appointment.serviceType] || appointment.serviceType}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase' }}>Estado</Typography>
            <Chip label={sc?.label} size="small" sx={{ bgcolor: `${sc?.color}20`, color: sc?.color, fontWeight: 700, fontSize: '0.7rem', mt: 0.3 }} />
          </Box>
        </Box>

        <Box sx={{ borderTop: '1px solid rgba(148,163,184,0.08)', pt: 2, mb: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9', mb: 1 }}>Cliente</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#CBD5E1' }}>{appointment.clientName}</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>{appointment.clientEmail} · {appointment.clientPhone}</Typography>
          {appointment.companyName && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>Empresa: {appointment.companyName}</Typography>}
          {appointment.clientRuc && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>RUC: {appointment.clientRuc}</Typography>}
        </Box>

        {appointment.description && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9', mb: 0.5 }}>Carga</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>{appointment.description}</Typography>
            {appointment.pieces && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>Piezas: {appointment.pieces}</Typography>}
            {appointment.weight && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>Peso: {appointment.weight} kg</Typography>}
          </Box>
        )}

        {appointment.paymentProofUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9', mb: 0.5 }}>Comprobante de Pago</Typography>
            <Button size="small" variant="outlined" href={appointment.paymentProofUrl} target="_blank"
              sx={{ fontSize: '0.75rem', textTransform: 'none', borderColor: 'rgba(148,163,184,0.2)', color: '#60A5FA' }}>
              Ver comprobante
            </Button>
          </Box>
        )}

        <Box sx={{ borderTop: '1px solid rgba(148,163,184,0.08)', pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select value={status} onChange={e => setStatus(e.target.value)} label="Estado">
              <MenuItem value="CONFIRMED">Confirmada</MenuItem>
              <MenuItem value="COMPLETED">Completada</MenuItem>
              <MenuItem value="CANCELLED">Cancelada</MenuItem>
              <MenuItem value="NO_SHOW">No asistió</MenuItem>
            </Select>
          </FormControl>
          {status === 'CANCELLED' && (
            <TextField size="small" label="Razón de cancelación" value={cancelReason}
              onChange={e => setCancelReason(e.target.value)} fullWidth multiline rows={2} />
          )}
          <TextField size="small" label="Notas internas" value={notes}
            onChange={e => setNotes(e.target.value)} fullWidth multiline rows={2} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#94A3B8' }}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Warehouse Schedule Modal ───────────────────────────────────────────────

function WarehouseScheduleModal({ warehouses, open, onClose, onSave }: {
  warehouses: WarehouseData[]
  open: boolean
  onClose: () => void
  onSave: (id: string, config: any) => Promise<void>
}) {
  const [selectedId, setSelectedId] = useState('')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (warehouses.length > 0 && !selectedId) setSelectedId(warehouses[0].id)
  }, [warehouses, selectedId])

  useEffect(() => {
    const wh = warehouses.find(w => w.id === selectedId)
    if (wh?.scheduleConfig) {
      setConfig(wh.scheduleConfig as Record<string, any>)
    } else {
      setConfig({})
    }
  }, [selectedId, warehouses])

  const handleDayToggle = (day: string) => {
    setConfig(prev => ({
      ...prev,
      [day]: prev[day] ? null : { open: '08:00', close: '17:00', slotMinutes: 30 },
    }))
  }

  const handleDayChange = (day: string, field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(selectedId, config)
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#F1F5F9' }}>Configurar Horarios</Typography>
        <IconButton onClick={onClose} sx={{ color: '#64748B' }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel>Almacén</InputLabel>
          <Select value={selectedId} onChange={e => setSelectedId(e.target.value)} label="Almacén">
            {warehouses.map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {DAYS.map(day => {
          const dayConf = config[day]
          const isActive = !!dayConf
          return (
            <Box key={day} sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
              p: 1.5, borderRadius: '10px', bgcolor: 'rgba(148,163,184,0.04)',
              border: '1px solid rgba(148,163,184,0.06)',
            }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={() => handleDayToggle(day)} size="small" />}
                label={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#F1F5F9', minWidth: 70 }}>{DAY_LABELS[day]}</Typography>}
                sx={{ mr: 0 }}
              />
              {isActive && (
                <>
                  <TextField size="small" type="time" value={dayConf.open}
                    onChange={e => handleDayChange(day, 'open', e.target.value)}
                    sx={{ width: 110 }} inputProps={{ style: { fontSize: '0.8rem' } }} />
                  <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>a</Typography>
                  <TextField size="small" type="time" value={dayConf.close}
                    onChange={e => handleDayChange(day, 'close', e.target.value)}
                    sx={{ width: 110 }} inputProps={{ style: { fontSize: '0.8rem' } }} />
                  <Select size="small" value={dayConf.slotMinutes}
                    onChange={e => handleDayChange(day, 'slotMinutes', Number(e.target.value))}
                    sx={{ width: 80, fontSize: '0.75rem' }}>
                    <MenuItem value={15}>15m</MenuItem>
                    <MenuItem value={30}>30m</MenuItem>
                    <MenuItem value={60}>60m</MenuItem>
                  </Select>
                </>
              )}
              {!isActive && <Typography sx={{ color: '#64748B', fontSize: '0.75rem', fontStyle: 'italic' }}>Cerrado</Typography>}
            </Box>
          )
        })}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#94A3B8' }}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          {saving ? 'Guardando...' : 'Guardar Horarios'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AlmacenesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [appointments, setAppointments] = useState<AppointmentData[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, cancelled: 0, completed: 0, noShow: 0 })
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  // Dialogs
  const [selectedAppt, setSelectedAppt] = useState<AppointmentData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (warehouseFilter) params.set('warehouseId', warehouseFilter)
      if (dateFilter) params.set('date', dateFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const [whRes, apptRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch(`/api/appointments?${params}`),
      ])
      const whData = await whRes.json()
      const apptData = await apptRes.json()

      if (Array.isArray(whData)) setWarehouses(whData)
      if (apptData.appointments) {
        setAppointments(apptData.appointments)
        setTotal(apptData.total)
        setStats(apptData.stats)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [warehouseFilter, dateFilter, statusFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateAppointment = async (id: string, data: any) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchData()
  }

  const handleSaveSchedule = async (warehouseId: string, config: any) => {
    await fetch(`/api/warehouses/${warehouseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleConfig: config }),
    })
    fetchData()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PA', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Panama',
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventAvailable sx={{ color: '#FACC15', fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#F1F5F9', fontSize: '1.2rem' }}>Almacenes — Gestión de Citas</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                Administra citas de entrega y retiro de carga
              </Typography>
            </Box>
          </Box>
          <Button startIcon={<Settings />} variant="outlined" onClick={() => setScheduleOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: 'rgba(148,163,184,0.2)', color: '#CBD5E1', borderRadius: 2 }}>
            Configurar Horarios
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard title="Total Hoy" value={stats.total} color="linear-gradient(135deg,#6366F1,#818CF8)"
            icon={<CalendarToday sx={{ color: 'white', fontSize: '1.2rem' }} />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Confirmadas" value={stats.confirmed} color="linear-gradient(135deg,#10B981,#34D399)"
            icon={<CheckCircle sx={{ color: 'white', fontSize: '1.2rem' }} />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Completadas" value={stats.completed} color="linear-gradient(135deg,#3B82F6,#60A5FA)"
            icon={<CheckCircle sx={{ color: 'white', fontSize: '1.2rem' }} />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard title="Canceladas" value={stats.cancelled + stats.noShow} color="linear-gradient(135deg,#EF4444,#F87171)"
            icon={<Cancel sx={{ color: 'white', fontSize: '1.2rem' }} />} />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: '14px', border: '1px solid rgba(148,163,184,0.08)', bgcolor: '#111827' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Buscar..." value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <Search sx={{ color: '#64748B', mr: 0.5, fontSize: 18 }} /> }}
              sx={{ flex: 1, minWidth: 180 }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Almacén</InputLabel>
              <Select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} label="Almacén">
                <MenuItem value="">Todos</MenuItem>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              InputLabelProps={{ shrink: true }} label="Fecha" sx={{ width: 160 }} />
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="Estado">
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="CONFIRMED">Confirmada</MenuItem>
                <MenuItem value="COMPLETED">Completada</MenuItem>
                <MenuItem value="CANCELLED">Cancelada</MenuItem>
                <MenuItem value="NO_SHOW">No asistió</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={fetchData} sx={{ color: '#64748B' }}><Refresh /></IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '14px', border: '1px solid rgba(148,163,184,0.08)', bgcolor: '#111827' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}># Cita</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Almacén</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Hora</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Servicio</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="center">Ver</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} sx={{ color: '#FACC15' }} />
                  </TableCell>
                </TableRow>
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#64748B' }}>
                    No hay citas para mostrar
                  </TableCell>
                </TableRow>
              ) : appointments.map(appt => {
                const sc = STATUS_CONFIG[appt.status]
                return (
                  <TableRow key={appt.id} sx={{ '&:hover': { bgcolor: 'rgba(148,163,184,0.06)' }, cursor: 'pointer' }}
                    onClick={() => { setSelectedAppt(appt); setDetailOpen(true) }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', color: '#FACC15' }}>
                      {appt.apptNumber}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{appt.warehouse.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(appt.appointmentDate)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{appt.appointmentTime}</TableCell>
                    <TableCell>
                      <Chip label={SERVICE_LABELS[appt.serviceType] || appt.serviceType} size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.65rem', height: 22,
                          bgcolor: appt.serviceType === 'ENTREGA_CARGA' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                          color: appt.serviceType === 'ENTREGA_CARGA' ? '#60A5FA' : '#FBBF24',
                        }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{appt.clientName}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>{appt.clientPhone}</TableCell>
                    <TableCell>
                      <Chip label={sc?.label} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22, bgcolor: `${sc?.color}18`, color: sc?.color }} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" sx={{ color: '#64748B' }}>
                        <Visibility sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 50 && (
          <Box sx={{ p: 1.5, textAlign: 'center', borderTop: '1px solid rgba(148,163,184,0.06)' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
              Mostrando {appointments.length} de {total} citas
            </Typography>
          </Box>
        )}
      </Card>

      {/* Dialogs */}
      <AppointmentDetail appointment={selectedAppt} open={detailOpen}
        onClose={() => setDetailOpen(false)} onUpdate={handleUpdateAppointment} />
      <WarehouseScheduleModal warehouses={warehouses} open={scheduleOpen}
        onClose={() => setScheduleOpen(false)} onSave={handleSaveSchedule} />
    </Box>
  )
}
