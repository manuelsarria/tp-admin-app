'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  TextField, InputAdornment, Chip, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, IconButton, Tooltip,
} from '@mui/material'
import { LocalShipping, Add, Search, ArrowForward, Delete } from '@mui/icons-material'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']
const COUNTRY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  CHINA:      { bg: '#FEF2F2', color: '#DC2626', label: 'China' },
  PANAMA:     { bg: '#EFF6FF', color: '#3B82F6', label: 'Panamá' },
  COSTA_RICA: { bg: '#F0FDF4', color: '#16A34A', label: 'Costa Rica' },
  USA:        { bg: '#EEF2FF', color: '#6366F1', label: 'USA' },
  OTHER:      { bg: '#F9FAFB', color: '#6B7280', label: 'Otro' },
}
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

export default function OperacionesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ops, setOps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) router.replace('/dashboard')
  }, [session, status])

  const loadOps = () => {
    setLoading(true)
    fetch(`/api/contabilidad/operations?search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => setOps(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOps() }, [search])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar operación "${title}"?`)) return
    await fetch(`/api/contabilidad/operations/${id}`, { method: 'DELETE' })
    setOps(prev => prev.filter(o => o.id !== id))
  }

  if (status === 'loading' || !session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <LocalShipping sx={{ color: '#FACC15', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#FAFAF9' }}>Operaciones</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            P&L por contenedor/LCL — igual que tu hoja de Excel
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => router.push('/dashboard/contabilidad/operaciones/nueva')}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#EAB308' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
          Nueva Operación
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField size="small" placeholder="Buscar por título, cliente, referencia..."
          value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment> }} />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : ops.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <LocalShipping sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography sx={{ color: '#6B7280', fontWeight: 500 }}>No hay operaciones</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 2, bgcolor: '#FACC15', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            onClick={() => router.push('/dashboard/contabilidad/operaciones/nueva')}>
            Crear primera operación
          </Button>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Título / Cliente', 'País', 'Tipo', 'Referencia', 'POL → POD', 'Ingreso', 'Costo Total', 'Utilidad', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ops.map(op => {
                const totalCost = (op.items || []).reduce((s: number, i: any) => s + i.costoTotal, 0)
                const utilidad = op.ingresoTotal - totalCost
                const cc = COUNTRY_COLORS[op.clientCountry] || COUNTRY_COLORS.OTHER
                const polDate = op.polDate ? new Date(op.polDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'
                const podDate = op.podDate ? new Date(op.podDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'
                return (
                  <TableRow key={op.id} sx={{ '&:hover': { bgcolor: 'rgba(10, 10, 10, 0.05)' }, cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/contabilidad/operaciones/${op.id}`)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{op.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{op.clientName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={cc.label} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: cc.bg, color: cc.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#6B7280' }}>{op.shipmentType}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#6B7280' }}>{op.shipmentRef || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280' }}>{polDate} → {podDate}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#16A34A' }}>{fmt(op.ingresoTotal)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#DC2626' }}>{fmt(totalCost)}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: utilidad >= 0 ? '#16A34A' : '#DC2626' }}>
                        {fmt(utilidad)}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => router.push(`/dashboard/contabilidad/operaciones/${op.id}`)}>
                            <ArrowForward sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" sx={{ color: '#DC2626' }} onClick={() => handleDelete(op.id, op.title)}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  )
}
