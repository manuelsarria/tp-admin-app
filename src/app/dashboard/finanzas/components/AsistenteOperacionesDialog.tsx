'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, Alert, LinearProgress, Checkbox, TextField, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, MenuItem, CircularProgress,
  Divider,
} from '@mui/material'
import { AutoAwesome, Merge, CallSplit } from '@mui/icons-material'
import { formatMoney, DEFAULT_UNITS } from '@/lib/finance'
import { num, gainColor, formatDate } from './OperacionesTab'

// ---------------------------------------------------------------------------
// Local types — the /suggest payload.
// ---------------------------------------------------------------------------

interface SuggestEntry {
  id: string
  date?: string | null
  type?: string | null
  category?: string | null
  description?: string | null
  reference?: string | null
  amount?: number | null
}

interface Suggestion {
  key: string
  suggestedName?: string | null
  containerNumber?: string | null
  unit?: string | null
  entries?: SuggestEntry[] | null
  ingresado?: number | null
  invertido?: number | null
  ganancia?: number | null
  mergedFrom?: string[] | null
}

/** A reviewable block. Starts 1:1 with a suggestion; the owner may merge several. */
interface Group {
  id: string
  keys: string[]
  name: string
  containerNumber: string
  unit: string
  entries: SuggestEntry[]
  mergedFrom: string[]
}

const UNIT_ALL = ''

const groupFromSuggestion = (s: Suggestion): Group => ({
  id: s.key,
  keys: [s.key],
  name: (s.suggestedName || s.containerNumber || s.key || 'Operación').toString(),
  containerNumber: (s.containerNumber || '').toString(),
  unit: (s.unit || '').toString(),
  entries: Array.isArray(s.entries) ? s.entries.filter(e => e && e.id) : [],
  mergedFrom: Array.isArray(s.mergedFrom) ? s.mergedFrom.filter(Boolean) : [],
})

const totals = (entries: SuggestEntry[], included: Record<string, boolean>) => {
  let ingresado = 0
  let invertido = 0
  entries.forEach(e => {
    if (included[e.id] === false) return
    const a = num(e.amount)
    if (e.type === 'EGRESO') invertido += a
    else ingresado += a
  })
  return { ingresado, invertido, ganancia: ingresado - invertido }
}

export default function AsistenteOperacionesDialog({
  open, onClose, onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}) {
  const [unit, setUnit] = useState<string>('Contenedores Valdai')
  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [groups, setGroups] = useState<Group[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [included, setIncluded] = useState<Record<string, boolean>>({})

  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [results, setResults] = useState<string[]>([])
  const [failures, setFailures] = useState<string[]>([])

  const load = useCallback(() => {
    setLoading(true)
    setResults([])
    setFailures([])
    const qs = unit ? `?unit=${encodeURIComponent(unit)}` : ''
    fetch(`/api/finanzas/operations/suggest${qs}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar las sugerencias'))))
      .then(d => {
        const list: Suggestion[] = Array.isArray(d?.suggestions) ? d.suggestions : Array.isArray(d) ? d : []
        const clean = list.filter(s => s && s.key)
        setSuggestions(clean)
        setGroups(clean.map(groupFromSuggestion))
        setSelected({})
        setIncluded({})
        setError(null)
      })
      .catch(e => {
        setSuggestions([]); setGroups([])
        setError(e?.message || 'Error al cargar las sugerencias')
      })
      .finally(() => setLoading(false))
  }, [unit])

  useEffect(() => {
    if (!open) return
    let alive = true
    fetch('/api/finanzas/catalog')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive) return
        const list = data?.values?.unit
        if (Array.isArray(list) && list.length) setUnits(list)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [open])

  useEffect(() => { if (open) load() }, [open, load])

  const isIncluded = (id: string) => included[id] !== false

  const toggleEntry = (id: string) => setIncluded(m => ({ ...m, [id]: m[id] === false }))
  const toggleGroup = (id: string) => setSelected(m => ({ ...m, [id]: !m[id] }))

  const selectedIds = useMemo(() => groups.filter(g => selected[g.id]).map(g => g.id), [groups, selected])

  const mergeSelected = () => {
    const chosen = groups.filter(g => selected[g.id])
    if (chosen.length < 2) return
    const merged: Group = {
      id: `merged:${chosen.map(g => g.id).join('|')}`,
      keys: chosen.flatMap(g => g.keys),
      name: chosen[0].name,
      containerNumber: chosen.find(g => g.containerNumber)?.containerNumber || '',
      unit: chosen.find(g => g.unit)?.unit || unit || '',
      entries: chosen.flatMap(g => g.entries),
      mergedFrom: chosen.flatMap(g => (g.mergedFrom.length ? g.mergedFrom : [g.name])),
    }
    const firstIdx = groups.findIndex(g => g.id === chosen[0].id)
    const rest = groups.filter(g => !selected[g.id])
    rest.splice(Math.max(0, Math.min(firstIdx, rest.length)), 0, merged)
    setGroups(rest)
    setSelected({ [merged.id]: true })
  }

  const splitGroup = (g: Group) => {
    const originals = g.keys
      .map(k => suggestions.find(s => s.key === k))
      .filter(Boolean)
      .map(s => groupFromSuggestion(s as Suggestion))
    if (!originals.length) return
    const idx = groups.findIndex(x => x.id === g.id)
    const next = groups.slice()
    next.splice(idx, 1, ...originals)
    setGroups(next)
    setSelected(m => {
      const { [g.id]: _drop, ...rest } = m
      return rest
    })
  }

  const setGroupField = (id: string, field: 'name' | 'containerNumber', value: string) =>
    setGroups(gs => gs.map(g => (g.id === id ? { ...g, [field]: value } : g)))

  const handleCreate = async () => {
    const chosen = groups.filter(g => selected[g.id])
    if (!chosen.length) return
    setCreating(true)
    setError(null)
    setResults([])
    setFailures([])
    setProgress({ done: 0, total: chosen.length })

    const ok: string[] = []
    const bad: string[] = []

    for (const g of chosen) {
      try {
        if (!g.name.trim()) throw new Error('falta el nombre')
        const entryIds = g.entries.filter(e => isIncluded(e.id)).map(e => e.id)
        if (!entryIds.length) throw new Error('no quedan movimientos seleccionados')

        const res = await fetch('/api/finanzas/operations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: g.name.trim(),
            containerNumber: g.containerNumber.trim() || null,
            unit: g.unit || unit || null,
            status: 'ABIERTA',
          }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || 'no se pudo crear la operación')
        }
        const created = await res.json().catch(() => ({}))
        const id: string | undefined = created?.data?.id || created?.id
        if (!id) throw new Error('la API no devolvió el id de la operación')

        const linkRes = await fetch(`/api/finanzas/operations/${id}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryIds }),
        })
        if (!linkRes.ok) {
          const j = await linkRes.json().catch(() => ({}))
          throw new Error(j?.error || 'se creó la operación pero no se pudieron vincular los movimientos')
        }
        ok.push(`${g.name.trim()} — ${entryIds.length} movimiento${entryIds.length !== 1 ? 's' : ''}`)
      } catch (e: any) {
        bad.push(`${g.name || '(sin nombre)'}: ${e?.message || 'error'}`)
      } finally {
        setProgress(p => ({ ...p, done: p.done + 1 }))
      }
    }

    setResults(ok)
    setFailures(bad)
    setCreating(false)
    if (ok.length) {
      onCreated?.()
      load()
    }
  }

  return (
    <Dialog open={open} onClose={creating ? undefined : onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome sx={{ color: '#FACC15' }} /> Asistente de operaciones
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
          Las referencias del registro diario se escribieron a mano, así que un mismo trabajo puede
          aparecer con dos nombres distintos (por ejemplo <em>&quot;2 contenedores colchones 1 triciclos&quot;</em> y
          {' '}<em>&quot;3 contenedores 2 colchones 1 triciclos&quot;</em>) y agruparlas por texto partiría un solo
          trabajo en dos y mostraría una ganancia falsa. Por eso <strong>nada se agrupa solo</strong>: aquí
          te proponemos agrupaciones y <strong>tú confirmas</strong> cuáles se crean, qué movimientos entran, y
          cuáles son en realidad el mismo trabajo (selecciónalas y usa <strong>Unir en una sola operación</strong>).
        </Alert>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField select size="small" label="Unidad" value={unit}
            onChange={e => setUnit(e.target.value)} sx={{ minWidth: 220 }} disabled={creating}>
            <MenuItem value={UNIT_ALL}>Todas las unidades</MenuItem>
            {units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={load} disabled={loading || creating}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A', borderColor: 'rgba(10,10,10,0.2)' }}>
            Recalcular sugerencias
          </Button>
          <Button variant="contained" startIcon={<Merge />} disabled={selectedIds.length < 2 || creating}
            onClick={mergeSelected}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
            Unir en una sola operación ({selectedIds.length})
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {creating && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#78716C' }}>
              Creando operaciones… {progress.done} / {progress.total}
            </Typography>
            <LinearProgress variant="determinate"
              value={progress.total ? (progress.done / progress.total) * 100 : 0}
              sx={{ height: 8, borderRadius: 4, mt: 0.5, bgcolor: 'rgba(10,10,10,0.08)', '& .MuiLinearProgress-bar': { bgcolor: '#FACC15', borderRadius: 4 } }} />
          </Box>
        )}

        {results.length > 0 && (
          <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
            <strong>Operaciones creadas:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {results.map(r => <li key={r}>{r}</li>)}
            </ul>
          </Alert>
        )}
        {failures.length > 0 && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
            <strong>No se pudieron crear:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {failures.map(f => <li key={f}>{f}</li>)}
            </ul>
          </Alert>
        )}

        {!loading && groups.length === 0 && !error && (
          <Typography variant="body2" sx={{ color: '#78716C', py: 4, textAlign: 'center' }}>
            No hay sugerencias pendientes para esta unidad. Todos los movimientos ya están vinculados
            a una operación, o no hay movimientos con referencia de contenedor.
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {groups.map(g => {
            const t = totals(g.entries, included)
            const isMerged = g.keys.length > 1
            return (
              <Card key={g.id} sx={{
                borderRadius: '16px',
                border: selected[g.id] ? '2px solid #FACC15' : '1px solid rgba(10,10,10,0.06)',
                boxShadow: 'none',
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Checkbox checked={!!selected[g.id]} onChange={() => toggleGroup(g.id)}
                      disabled={creating} sx={{ p: 0.5, mt: 0.5, color: '#A8A29E', '&.Mui-checked': { color: '#0A0A0A' } }} />
                    <Box sx={{ flex: 1, minWidth: 240 }}>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>
                        Crear esta operación
                      </Typography>
                      <TextField size="small" fullWidth label="Nombre propuesto" sx={{ mt: 0.5 }}
                        value={g.name} disabled={creating}
                        onChange={e => setGroupField(g.id, 'name', e.target.value)} />
                    </Box>
                    <Box sx={{ minWidth: 180 }}>
                      <TextField size="small" fullWidth label="Nº de contenedor" sx={{ mt: 2.4 }}
                        value={g.containerNumber} disabled={creating}
                        onChange={e => setGroupField(g.id, 'containerNumber', e.target.value)} />
                    </Box>
                  </Box>

                  {isMerged && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={`Unión de ${g.keys.length} sugerencias`} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: '#FEFCE8', color: '#854D0E' }} />
                      {g.mergedFrom.slice(0, 4).map((m, i) => (
                        <Typography key={`${m}-${i}`} variant="caption" sx={{ color: '#78716C' }}>· {m}</Typography>
                      ))}
                      <Button size="small" startIcon={<CallSplit />} onClick={() => splitGroup(g)} disabled={creating}
                        sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A', ml: 'auto' }}>
                        Deshacer unión
                      </Button>
                    </Box>
                  )}

                  {/* Preview totals */}
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end', bgcolor: '#FAFAF9', borderRadius: '12px', p: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Ganancia</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.1, fontFamily: '"Poppins", sans-serif', color: gainColor(t.ganancia) }}>
                        {formatMoney(t.ganancia)}
                      </Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Invertido</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>{formatMoney(t.invertido)}</Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Ingresado</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>{formatMoney(t.ingresado)}</Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Movimientos</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {g.entries.filter(e => isIncluded(e.id)).length} de {g.entries.length}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Entries */}
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Referencia</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Monto</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {g.entries.map(e => {
                          const isEgreso = e.type === 'EGRESO'
                          const on = isIncluded(e.id)
                          return (
                            <TableRow key={e.id} hover sx={{ opacity: on ? 1 : 0.45 }}>
                              <TableCell padding="checkbox">
                                <Checkbox size="small" checked={on} disabled={creating}
                                  onChange={() => toggleEntry(e.id)}
                                  sx={{ color: '#A8A29E', '&.Mui-checked': { color: '#0A0A0A' } }} />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</TableCell>
                              <TableCell>
                                <Chip label={isEgreso ? 'Egreso' : 'Ingreso'} size="small"
                                  sx={{
                                    fontWeight: 700, fontSize: '0.62rem',
                                    bgcolor: isEgreso ? '#FEF2F2' : '#ECFDF5',
                                    color: isEgreso ? '#B91C1C' : '#047857',
                                  }} />
                              </TableCell>
                              <TableCell sx={{ maxWidth: 240 }}>
                                {e.description || e.category || '—'}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 300, color: '#78716C', fontSize: '0.78rem' }}>
                                {e.reference || '—'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: isEgreso ? '#B91C1C' : '#047857' }}>
                                {isEgreso ? '-' : '+'}{formatMoney(num(e.amount))}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {g.entries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ color: '#78716C' }}>Sin movimientos.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" sx={{ color: '#78716C', mr: 'auto' }}>
          {selectedIds.length} operaci{selectedIds.length !== 1 ? 'ones' : 'ón'} seleccionada{selectedIds.length !== 1 ? 's' : ''}
        </Typography>
        <Button onClick={onClose} disabled={creating} sx={{ textTransform: 'none' }}>Cerrar</Button>
        <Button variant="contained" onClick={handleCreate} disabled={creating || selectedIds.length === 0}
          startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
          Crear {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
