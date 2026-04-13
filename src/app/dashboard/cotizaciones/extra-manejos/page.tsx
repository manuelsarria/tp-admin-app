'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Card, CardContent, TextField, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import {
  Search, AttachMoney, CheckCircle, Warning, Delete, Receipt,
} from '@mui/icons-material'

interface ExtraManejo {
  id: string
  monto: number
  motivo: string
  estado: 'PENDIENTE' | 'COBRADO'
  fechaCobro: string | null
  cobradoPor: string | null
  clienteNombre: string
  quoteNumber: string
  quoteType: string
  createdAt: string
}

interface Stats {
  pendientesCount: number
  pendientesMonto: number
  cobradosMesActual: number
  cobradosCount: number
}

export default function ExtraManejosPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ExtraManejo[]>([])
  const [stats, setStats] = useState<Stats>({ pendientesCount: 0, pendientesMonto: 0, cobradosMesActual: 0, cobradosCount: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0) // 0=Pendientes, 1=Cobrados, 2=Todos
  const [search, setSearch] = useState('')
  const [confirmItem, setConfirmItem] = useState<ExtraManejo | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const estadoFilter = tab === 0 ? 'PENDIENTE' : tab === 1 ? 'COBRADO' : 'ALL'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (estadoFilter !== 'ALL') params.set('estado', estadoFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/extra-manejos?${params}`)
      const data = await res.json()
      setItems(data.items || [])
      setStats(data.stats || { pendientesCount: 0, pendientesMonto: 0, cobradosMesActual: 0, cobradosCount: 0 })
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [estadoFilter, search])

  useEffect(() => { load() }, [load])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleCobrar = async () => {
    if (!confirmItem) return
    setActionLoading(true)
    try {
      await fetch(`/api/extra-manejos/${confirmItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'COBRADO' }),
      })
      setConfirmItem(null)
      load()
    } finally { setActionLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este extra manejo?')) return
    await fetch(`/api/extra-manejos/${id}`, { method: 'DELETE' })
    load()
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  const fmtMoney = (n: number) => `$${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Receipt sx={{ color: '#FACC15', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>Extra Manejos</Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Pendientes', value: stats.pendientesCount, color: '#F59E0B', icon: <Warning sx={{ color: '#fff', fontSize: 22 }} />, bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
          { label: 'Monto por Cobrar', value: fmtMoney(stats.pendientesMonto), color: '#FACC15', icon: <AttachMoney sx={{ color: '#fff', fontSize: 22 }} />, bg: 'linear-gradient(135deg, #FACC15, #EAB308)' },
          { label: 'Cobrado este Mes', value: fmtMoney(stats.cobradosMesActual), color: '#10B981', icon: <CheckCircle sx={{ color: '#fff', fontSize: 22 }} />, bg: 'linear-gradient(135deg, #10B981, #059669)' },
        ].map((s, i) => (
          <Card key={i} sx={{ flex: 1, minWidth: 200, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg }}>
                {s.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>{s.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FAFAF9', lineHeight: 1.2 }}>{s.value}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Tabs + Search */}
      <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Box sx={{ px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 },
            '& .Mui-selected': { color: '#FACC15' },
            '& .MuiTabs-indicator': { backgroundColor: '#FACC15' },
          }}>
            <Tab label={`Pendientes (${stats.pendientesCount})`} />
            <Tab label={`Cobrados (${stats.cobradosCount})`} />
            <Tab label="Todos" />
          </Tabs>
          <TextField
            size="small"
            placeholder="Buscar cliente, referencia..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
          />
        </Box>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: '#374151', fontSize: '0.8rem', borderBottom: '2px solid #E5E7EB' } }}>
                <TableCell>Cliente</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Referencia</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={28} sx={{ color: '#FACC15' }} /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: '#9CA3AF' }}>No hay extra manejos</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#FAFAF9' }}>{item.clienteNombre}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.83rem', color: '#A8A29E', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.motivo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#FACC15', fontWeight: 600 }}>
                      {item.quoteNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.82rem', color: '#6B7280' }}>{fmtDate(item.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#FAFAF9' }}>{fmtMoney(item.monto)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.estado === 'PENDIENTE' ? 'Pendiente' : 'Cobrado'}
                      size="small"
                      sx={{
                        fontWeight: 600, fontSize: '0.75rem',
                        bgcolor: item.estado === 'PENDIENTE' ? '#FEF3C7' : '#D1FAE5',
                        color: item.estado === 'PENDIENTE' ? '#92400E' : '#065F46',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {item.estado === 'PENDIENTE' && (
                        <Tooltip title="Marcar cobrado">
                          <IconButton size="small" sx={{ color: '#10B981' }} onClick={() => setConfirmItem(item)}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton size="small" sx={{ color: '#EF4444' }} onClick={() => handleDelete(item.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Confirm Cobrar Modal */}
      <Dialog open={!!confirmItem} onClose={() => setConfirmItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Cobro de Extra Manejo</DialogTitle>
        <DialogContent>
          {confirmItem && (
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <Alert severity="info" sx={{ fontWeight: 600 }}>
                Confirma que este extra manejo ha sido cobrado al cliente.
              </Alert>
              {[
                ['Cliente', confirmItem.clienteNombre],
                ['Referencia', confirmItem.quoteNumber],
                ['Motivo', confirmItem.motivo],
                ['Monto', fmtMoney(confirmItem.monto)],
                ['Registrado', fmtDate(confirmItem.createdAt)],
                ['Cobrado por', session?.user?.name || session?.user?.email || 'Admin'],
                ['Fecha de cobro', new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #0A0A0A' }}>
                  <Typography sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.9rem' }}>{label}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#FAFAF9' }}>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmItem(null)} disabled={actionLoading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCobrar}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
          >
            Confirmar Cobro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
