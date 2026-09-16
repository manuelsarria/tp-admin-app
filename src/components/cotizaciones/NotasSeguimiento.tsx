'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, CircularProgress,
} from '@mui/material'
import { Close, StickyNote2 } from '@mui/icons-material'

export type QuoteNoteEntity = 'QUOTE' | 'FAST_QUOTE' | 'INSURANCE_QUOTE'

export interface QuoteNote {
  id: string
  body: string
  createdAt: string
  createdById: string | null
  createdBy?: { id: string; name: string } | null
}

/** Cuándo se escribió, en corto: "hoy 3:40 p. m." o "12 sept, 9:15 a. m.". */
function cuando(iso: string): string {
  const d = new Date(iso)
  const hora = d.toLocaleTimeString('es-PA', { hour: 'numeric', minute: '2-digit' })
  const hoy = new Date()
  const mismoDia = d.toDateString() === hoy.toDateString()
  if (mismoDia) return `hoy ${hora}`
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, ${hora}`
}

/**
 * Hilo de notas de seguimiento de una cotización.
 *
 * Una nota guardada no se edita ni se borra: es el registro de quién llamó al
 * cliente y qué dijo. Si algo salió mal, se aclara con otra nota.
 */
export function NotasSeguimientoDialog({
  open, onClose, entity, entityId, titulo, onCountChange,
}: {
  open: boolean
  onClose: () => void
  entity: QuoteNoteEntity
  entityId: string | null
  /** Qué cotización es, para el encabezado (p. ej. "QT-MS/26-0050") */
  titulo?: string
  onCountChange?: (entityId: string, count: number) => void
}) {
  const [notes, setNotes] = useState<QuoteNote[]>([])
  const [loading, setLoading] = useState(false)
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // El padre pasa `onCountChange` como función nueva en cada render. Si `cargar`
  // dependiera de ella, avisar el contador haría re-renderizar al padre, que
  // daría otra función, que volvería a disparar la carga: el diálogo se quedaba
  // girando y pidiendo las notas sin parar. Por eso va en una ref.
  const avisarContador = useRef(onCountChange)
  useEffect(() => { avisarContador.current = onCountChange }, [onCountChange])

  const cargar = useCallback(async () => {
    if (!entityId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/quote-notes?entity=${entity}&entityId=${entityId}`, { cache: 'no-store' })
      const data = r.ok ? await r.json() : []
      setNotes(Array.isArray(data) ? data : [])
      avisarContador.current?.(entityId, Array.isArray(data) ? data.length : 0)
    } catch {
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [entity, entityId])

  useEffect(() => {
    if (open) { setTexto(''); setError(''); void cargar() }
  }, [open, cargar])

  const agregar = async () => {
    const body = texto.trim()
    if (!body || !entityId) return
    setGuardando(true)
    setError('')
    try {
      const r = await fetch('/api/quote-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, entityId, body }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo guardar la nota')
      const nueva: QuoteNote = await r.json()
      setNotes(prev => {
        const siguiente = [...prev, nueva]
        avisarContador.current?.(entityId, siguiente.length)
        return siguiente
      })
      setTexto('')
    } catch (e: any) {
      setError(e.message || 'Error al guardar la nota')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 1 }}>
        <StickyNote2 sx={{ color: '#FACC15' }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Notas de seguimiento</Typography>
          {titulo && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{titulo}</Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small"><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={26} /></Box>
        ) : notes.length === 0 ? (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', py: 2, textAlign: 'center' }}>
            Todavía no hay notas. Escribe la primera abajo.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 1 }}>
            {notes.map(n => (
              <Box key={n.id} sx={{
                p: 1.5, borderRadius: 2,
                bgcolor: '#FAFAF9',
                border: '1px solid #E5E7EB',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                    {n.createdBy?.name || 'Usuario'}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', flex: 1 }}>
                    {cuando(n.createdAt)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <TextField
          fullWidth multiline minRows={2}
          placeholder="Qué pasó con esta cotización: a quién llamaste, qué dijo, cuándo volver a llamar…"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            // Enter manda; Shift+Enter hace salto de línea
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void agregar() }
          }}
          sx={{ mt: 1 }}
        />
        <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', mt: 0.75 }}>
          Una nota guardada queda registrada: no se edita ni se borra. Si hay que corregir algo, se aclara con otra nota.
        </Typography>
        {error && (
          <Typography sx={{ color: 'error.main', fontSize: '0.8rem', mt: 1 }}>{error}</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cerrar</Button>
        <Button
          onClick={agregar}
          variant="contained"
          disabled={guardando || !texto.trim()}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {guardando ? 'Guardando...' : 'Agregar nota'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
