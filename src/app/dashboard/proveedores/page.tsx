'use client'

import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, IconButton, Button, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid,
  FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert,
} from '@mui/material'
import {
  Contacts, Add, Edit, Delete, Search, Star, StarBorder,
} from '@mui/icons-material'

const PLATFORMS: Record<string, { label: string; color: string; bg: string }> = {
  ALIBABA:       { label: 'Alibaba',        color: '#B45309', bg: '#FEF3C7' },
  P1688:         { label: '1688',            color: '#9333EA', bg: '#F3E8FF' },
  MADE_IN_CHINA: { label: 'Made-in-China',  color: '#0369A1', bg: '#E0F2FE' },
  TAOBAO:        { label: 'Taobao',         color: '#DC2626', bg: '#FEF2F2' },
  DIRECTO:       { label: 'Directo',        color: '#16A34A', bg: '#F0FDF4' },
  OTRO:          { label: 'Otro',           color: '#6B7280', bg: '#F9FAFB' },
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Box key={n} onClick={() => !readonly && onChange?.(n)}
          sx={{ cursor: readonly ? 'default' : 'pointer', color: n <= value ? '#F59E0B' : '#D1D5DB', display: 'flex' }}>
          {n <= value ? <Star sx={{ fontSize: 18 }} /> : <StarBorder sx={{ fontSize: 18 }} />}
        </Box>
      ))}
    </Box>
  )
}

const EMPTY_FORM = {
  name: '', city: '', platform: 'OTRO', contactWeChat: '', contactEmail: '',
  contactPhone: '', products: '', rating: 3, notes: '', linkedCargos: '',
}

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('ALL')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterPlatform !== 'ALL') params.set('platform', filterPlatform)
      const res = await fetch(`/api/suppliers?${params}`)
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch { setSuppliers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [search, filterPlatform])

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setDialogOpen(true) }
  const openEdit = (s: any) => {
    setEditing(s)
    setForm({
      name: s.name, city: s.city || '', platform: s.platform, contactWeChat: s.contactWeChat || '',
      contactEmail: s.contactEmail || '', contactPhone: s.contactPhone || '', products: s.products || '',
      rating: s.rating, notes: s.notes || '', linkedCargos: s.linkedCargos || '',
    })
    setError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nombre es requerido'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const e = await res.json(); setError(e.error || 'Error'); return }
      setDialogOpen(false); loadData()
    } catch { setError('Error de conexion') }
    finally { setSaving(false) }
  }

  const handleDelete = async (s: any) => {
    if (!confirm(`¿Eliminar proveedor "${s.name}"?`)) return
    await fetch(`/api/suppliers/${s.id}`, { method: 'DELETE' })
    loadData()
  }

  const set = (field: string) => (e: any) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const avgRating = suppliers.length > 0
    ? (suppliers.reduce((s, sup) => s + sup.rating, 0) / suppliers.length).toFixed(1)
    : '—'

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Contacts sx={{ color: '#FACC15', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Directorio de Proveedores</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Gestiona tus proveedores de China con contactos, calificaciones y notas.
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#EFF6FF' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#3B82F6' }}>{suppliers.length}</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Total Proveedores</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 140, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#FFFBEB' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ fontSize: 20, color: '#F59E0B' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#F59E0B' }}>{avgRating}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>Promedio Calificacion</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)}
          sx={{ flex: 2, minWidth: 220 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Plataforma</InputLabel>
          <Select value={filterPlatform} label="Plataforma" onChange={e => setFilterPlatform(e.target.value)}>
            <MenuItem value="ALL">Todas</MenuItem>
            {Object.entries(PLATFORMS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', ml: 'auto' }}>
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : suppliers.length === 0 ? (
        <Card sx={{ borderRadius: 3, border: '2px dashed #E5E7EB', boxShadow: 'none', py: 8, textAlign: 'center' }}>
          <Contacts sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>No hay proveedores</Typography>
        </Card>
      ) : (
        <Paper sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                {['Nombre', 'Ciudad', 'Plataforma', 'Contacto', 'Productos', 'Calificacion', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map(s => {
                const p = PLATFORMS[s.platform] || PLATFORMS.OTRO
                const contact = [s.contactWeChat, s.contactEmail, s.contactPhone].filter(Boolean).join(' | ')
                return (
                  <TableRow key={s.id} sx={{ '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.06)' } }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#6B7280' }}>{s.city || '—'}</TableCell>
                    <TableCell>
                      <Chip label={p.label} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', bgcolor: p.bg, color: p.color }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', color: '#6B7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.products || '—'}
                    </TableCell>
                    <TableCell><StarRating value={s.rating} readonly /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(s)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton size="small" onClick={() => handleDelete(s)} sx={{ color: '#DC2626' }}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre del Proveedor *" value={form.name} onChange={set('name')} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Ciudad (China)" value={form.city} onChange={set('city')} fullWidth size="small" placeholder="Ej: Guangzhou, Yiwu..." />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Plataforma</InputLabel>
                <Select value={form.platform} label="Plataforma" onChange={e => setForm(prev => ({ ...prev, platform: e.target.value }))}>
                  {Object.entries(PLATFORMS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="WeChat" value={form.contactWeChat} onChange={set('contactWeChat')} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Email" value={form.contactEmail} onChange={set('contactEmail')} fullWidth size="small" type="email" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Telefono" value={form.contactPhone} onChange={set('contactPhone')} fullWidth size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Productos que compra" value={form.products} onChange={set('products')} fullWidth size="small" multiline rows={2}
                placeholder="Ej: Electronica, ropa deportiva, accesorios..." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>Calificacion</Typography>
                <StarRating value={form.rating} onChange={v => setForm(prev => ({ ...prev, rating: v }))} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Cargos / Compras vinculadas" value={form.linkedCargos} onChange={set('linkedCargos')} fullWidth size="small"
                placeholder="Ej: Orden #123, Contenedor MSKU..." />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notas internas" value={form.notes} onChange={set('notes')} fullWidth size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Proveedor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
