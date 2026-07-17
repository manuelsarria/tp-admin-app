'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Grid, TextField, MenuItem, Button, Chip, IconButton,
  Typography, Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Add, Edit, Delete, Search } from '@mui/icons-material'
import { formatMoney, STATUS_LABEL, DEFAULT_UNITS } from '@/lib/finance'
import type { Entry, CatalogValues, LedgerScope } from './types'
import { LEDGER_SCOPE_LABEL } from './types'
import EntryFormDialog from './EntryFormDialog'
import PendientesAlert from './PendientesAlert'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PAGADO: { bg: '#ECFDF5', color: '#047857' },
  PENDIENTE: { bg: '#FFFBEB', color: '#B45309' },
  PARCIAL: { bg: '#EFF6FF', color: '#1D4ED8' },
  ANULADO: { bg: '#F5F5F4', color: '#78716C' },
}

const SCOPE_COLORS: Record<LedgerScope, { bg: string; color: string }> = {
  NEGOCIO: { bg: '#F5F3FF', color: '#5B21B6' },
  PERSONAL: { bg: '#FFF7ED', color: '#C2410C' },
}

export default function RegistroTab({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<Entry[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 })

  // filters
  const [search, setSearch] = useState('')
  const [unit, setUnit] = useState('')
  const [scope, setScope] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)

  useEffect(() => {
    fetch('/api/finanzas/catalog')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { const v: CatalogValues | undefined = d?.values; if (v?.unit?.length) setUnits(v.unit) })
      .catch(() => {})
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(pagination.page + 1))
    params.set('pageSize', String(pagination.pageSize))
    if (search) params.set('search', search)
    if (unit) params.set('unit', unit)
    if (scope) params.set('scope', scope)
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch(`/api/finanzas/entries?${params.toString()}`)
      .then(r => (r.ok ? r.json() : { data: [], meta: { total: 0 } }))
      .then(d => { setRows(d.data || []); setRowCount(d.meta?.total || 0) })
      .catch(() => { setRows([]); setRowCount(0) })
      .finally(() => setLoading(false))
  }, [pagination, search, unit, scope, type, status, from, to])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Borrar este movimiento? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/finanzas/entries/${id}`, { method: 'DELETE' })
    if (res.ok) { load(); onChanged?.() }
  }

  const columns: GridColDef<Entry>[] = [
    {
      field: 'date', headerName: 'Fecha', width: 110,
      valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: '2-digit' }) : ''),
    },
    { field: 'unit', headerName: 'Unidad', width: 150 },
    {
      // El chip de ámbito vive aquí para no añadir otra columna a una tabla ya ancha.
      field: 'type', headerName: 'Tipo / Ámbito', width: 180, sortable: true,
      renderCell: (p) => {
        const sc = SCOPE_COLORS[(p.row.scope as LedgerScope)] || SCOPE_COLORS.NEGOCIO
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip label={p.value === 'INGRESO' ? 'Ingreso' : 'Egreso'} size="small"
              sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: p.value === 'INGRESO' ? '#ECFDF5' : '#FEF2F2', color: p.value === 'INGRESO' ? '#047857' : '#B91C1C' }} />
            <Chip label={LEDGER_SCOPE_LABEL[(p.row.scope as LedgerScope)] || LEDGER_SCOPE_LABEL.NEGOCIO} size="small"
              sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: sc.bg, color: sc.color }} />
          </Box>
        )
      },
    },
    { field: 'category', headerName: 'Categoría', width: 150 },
    { field: 'description', headerName: 'Descripción', width: 200, flex: 1 },
    { field: 'counterparty', headerName: 'Cliente/Proveedor', width: 160 },
    {
      field: 'status', headerName: 'Estado', width: 110,
      renderCell: (p) => {
        const c = STATUS_COLORS[p.value as string] || STATUS_COLORS.PAGADO
        return <Chip label={STATUS_LABEL[p.value as keyof typeof STATUS_LABEL]} size="small" sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: c.bg, color: c.color }} />
      },
    },
    {
      field: 'amount', headerName: 'Monto', width: 130, align: 'right', headerAlign: 'right',
      renderCell: (p) => {
        const ingreso = p.row.type === 'INGRESO'
        return <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: ingreso ? '#047857' : '#B91C1C' }}>
          {ingreso ? '+' : '−'}{formatMoney(Math.abs(p.value as number))}
        </Typography>
      },
    },
    {
      field: 'actions', headerName: '', width: 90, sortable: false, filterable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="Editar"><IconButton size="small" onClick={() => { setEditing(p.row); setDialogOpen(true) }}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Borrar"><IconButton size="small" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" sx={{ color: '#B91C1C' }} /></IconButton></Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PendientesAlert onChanged={() => { load(); onChanged?.() }} />

      {/* Filters */}
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
        <CardContent>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField fullWidth size="small" placeholder="Buscar..." value={search}
                onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 0 })) }}
                InputProps={{ startAdornment: <Search sx={{ fontSize: 18, color: '#A8A29E', mr: 0.5 }} /> }} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField select fullWidth size="small" label="Unidad" value={unit}
                onChange={e => { setUnit(e.target.value); setPagination(p => ({ ...p, page: 0 })) }}>
                <MenuItem value="">Todas</MenuItem>
                {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField select fullWidth size="small" label="Ámbito" value={scope}
                onChange={e => { setScope(e.target.value); setPagination(p => ({ ...p, page: 0 })) }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="NEGOCIO">Negocio</MenuItem>
                <MenuItem value="PERSONAL">Personal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField select fullWidth size="small" label="Tipo" value={type}
                onChange={e => { setType(e.target.value); setPagination(p => ({ ...p, page: 0 })) }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="INGRESO">Ingreso</MenuItem>
                <MenuItem value="EGRESO">Egreso</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField select fullWidth size="small" label="Estado" value={status}
                onChange={e => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 0 })) }}>
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField fullWidth size="small" label="Desde" type="date" InputLabelProps={{ shrink: true }}
                value={from} onChange={e => { setFrom(e.target.value); setPagination(p => ({ ...p, page: 0 })) }} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField fullWidth size="small" label="Hasta" type="date" InputLabelProps={{ shrink: true }}
                value={to} onChange={e => { setTo(e.target.value); setPagination(p => ({ ...p, page: 0 })) }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: '#78716C' }}>{rowCount} movimiento{rowCount !== 1 ? 's' : ''}</Typography>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
          Nuevo
        </Button>
      </Box>

      {/* Grid */}
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { bgcolor: '#FAFAF9' } }}
        />
      </Card>

      <EntryFormDialog
        open={dialogOpen}
        entry={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={() => { load(); onChanged?.() }}
      />
    </Box>
  )
}
