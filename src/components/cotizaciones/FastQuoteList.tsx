'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Chip, IconButton, Button,
  Menu, MenuItem, Tooltip, CircularProgress, TextField, InputAdornment,
  Select, FormControl, InputLabel, Table, TableHead, TableRow,
  TableCell, TableBody, Paper,
} from '@mui/material'
import {
  Add, MoreVert, PictureAsPdf, Edit, Delete, Search,
  CheckCircle, Cancel, SendOutlined, HourglassEmpty, FlashOn,
  AccessTime, WarningAmber,
} from '@mui/icons-material'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  DRAFT:     { label: 'Borrador',  color: 'default' },
  SENT:      { label: 'Enviada',   color: 'info' },
  APPROVED:  { label: 'Aprobada',  color: 'success' },
  REJECTED:  { label: 'Rechazada', color: 'error' },
  CANCELLED: { label: 'Cancelada', color: 'default' },
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:     ['SENT', 'CANCELLED'],
  SENT:      ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED:  ['CANCELLED'],
  REJECTED:  ['DRAFT'],
  CANCELLED: ['DRAFT'],
}

const fmt = (n: number) =>
  `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getExpiryDate(createdAt: string, validezTarifa: number) {
  const d = new Date(createdAt)
  d.setDate(d.getDate() + (validezTarifa || 10))
  return d
}

function getExpiryInfo(createdAt: string, validezTarifa: number) {
  const expiry = getExpiryDate(createdAt, validezTarifa)
  const now = new Date()
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `Vencida (${Math.abs(diffDays)}d)`, color: '#DC2626', bg: '#FEF2F2' }
  if (diffDays <= 2) return { label: `${diffDays}d restantes`, color: '#F59E0B', bg: '#FFFBEB' }
  return { label: `${diffDays}d restantes`, color: '#16A34A', bg: '#F0FDF4' }
}

export function FastQuoteList() {
  const router = useRouter()
  const [quotes, setQuotes]             = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [menuAnchor, setMenuAnchor]     = useState<null | HTMLElement>(null)
  const [activeQuote, setActiveQuote]   = useState<any>(null)

  const loadQuotes = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/fast-quotes')
      const data = await res.json()
      setQuotes(Array.isArray(data) ? data : [])
    } catch {
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuotes() }, [])

  const openMenu  = (e: React.MouseEvent<HTMLElement>, q: any) => { setMenuAnchor(e.currentTarget); setActiveQuote(q) }
  const closeMenu = () => { setMenuAnchor(null); setActiveQuote(null) }

  const changeStatus = async (newStatus: string) => {
    if (!activeQuote) return
    await fetch(`/api/fast-quotes/${activeQuote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    closeMenu()
    loadQuotes()
  }

  const deleteQuote = async () => {
    if (!activeQuote) return
    if (!confirm(`¿Cancelar la fast quote ${activeQuote.quoteNumber}? Quedará registrada como cancelada.`)) return
    await fetch(`/api/fast-quotes/${activeQuote.id}`, { method: 'DELETE' })
    closeMenu()
    loadQuotes()
  }

  const downloadPDF = (q: any) => { window.open(`/api/fast-quotes/${q.id}/pdf`, '_blank'); closeMenu() }

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filtered = quotes.filter(q => {
    const matchSearch =
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.cliente.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL'
      ? q.status !== 'CANCELLED'
      : q.status === filterStatus
    return matchSearch && matchStatus
  })

  // ── Stats ────────────────────────────────────────────────────────────────────
  const counts = {
    DRAFT:    quotes.filter(q => q.status === 'DRAFT').length,
    SENT:     quotes.filter(q => q.status === 'SENT').length,
    APPROVED: quotes.filter(q => q.status === 'APPROVED').length,
    REJECTED: quotes.filter(q => q.status === 'REJECTED').length,
  }

  return (
    <Box>
      {/* ── Stats ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Borradores', count: counts.DRAFT,    icon: <HourglassEmpty sx={{ fontSize: 20 }} />, color: '#6B7280', bg: '#F9FAFB' },
          { label: 'Enviadas',   count: counts.SENT,     icon: <SendOutlined   sx={{ fontSize: 20 }} />, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Aprobadas',  count: counts.APPROVED, icon: <CheckCircle    sx={{ fontSize: 20 }} />, color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Rechazadas', count: counts.REJECTED, icon: <Cancel         sx={{ fontSize: 20 }} />, color: '#DC2626', bg: '#FEF2F2' },
        ].map(stat => (
          <Card key={stat.label} sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: stat.bg }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: stat.color }}>
                {stat.icon}
                <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color }}>{stat.count}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filters + New button ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Buscar por # quote o cliente…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 2, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estatus</InputLabel>
          <Select value={filterStatus} label="Estatus" onChange={e => setFilterStatus(e.target.value)}>
            <MenuItem value="ALL">Todos</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/dashboard/cotizaciones/nueva-fast-quote')}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', ml: 'auto' }}
        >
          Nueva Fast Quote
        </Button>
      </Box>

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <FlashOn sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>No hay fast quotes</Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.5 }}>Crea una nueva fast quote para comenzar</Typography>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['# Quote', 'Cliente', 'Asignado a', 'Tipo', 'Total', 'Creada', 'Vencimiento', 'Estatus', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(q => {
                const sc = STATUS_CONFIG[q.status] ?? { label: q.status, color: 'default' }
                const expiry = getExpiryDate(q.createdAt, q.validezTarifa)
                const expiryInfo = getExpiryInfo(q.createdAt, q.validezTarifa)
                const isActiveQuote = q.status === 'SENT' || q.status === 'DRAFT'
                return (
                  <TableRow key={q.id} sx={{ '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.06)' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: '#FACC15' }}>
                      {q.quoteNumber}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{q.cliente}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {q.assignedTo ? q.assignedTo.name : <Typography variant="caption" sx={{ color: '#9CA3AF' }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.tipoEnvio}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: '0.7rem',
                          bgcolor: q.tipoEnvio === 'AEREO' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)',
                          color:   q.tipoEnvio === 'AEREO' ? '#FBBF24'  : '#60A5FA',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{fmt(q.total)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 14, color: '#9CA3AF' }} />
                        {formatDate(q.createdAt)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {isActiveQuote ? (
                        <Chip
                          label={`${formatDate(expiry.toISOString())} · ${expiryInfo.label}`}
                          size="small"
                          icon={expiryInfo.color === '#DC2626' ? <WarningAmber sx={{ fontSize: 14 }} /> : undefined}
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem',
                            bgcolor: expiryInfo.bg, color: expiryInfo.color,
                            '& .MuiChip-icon': { color: expiryInfo.color },
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={sc.label} color={sc.color} size="small" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Tooltip title="Acciones">
                        <IconButton size="small" onClick={e => openMenu(e, q)}>
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ── Context menu ── */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
        PaperProps={{ sx: { borderRadius: 2, border: '1px solid #F1F5F9', boxShadow: '0 10px 25px -5px rgba(0,0,0,.1)', minWidth: 200 } }}>

        <MenuItem onClick={() => { router.push(`/dashboard/cotizaciones/fast-quotes/${activeQuote?.id}/editar`); closeMenu() }}
          sx={{ fontSize: '0.875rem', py: 1.25 }}>
          <Edit sx={{ mr: 1.5, fontSize: 18, color: '#6B7280' }} /> Editar
        </MenuItem>

        <MenuItem onClick={() => downloadPDF(activeQuote)} sx={{ fontSize: '0.875rem', py: 1.25 }}>
          <PictureAsPdf sx={{ mr: 1.5, fontSize: 18, color: '#FACC15' }} /> Descargar PDF
        </MenuItem>

        {activeQuote && STATUS_TRANSITIONS[activeQuote.status]?.length > 0 && (
          <Box>
            <Box sx={{ px: 2, py: 0.5 }}><Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>CAMBIAR ESTATUS</Typography></Box>
            {STATUS_TRANSITIONS[activeQuote.status]?.map(s => (
              <MenuItem key={s} onClick={() => changeStatus(s)} sx={{ fontSize: '0.875rem', py: 1 }}>
                <Chip label={STATUS_CONFIG[s]?.label} color={STATUS_CONFIG[s]?.color} size="small" sx={{ mr: 1, fontWeight: 600, fontSize: '0.72rem' }} />
                Marcar como {STATUS_CONFIG[s]?.label}
              </MenuItem>
            ))}
          </Box>
        )}

        <Box sx={{ borderTop: '1px solid #F1F5F9', mt: 0.5 }}>
          <MenuItem onClick={deleteQuote} sx={{ fontSize: '0.875rem', py: 1.25, color: '#DC2626' }}>
            <Delete sx={{ mr: 1.5, fontSize: 18 }} /> Eliminar
          </MenuItem>
        </Box>
      </Menu>
    </Box>
  )
}
