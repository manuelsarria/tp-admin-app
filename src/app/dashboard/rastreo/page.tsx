'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Typography, TextField, Button, Chip, InputAdornment, Alert } from '@mui/material'
import { Search, LocalShipping } from '@mui/icons-material'

/* ── Ship Canvas Animation ─────────────────────────────────── */
function ShipAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = (canvas.width = 800)
    const H = (canvas.height = 180)
    let frame = 0
    let raf: number

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a1628'); sky.addColorStop(0.5, '#1a3a5c'); sky.addColorStop(1, '#2980b9')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)

      // Stars
      ctx.fillStyle = '#fff'
      for (let i = 0; i < 20; i++) {
        const x = (i * 137.5 + frame * 0.1) % W, y = 10 + (i * 23) % 60
        ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.02 + i))
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1

      // Waves
      for (let w = 0; w < 3; w++) {
        ctx.beginPath(); ctx.moveTo(0, H)
        for (let x = 0; x <= W; x += 4) {
          const y = H - 35 + w * 10 + Math.sin((x + frame * (2 - w * 0.5)) * 0.015) * (7 - w * 2) + Math.sin((x + frame * (1.5 + w)) * 0.008) * 4
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H); ctx.closePath()
        ctx.fillStyle = `rgba(255,255,255,${0.06 + w * 0.03})`; ctx.fill()
      }

      // Ship
      const shipX = 100 + ((frame * 1.2) % (W - 250)), shipY = H - 55 + Math.sin(frame * 0.04) * 3
      ctx.save(); ctx.translate(shipX + 60, shipY + 14); ctx.rotate(Math.sin(frame * 0.04) * 0.02)
      ctx.translate(-(shipX + 60), -(shipY + 14))

      ctx.beginPath(); ctx.moveTo(shipX - 10, shipY + 14); ctx.lineTo(shipX + 130, shipY + 14)
      ctx.lineTo(shipX + 120, shipY + 28); ctx.lineTo(shipX, shipY + 28); ctx.closePath()
      ctx.fillStyle = '#1a1a2e'; ctx.fill()
      ctx.fillStyle = '#FACC15'; ctx.fillRect(shipX + 5, shipY, 115, 14)

      const colors = ['#3b82f6', '#f59e0b', '#10b981', '#FACC15', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
      for (let row = 0; row < 2; row++) for (let col = 0; col < 6; col++) {
        ctx.fillStyle = colors[(row * 6 + col) % 8]
        ctx.fillRect(shipX + 10 + col * 16, shipY - 12 - row * 11, 14, 10)
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5
        ctx.strokeRect(shipX + 10 + col * 16, shipY - 12 - row * 11, 14, 10)
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(shipX + 95, shipY - 22, 20, 22)
      ctx.fillStyle = '#87ceeb'; ctx.fillRect(shipX + 98, shipY - 18, 14, 8)
      ctx.fillStyle = '#333'; ctx.fillRect(shipX + 100, shipY - 34, 8, 12)

      for (let p = 0; p < 3; p++) {
        ctx.globalAlpha = 0.3 - p * 0.1; ctx.fillStyle = '#ccc'
        ctx.beginPath(); ctx.arc(shipX + 104 + p * 8 + Math.sin(frame * 0.05 + p) * 4, shipY - 38 - p * 10 - (frame * 0.3 + p * 5) % 30, 4 + p * 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1; ctx.restore()

      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '600 13px Arial'; ctx.textAlign = 'center'
      ctx.fillText('Buscando tu paquete' + '.'.repeat((Math.floor(frame / 20) % 3) + 1), W / 2, H - 8)
      frame++; raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} style={{ width: '100%', height: 180, borderRadius: 12, display: 'block' }} />
}

/* ── Stepper ─────────────────────────────────────────────── */
function TrackingStepper({ status }: { status: string }) {
  const steps = [
    { id: 'RECEIVED_IN_WAREHOUSE', label: 'Recibido en Bodega', icon: '📦' },
    { id: 'IN_TRANSIT', label: 'En Tránsito', icon: '🚢' },
    { id: 'ARRIVED_PANAMA', label: 'Llegado a Panamá', icon: '🏭' },
    { id: 'READY_FOR_DELIVERY', label: 'Listo para Entrega', icon: '✅' },
  ]
  const idx = steps.findIndex(s => s.id === status)
  const pct = idx >= 0 ? (idx / (steps.length - 1)) * 100 : 0

  return (
    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', my: 5, px: 1 }}>
      <Box sx={{ position: 'absolute', top: 24, left: '10%', right: '10%', height: 4, bgcolor: '#E5E7EB', borderRadius: 2, zIndex: 0 }} />
      <Box sx={{ position: 'absolute', top: 24, left: '10%', height: 4, background: 'linear-gradient(90deg, #FACC15, #ff4444)', borderRadius: 2, zIndex: 1, width: `${pct * 0.8}%`, transition: 'width 1s ease' }} />
      {steps.map((s, i) => {
        const done = i < idx, active = i === idx
        return (
          <Box key={s.id} sx={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
            <Box sx={{
              width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 1, fontSize: '1.2rem', transition: 'all 0.5s',
              background: done ? 'linear-gradient(135deg, #FACC15, #ff4444)' : active ? '#fff' : '#F9FAFB',
              border: `3px solid ${done || active ? '#FACC15' : '#E5E7EB'}`,
              color: done ? '#fff' : '#6B7280',
              boxShadow: active ? '0 0 0 6px rgba(227,6,19,0.15)' : done ? '0 4px 12px rgba(227,6,19,0.25)' : 'none',
            }}>
              {done ? '✓' : s.icon}
            </Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: done || active ? 700 : 500, color: done || active ? '#0F172A' : '#9CA3AF' }}>
              {s.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

const STATUS_MSG: Record<string, string> = {
  RECEIVED_IN_WAREHOUSE: 'Tu paquete ha sido recibido en nuestra bodega en China',
  IN_TRANSIT: 'Tu paquete está en tránsito hacia Panamá',
  ARRIVED_PANAMA: 'Tu paquete ha llegado a Panamá y está en aduana',
  READY_FOR_DELIVERY: 'Tu paquete está listo para ser entregado',
}

/* ── Detail Row ──────────────────────────────────────────── */
function DetailRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
      p: '14px 20px', borderRadius: 3, gap: 1.5,
      bgcolor: highlight ? '#FEF2F2' : '#F8FAFC',
      borderLeft: `4px solid ${highlight ? '#FACC15' : '#10B981'}`,
    }}>
      <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.88rem' }}>{icon} {label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{value}</Typography>
    </Box>
  )
}

/* ── Main Page ───────────────────────────────────────────── */
export default function RastreoPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (result) setTimeout(() => setShow(true), 50)
    else setShow(false)
  }, [result])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setResult(null)
    if (!query.trim()) { setError('Ingresa un número de tracking.'); return }
    setLoading(true)
    try {
      const [res] = await Promise.all([
        fetch(`/api/tracking-internal?q=${encodeURIComponent(query.trim())}`),
        new Promise(r => setTimeout(r, 2500)),
      ])
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.error || 'No encontrado')
    } catch { setError('Error de conexión') }
    finally { setLoading(false) }
  }

  const ready = result?.status === 'READY_FOR_DELIVERY'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <LocalShipping sx={{ color: '#FACC15', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Rastreo de Paquete</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
        Busca por número de tracking, casillero, código adicional o contenedor.
      </Typography>

      {/* Search */}
      <Box component="form" onSubmit={handleSearch} sx={{
        display: 'flex', gap: 0, maxWidth: 700, mb: 3, borderRadius: 3, overflow: 'hidden',
        border: '2px solid #E5E7EB', '&:focus-within': { borderColor: '#FACC15', boxShadow: '0 0 0 3px rgba(227,6,19,0.1)' },
        transition: 'all 0.2s',
      }}>
        <TextField
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tracking, casillero, código o contenedor..."
          fullWidth
          size="small"
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
            sx: { border: 'none', '& fieldset': { border: 'none' }, fontWeight: 500, fontSize: '1rem' },
          }}
        />
        <Button type="submit" variant="contained" disabled={loading} sx={{
          bgcolor: '#FACC15', '&:hover': { bgcolor: '#C00510' }, borderRadius: 0, px: 4, fontWeight: 700,
          textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {loading ? 'Buscando...' : 'Rastrear'}
        </Button>
      </Box>

      {/* Loading animation */}
      {loading && <Box sx={{ maxWidth: 700 }}><ShipAnimation /></Box>}

      {/* Error */}
      {error && <Alert severity="error" sx={{ maxWidth: 700, borderRadius: 2 }}>{error}</Alert>}

      {/* Results */}
      {result && (
        <Box sx={{
          maxWidth: 700,
          opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', mb: 0.5 }}>Estado del Paquete</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                <strong style={{ color: '#334155' }}>Tracking:</strong> {result.trackingWarehouse}
              </Typography>
              {result.mailbox && (
                <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#334155' }}>Casillero:</strong> {result.mailbox}
                </Typography>
              )}
              {result.companyName && (
                <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#334155' }}>Empresa:</strong> {result.companyName}
                </Typography>
              )}
            </Box>
            <Chip
              label={result.transportType === 'AIR' ? '✈️ Aéreo' : '🚢 Marítimo'}
              sx={{
                fontWeight: 700, fontSize: '0.9rem', px: 1,
                bgcolor: result.transportType === 'AIR' ? '#DBEAFE' : '#D1FAE5',
                color: result.transportType === 'AIR' ? '#1E40AF' : '#065F46',
              }}
            />
          </Box>

          <TrackingStepper status={result.status} />

          {/* Status message */}
          <Box sx={{
            p: '18px 24px', borderRadius: 3, textAlign: 'center', fontSize: '1rem', fontWeight: 700, mb: 3,
            bgcolor: ready ? '#ECFDF5' : '#FEF2F2',
            color: ready ? '#065F46' : '#7f1d1d',
            borderLeft: `5px solid ${ready ? '#059669' : '#FACC15'}`,
          }}>
            {STATUS_MSG[result.status] || 'Estado actualizado'}
          </Box>

          {/* Details */}
          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 3, p: 3, display: 'grid', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', mb: 0.5 }}>📋 Detalles</Typography>

            {result.fclCreatedAt && (
              <DetailRow icon={result.status === 'RECEIVED_IN_WAREHOUSE' ? '📦' : '✅'}
                label="Recibido en Bodega" value={fmtDate(result.fclCreatedAt)}
                highlight={result.status === 'RECEIVED_IN_WAREHOUSE'} />
            )}
            {result.departureDate && (
              <DetailRow icon={result.status === 'IN_TRANSIT' ? '🚢' : '✅'}
                label="Fecha de Embarque" value={fmtDate(result.departureDate)}
                highlight={result.status === 'IN_TRANSIT'} />
            )}
            {result.containerNumber && (
              <DetailRow icon="📦" label="Contenedor" value={result.containerNumber} />
            )}
            {result.totalCbm != null && (
              <DetailRow icon="📐" label="Volumen" value={`${result.totalCbm.toFixed(3)} CBM`} />
            )}
            {result.totalWeight != null && (
              <DetailRow icon="⚖️" label="Peso" value={`${result.totalWeight.toFixed(1)} kg`} />
            )}
            {result.eta && !result.statusHistory?.find((h: any) => h.status === 'ARRIVED_PANAMA') && (
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
                p: '14px 20px', borderRadius: 3, gap: 1.5,
                bgcolor: '#FFFBEB', border: '1px dashed #F59E0B', borderLeft: '4px solid #F59E0B',
              }}>
                <Typography sx={{ color: '#92400E', fontWeight: 600, fontSize: '0.88rem' }}>🕐 Llegada Estimada</Typography>
                <Typography sx={{ color: '#92400E', fontWeight: 700, fontSize: '0.88rem' }}>{fmtDate(result.eta)}</Typography>
              </Box>
            )}
            {result.statusHistory?.find((h: any) => h.status === 'ARRIVED_PANAMA') && (
              <DetailRow icon={result.status === 'ARRIVED_PANAMA' ? '🏭' : '✅'}
                label="Llegada a Panamá" value={fmtDate(result.statusHistory.find((h: any) => h.status === 'ARRIVED_PANAMA').changedAt)}
                highlight={result.status === 'ARRIVED_PANAMA'} />
            )}
            {ready && (
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
                p: '14px 20px', borderRadius: 3, gap: 1.5,
                bgcolor: '#ECFDF5', borderLeft: '4px solid #059669',
              }}>
                <Typography sx={{ color: '#065F46', fontWeight: 600, fontSize: '0.88rem' }}>✅ Listo para Entrega</Typography>
                <Typography sx={{ color: '#059669', fontWeight: 700, fontSize: '0.88rem' }}>Disponible para retiro</Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
