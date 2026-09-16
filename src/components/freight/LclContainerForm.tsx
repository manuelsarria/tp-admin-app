'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { Save, ArrowBack, CloudUpload, Download, Description, DeleteOutline } from '@mui/icons-material'

interface LclContainerData {
  id: string
  containerNumber?: string | null
  seal?: string | null
  vessel?: string | null
  voyage?: string | null
  portOfLoading: string
  portOfDischarge: string
  shipperName?: string | null
  shipperAddress?: string | null
  etd?: string | null
  eta?: string | null
  closingDate?: string | null
  notes?: string | null
}

interface DocItem { id: string; kind: string; originalName: string; size: number; createdAt: string }

interface Props {
  id?: string
  initial?: LclContainerData
  origin?: 'CHINA' | 'PANAMA'
}

const toInputDate = (v: string | null | undefined) => {
  if (!v) return ''
  const d = new Date(v)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function LclContainerForm({ id, initial, origin = 'CHINA' }: Props) {
  const router = useRouter()
  const isPanama = origin === 'PANAMA'
  const listPath = isPanama ? '/dashboard/freight/pa/mbl' : '/dashboard/freight/lcl/containers'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    containerNumber: '',
    seal: '',
    vessel: '',
    voyage: '',
    portOfLoading: 'QINGDAO',
    portOfDischarge: 'BALBOA',
    shipperName: '',
    shipperAddress: '',
    etd: '',
    eta: '',
    closingDate: '',
    notes: '',
  })

  // Documentos del MBL — solo en edición (hace falta el id para adjuntarlos)
  const [mblDocs, setMblDocs] = useState<DocItem[]>([])
  const [uploadingMbl, setUploadingMbl] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        containerNumber: initial.containerNumber || '',
        seal: initial.seal || '',
        vessel: initial.vessel || '',
        voyage: initial.voyage || '',
        portOfLoading: initial.portOfLoading || 'QINGDAO',
        portOfDischarge: initial.portOfDischarge || 'BALBOA',
        shipperName: initial.shipperName || '',
        shipperAddress: initial.shipperAddress || '',
        etd: toInputDate(initial.etd),
        eta: toInputDate(initial.eta),
        closingDate: toInputDate(initial.closingDate),
        notes: initial.notes || '',
      })
    }
  }, [initial])

  const loadDocs = useCallback(async () => {
    if (!id) return
    const res = await fetch(`/api/documents?lclContainerId=${id}`)
    if (res.ok) setMblDocs((await res.json()).filter((d: DocItem) => d.kind === 'MBL'))
  }, [id])

  useEffect(() => {
    if (!id) return
    loadDocs()
  }, [id, loadDocs])

  const uploadMbl = async (file: File) => {
    if (!id) return
    setUploadingMbl(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', 'MBL')
      fd.append('lclContainerId', id)
      const res = await fetch('/api/documents', { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Error') }
      await loadDocs()
    } catch (e: any) {
      alert(e.message || 'Error al subir MBL')
    } finally {
      setUploadingMbl(false)
    }
  }

  const deleteMblDoc = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    if (res.ok) await loadDocs()
  }

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = id ? `/api/lcl-containers/${id}` : '/api/lcl-containers'
      const method = id ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          containerNumber: form.containerNumber || null,
          seal: form.seal || null,
          vessel: form.vessel || null,
          voyage: form.voyage || null,
          portOfLoading: form.portOfLoading,
          portOfDischarge: form.portOfDischarge,
          shipperName: form.shipperName || null,
          shipperAddress: form.shipperAddress || null,
          etd: form.etd || null,
          eta: form.eta || null,
          closingDate: form.closingDate || null,
          notes: form.notes || null,
          ...(id ? {} : { origin }),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error guardando')
      }
      router.push(listPath)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.back()} variant="outlined" size="small">
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700}>
          {id ? 'Editar MBL / Contenedor' : 'Nuevo MBL / Contenedor'} {isPanama ? '— Panamá' : '— China'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              El MBL# se genera automáticamente al crear el contenedor.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Container #"
              fullWidth
              size="small"
              value={form.containerNumber}
              onChange={e => set('containerNumber', e.target.value)}
              helperText="Ej: TCKU1234567"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Seal #"
              fullWidth
              size="small"
              value={form.seal}
              onChange={e => set('seal', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Vessel"
              fullWidth
              size="small"
              value={form.vessel}
              onChange={e => set('vessel', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Voyage"
              fullWidth
              size="small"
              value={form.voyage}
              onChange={e => set('voyage', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Port of Loading"
              fullWidth
              size="small"
              value={form.portOfLoading}
              onChange={e => set('portOfLoading', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Port of Discharge"
              fullWidth
              size="small"
              value={form.portOfDischarge}
              onChange={e => set('portOfDischarge', e.target.value)}
            />
          </Grid>
          {isPanama && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Shipper Name"
                  fullWidth
                  size="small"
                  value={form.shipperName}
                  onChange={e => set('shipperName', e.target.value)}
                  helperText="Proveedor en origen — se precarga en todos los HBL de este MBL"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Shipper Address"
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  value={form.shipperAddress}
                  onChange={e => set('shipperAddress', e.target.value)}
                />
              </Grid>
            </>
          )}
          <Grid item xs={6} sm={4}>
            <TextField
              label="ETD (Fecha Salida)"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.etd}
              onChange={e => set('etd', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="ETA (Fecha Llegada)"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.eta}
              onChange={e => set('eta', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Closing Date"
              fullWidth
              size="small"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.closingDate}
              onChange={e => set('closingDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notas"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {id && (
        <Box sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Documentos del MBL
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El Master BL escaneado y cualquier otro documento del contenedor. Queda adjunto
            al MBL, así que se descarga desde aquí y desde el detalle del contenedor.
          </Typography>

          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={uploadingMbl ? <CircularProgress size={16} /> : <CloudUpload />}
            disabled={uploadingMbl}
            sx={{ textTransform: 'none' }}
          >
            Subir documento MBL
            <input type="file" hidden accept="application/pdf,image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadMbl(f); e.target.value = '' }} />
          </Button>

          {mblDocs.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              {mblDocs.map(d => (
                <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Description sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{d.originalName}</Typography>
                  <Button size="small" href={`/api/documents/${d.id}`} target="_blank" sx={{ minWidth: 0 }}>
                    <Download fontSize="small" />
                  </Button>
                  <Button size="small" onClick={() => deleteMblDoc(d.id)} sx={{ minWidth: 0, color: '#EF4444' }}>
                    <DeleteOutline fontSize="small" />
                  </Button>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          disabled={saving}
          sx={{ bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#EAB308' }, px: 4 }}
        >
          {saving ? 'Guardando...' : id ? 'Actualizar Contenedor' : 'Crear Contenedor LCL'}
        </Button>
      </Box>
    </Box>
  )
}
