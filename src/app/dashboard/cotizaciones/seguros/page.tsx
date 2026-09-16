'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Box, Card, CardContent, Typography, Button, IconButton, Chip, Grid, Alert,
  Snackbar, LinearProgress, TextField, InputAdornment, Tooltip, Menu, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions,
  Badge,
} from '@mui/material'
import {
  Policy, Add, Search, PictureAsPdf, Edit, MoreVert, Delete, FilterAltOff, StickyNote2,
} from '@mui/icons-material'
import { fmtUsd } from '@/lib/seguro'
import { NotasSeguimientoDialog } from '@/components/cotizaciones/NotasSeguimiento'

const C = {
  card: '#FFFFFF', cardSoft: '#FAFAF9', border: '1px solid #E5E7EB',
  borderColor: '#E5E7EB', text: '#0A0A0A', textMid: '#6B7280',
  textSoft: '#9CA3AF',
  // El amarillo de TP no se lee como texto sobre blanco: se usa para fondos,
  // iconos y bordes, y el texto que lo acompaña va en negro.
  accent: '#FACC15', accentHover: '#EAB308',
  green: '#059669', red: '#DC2626', blue: '#3B82F6',
}

const STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Borrador',  color: C.textMid },
  SENT:      { label: 'Enviada',   color: C.blue },
  APPROVED:  { label: 'Aprobada',  color: C.green },
  REJECTED:  { label: 'Rechazada', color: C.red },
  CANCELLED: { label: 'Anulada',   color: C.textSoft },
}
const FLUJO = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CANCELLED']

interface Quote {
  id: string
  quoteNumber: string
  status: string
  cliente: string
  referencia: string | null
  descripcionCarga: string | null
  rateLabel: string
  rate: number
  totalAsegurado: number
  prima: number
  valorCobrar: number
  createdAt: string
}

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', color: C.text, bgcolor: C.cardSoft },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: C.borderColor },
  '& .MuiInputLabel-root': { color: C.textMid },
}

export default function SegurosPage() {
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [menu, setMenu] = useState<{ el: HTMLElement; q: Quote } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Quote | null>(null)

  // Seguimiento: cuántas notas tiene cada cotización y cuál está abierta
  const [notesCounts, setNotesCounts] = useState<Record<string, number>>({})
  const [notesQuote, setNotesQuote] = useState<Quote | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/seguro-quotes', { cache: 'no-store' })
      if (r.ok) setQuotes(await r.json())
      else setError((await r.json().catch(() => ({}))).error || 'Error al cargar')
    } catch { setError('Error de conexión') } finally { setLoading(false) }
  }, [])

  const loadNotesCounts = useCallback(async () => {
    try {
      const r = await fetch('/api/quote-notes/counts?entity=INSURANCE_QUOTE', { cache: 'no-store' })
      setNotesCounts(r.ok ? await r.json() : {})
    } catch { setNotesCounts({}) }
  }, [])

  useEffect(() => {
    if (authStatus === 'authenticated') { load(); loadNotesCounts() }
    else if (authStatus === 'unauthenticated') setLoading(false)
  }, [authStatus, load, loadNotesCounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return quotes.filter(x => {
      const mq = !q || x.quoteNumber.toLowerCase().includes(q) ||
        x.cliente.toLowerCase().includes(q) || (x.referencia ?? '').toLowerCase().includes(q)
      const ms = statusFilter === 'all' || x.status === statusFilter
      return mq && ms
    })
  }, [quotes, search, statusFilter])

  const totales = useMemo(() => ({
    total: quotes.length,
    abiertas: quotes.filter(q => q.status === 'DRAFT' || q.status === 'SENT').length,
    aprobadas: quotes.filter(q => q.status === 'APPROVED').length,
    primas: quotes.filter(q => q.status === 'APPROVED').reduce((a, q) => a + q.valorCobrar, 0),
  }), [quotes])

  const cambiarEstado = async (q: Quote, status: string) => {
    setMenu(null)
    try {
      const r = await fetch(`/api/seguro-quotes/${q.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (r.ok) {
        const saved = await r.json()
        setQuotes(prev => prev.map(x => (x.id === saved.id ? { ...x, status: saved.status } : x)))
        setToast(`${q.quoteNumber} → ${STATUS[status]?.label ?? status}`)
      } else setError((await r.json().catch(() => ({}))).error || 'No se pudo cambiar el estado')
    } catch { setError('Error de conexión') }
  }

  const borrar = async () => {
    if (!confirmDelete) return
    try {
      const r = await fetch(`/api/seguro-quotes/${confirmDelete.id}`, { method: 'DELETE' })
      if (r.ok) {
        setQuotes(prev => prev.filter(x => x.id !== confirmDelete.id))
        setToast('Cotización eliminada')
        setConfirmDelete(null)
      } else setError((await r.json().catch(() => ({}))).error || 'No se pudo eliminar')
    } catch { setError('Error de conexión') }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.7rem', color: C.text, mb: 2 }}>
          Seguros de Carga
        </Typography>
        <LinearProgress sx={{ borderRadius: 2, bgcolor: C.borderColor, '& .MuiLinearProgress-bar': { bgcolor: C.accent } }} />
      </Box>
    )
  }

  const headSx = { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: C.textSoft, borderColor: C.borderColor, bgcolor: C.cardSoft }
  const cellSx = { fontSize: '0.84rem', color: C.text, borderColor: C.borderColor, fontVariantNumeric: 'tabular-nums' as const }

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 0.4 }}>
            <Policy sx={{ color: C.accent, fontSize: 28 }} />
            <Typography sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', sm: '1.7rem' }, color: C.text }}>
              Seguros de Carga
            </Typography>
          </Box>
          <Typography sx={{ color: C.textMid, fontSize: '0.92rem' }}>
            Cotizaciones emitidas, su estado y el PDF de cada una.
          </Typography>
        </Box>
        <Button
          onClick={() => router.push('/dashboard/cotizaciones/seguro-carga')}
          startIcon={<Add />}
          sx={{ bgcolor: C.accent, color: '#0A0A0A', textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 2.4, py: 1.1, boxShadow: 'none', '&:hover': { bgcolor: C.accentHover, boxShadow: 'none' } }}
        >
          Nueva cotización
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { label: 'Cotizaciones', value: String(totales.total), color: C.text },
          { label: 'Abiertas', value: String(totales.abiertas), color: C.blue },
          { label: 'Aprobadas', value: String(totales.aprobadas), color: C.green },
          { label: 'Primas aprobadas', value: fmtUsd(totales.primas), color: C.green },
        ].map(s => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ borderRadius: '14px', border: C.border, boxShadow: 'none', bgcolor: C.card }}>
              <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </Typography>
                <Typography sx={{ color: C.textMid, fontSize: '0.8rem', mt: 0.3 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: '14px', border: C.border, boxShadow: 'none', bgcolor: C.card, mb: 2.5 }}>
        <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField fullWidth size="small" sx={fieldSx} value={search}
                onChange={e => setSearch(e.target.value)} placeholder="N° de cotización, cliente o referencia…"
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: C.textMid }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} md={5}>
              <ToggleButtonGroup exclusive size="small" value={statusFilter}
                onChange={(_, v) => v && setStatusFilter(v)}
                sx={{ flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', color: C.textMid, borderColor: C.borderColor, borderRadius: '10px', '&.Mui-selected': { bgcolor: 'rgba(250,204,21,0.25)', color: C.text, borderColor: 'rgba(250,204,21,0.6)' } } }}>
                <ToggleButton value="all">Todas</ToggleButton>
                {FLUJO.map(sKey => <ToggleButton key={sKey} value={sKey}>{STATUS[sKey].label}</ToggleButton>)}
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth disabled={!search && statusFilter === 'all'} startIcon={<FilterAltOff />}
                onClick={() => { setSearch(''); setStatusFilter('all') }}
                sx={{ textTransform: 'none', fontWeight: 600, color: C.textMid, border: C.border, borderRadius: '10px', py: 0.9 }}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={{ borderRadius: '14px', border: C.border, boxShadow: 'none', bgcolor: C.card }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Policy sx={{ fontSize: 48, color: C.textSoft, opacity: 0.35, mb: 1 }} />
            <Typography sx={{ color: C.textMid, fontSize: '0.95rem' }}>
              {quotes.length === 0 ? 'Todavía no hay cotizaciones de seguro guardadas.' : 'Ninguna coincide con el filtro.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>N° cotización</TableCell>
                  <TableCell sx={headSx}>Cliente</TableCell>
                  <TableCell sx={headSx}>Tarifa</TableCell>
                  <TableCell sx={headSx} align="right">Total asegurado</TableCell>
                  <TableCell sx={headSx} align="right">A cobrar</TableCell>
                  <TableCell sx={headSx} align="center">Estado</TableCell>
                  <TableCell sx={headSx}>Fecha</TableCell>
                  <TableCell sx={headSx} align="center">Notas</TableCell>
                  <TableCell sx={headSx} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(q => (
                  <TableRow key={q.id} hover sx={{ '&:hover': { bgcolor: C.cardSoft } }}>
                    <TableCell sx={{ ...cellSx, fontFamily: 'monospace', fontWeight: 700 }}>
                      {q.quoteNumber}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ fontSize: '0.85rem', color: C.text, fontWeight: 600 }}>{q.cliente}</Typography>
                      {q.referencia && <Typography sx={{ fontSize: '0.74rem', color: C.textMid }}>{q.referencia}</Typography>}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography sx={{ fontSize: '0.8rem', color: C.textMid }}>{q.rateLabel}</Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: C.textSoft }}>{q.rate}%</Typography>
                    </TableCell>
                    <TableCell sx={cellSx} align="right">{fmtUsd(q.totalAsegurado)}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 800, color: C.green }} align="right">{fmtUsd(q.valorCobrar)}</TableCell>
                    <TableCell sx={cellSx} align="center">
                      <Chip size="small" label={STATUS[q.status]?.label ?? q.status}
                        sx={{ bgcolor: `${STATUS[q.status]?.color ?? C.textMid}22`, color: STATUS[q.status]?.color ?? C.textMid, fontWeight: 700, fontSize: '0.68rem' }} />
                    </TableCell>
                    <TableCell sx={cellSx}>{new Date(q.createdAt).toLocaleDateString('es-PA')}</TableCell>
                    <TableCell sx={cellSx} align="center">
                      <Tooltip title={notesCounts[q.id] ? `${notesCounts[q.id]} nota(s) de seguimiento` : 'Agregar nota de seguimiento'}>
                        <IconButton size="small" onClick={() => setNotesQuote(q)} sx={{ color: C.textMid }}>
                          <Badge badgeContent={notesCounts[q.id] || 0} color="primary"
                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}>
                            <StickyNote2 sx={{ fontSize: 18, color: notesCounts[q.id] ? C.accentHover : undefined }} />
                          </Badge>
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      <Tooltip title="Descargar PDF">
                        <IconButton size="small" component="a" target="_blank" href={`/api/seguro-quotes/${q.id}/pdf`} sx={{ color: C.textMid, '&:hover': { color: C.accentHover } }}>
                          <PictureAsPdf sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => router.push(`/dashboard/cotizaciones/seguro-carga?id=${q.id}`)} sx={{ color: C.textMid, '&:hover': { color: C.text } }}>
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={e => setMenu({ el: e.currentTarget, q })} sx={{ color: C.textMid }}>
                        <MoreVert sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Menu anchorEl={menu?.el} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem disabled sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 1 }}>
          Cambiar estado
        </MenuItem>
        {FLUJO.filter(sKey => sKey !== menu?.q.status).map(sKey => (
          <MenuItem key={sKey} onClick={() => menu && cambiarEstado(menu.q, sKey)} sx={{ fontSize: '0.85rem' }}>
            <Chip size="small" label={STATUS[sKey].label} sx={{ mr: 1, bgcolor: `${STATUS[sKey].color}22`, color: STATUS[sKey].color, fontWeight: 700, fontSize: '0.66rem' }} />
          </MenuItem>
        ))}
        {isAdmin && (
          <MenuItem onClick={() => { setConfirmDelete(menu!.q); setMenu(null) }} sx={{ fontSize: '0.85rem', color: C.red, borderTop: C.border, mt: 0.5 }}>
            <Delete sx={{ fontSize: 18, mr: 1 }} /> Eliminar
          </MenuItem>
        )}
      </Menu>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        PaperProps={{ sx: { borderRadius: '16px', border: C.border, bgcolor: C.card, backgroundImage: 'none', maxWidth: 420 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', color: C.text }}>
          Eliminar cotización
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: C.textMid, fontSize: '0.92rem' }}>
            Se borra <strong style={{ color: C.text }}>{confirmDelete?.quoteNumber}</strong> y no se puede recuperar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: 'none', fontWeight: 700, color: C.textMid }}>Cancelar</Button>
          <Button onClick={borrar} sx={{ bgcolor: C.red, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 2, '&:hover': { bgcolor: '#B91C1C' } }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)} sx={{ borderRadius: '12px', fontWeight: 600, bgcolor: C.green, color: '#fff' }}>
          {toast}
        </Alert>
      </Snackbar>

      <NotasSeguimientoDialog
        open={Boolean(notesQuote)}
        onClose={() => setNotesQuote(null)}
        entity="INSURANCE_QUOTE"
        entityId={notesQuote?.id ?? null}
        titulo={notesQuote ? `${notesQuote.quoteNumber} — ${notesQuote.cliente}` : undefined}
        onCountChange={(id, count) => setNotesCounts(prev => ({ ...prev, [id]: count }))}
      />
    </Box>
  )
}
