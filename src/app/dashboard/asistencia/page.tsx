'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  LinearProgress, Snackbar, Alert, TextField, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import {
  Login, Logout, Restaurant, FreeBreakfast, Coffee, AccessTime,
  CalendarMonth, Groups, EmojiEvents, Favorite, Schedule,
} from '@mui/icons-material'

// ── Theme tokens (TP light) ──────────────────────────────────────────────
const C = {
  pageBg: '#FAFAF9',
  card: '#FFFFFF',
  border: '1px solid #E7E5E4',
  text: '#0A0A0A',
  textMid: '#78716C',
  textSoft: '#A8A29E',
  yellow: '#FACC15',
  activeBg: '#FEF3C7',
  green: '#16A34A',
  amber: '#D97706',
  blue: '#2563EB',
  red: '#DC2626',
  dark: '#1C1917',
}
const HEADING = '"Space Grotesk", "Inter", sans-serif'
const TZ = 'America/Panama'

// ── Types ────────────────────────────────────────────────────────────────
type ShiftStatus = 'OUT' | 'WORKING' | 'LUNCH' | 'FINISHED'
type NextAction = 'CLOCK_IN' | 'LUNCH_OUT' | 'LUNCH_IN' | 'CLOCK_OUT' | 'DONE'

interface Shift {
  id: string
  userId: string
  userName: string
  workDate: string
  clockIn: string | null
  lunchStart: string | null
  lunchEnd: string | null
  clockOut: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}
interface AsistenciaState {
  shift: Shift | null
  today: string
  nextAction: NextAction
  status: ShiftStatus
}
interface ReportShift extends Shift {
  workedMinutes: number
  lunchMinutes: number
}

// ── Wellness tips ────────────────────────────────────────────────────────
const WELLNESS_TIPS = [
  'Párate y estírate por un minuto 🧍',
  'Haz una pausa activa 🤸',
  'Toma agua, hidrátate 💧',
  'Descansa la vista: mira a lo lejos 20s 👀',
  'Respira profundo 3 veces 🌬️',
  'Relaja los hombros y la espalda 🪑',
  'Camina un poco para reactivar la circulación 🚶',
  'Buen momento para un café o té ☕',
  'Estira el cuello con suavidad, lado a lado 🙆',
  'Sonríe, hoy lo estás haciendo muy bien 😊',
]

// ── Status visuals ───────────────────────────────────────────────────────
const STATUS_META: Record<ShiftStatus, { label: string; color: string; bg: string }> = {
  OUT: { label: 'Fuera de turno', color: C.textMid, bg: '#F5F5F4' },
  WORKING: { label: 'Trabajando', color: C.green, bg: '#F0FDF4' },
  LUNCH: { label: 'En almuerzo', color: C.amber, bg: '#FFFBEB' },
  FINISHED: { label: 'Jornada finalizada', color: C.blue, bg: '#EFF6FF' },
}

const ACTION_META: Record<NextAction, { label: string; color: string; hover: string; icon: React.ReactNode } | null> = {
  CLOCK_IN: { label: 'Marcar Entrada', color: C.green, hover: '#15803D', icon: <Login /> },
  LUNCH_OUT: { label: 'Salir a Almuerzo', color: C.amber, hover: '#B45309', icon: <Restaurant /> },
  LUNCH_IN: { label: 'Regresar de Almuerzo', color: C.blue, hover: '#1D4ED8', icon: <FreeBreakfast /> },
  CLOCK_OUT: { label: 'Marcar Salida', color: C.dark, hover: '#000000', icon: <Logout /> },
  DONE: null,
}

const CONFIRM_META: Record<Exclude<NextAction, 'DONE'>, { title: string; body: string; confirm: string }> = {
  CLOCK_IN: {
    title: '¿Marcar tu entrada?',
    body: 'Vas a registrar tu hora de entrada. ¿Continuar?',
    confirm: 'Sí, marcar entrada',
  },
  LUNCH_OUT: {
    title: '¿Salir a almuerzo?',
    body: 'Vas a registrar tu salida a almuerzo. ¿Continuar?',
    confirm: 'Sí, salir a almuerzo',
  },
  LUNCH_IN: {
    title: '¿Regresar de almuerzo?',
    body: 'Vas a registrar tu regreso de almuerzo. ¿Continuar?',
    confirm: 'Sí, regresar de almuerzo',
  },
  CLOCK_OUT: {
    title: '¿Marcar tu salida?',
    body: 'Vas a registrar tu salida y finalizar tu jornada. ¿Estás seguro?',
    confirm: 'Sí, marcar salida',
  },
}

const SUCCESS_MSG: Record<Exclude<NextAction, 'DONE'>, string> = {
  CLOCK_IN: '¡Entrada registrada! Que tengas un gran día 💪',
  LUNCH_OUT: '¡Buen provecho! Disfruta tu almuerzo 🍽️',
  LUNCH_IN: '¡De vuelta! A seguir con buena energía ⚡',
  CLOCK_OUT: '¡Salida registrada! Descansa, te lo ganaste 🌙',
}

// ── Helpers ──────────────────────────────────────────────────────────────
const fmtTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('es-PA', {
        timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—'

const fmtHM = (mins: number) => {
  if (!mins || mins <= 0) return '0h 0m'
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return `${h}h ${m}m`
}

// Worked minutes from a shift, given an optional "now" for live counting
const workedMinutes = (s: Shift, now: number): number => {
  if (!s.clockIn) return 0
  const start = new Date(s.clockIn).getTime()
  const end = s.clockOut ? new Date(s.clockOut).getTime() : now
  let ms = end - start
  if (s.lunchStart) {
    const ls = new Date(s.lunchStart).getTime()
    const le = s.lunchEnd ? new Date(s.lunchEnd).getTime() : now
    ms -= Math.max(0, le - ls)
  }
  return Math.max(0, Math.floor(ms / 60000))
}

export default function AsistenciaPage() {
  const { data: session, status: authStatus } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [state, setState] = useState<AsistenciaState | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'info' } | null>(null)
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * WELLNESS_TIPS.length))
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── Live clock (every second) ──
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Rotate wellness tip every 25s ──
  useEffect(() => {
    const id = setInterval(() => {
      setTipIdx(i => (i + 1) % WELLNESS_TIPS.length)
    }, 25000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch state ──
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/asistencia')
      if (r.ok) setState(await r.json())
    } catch { /* noop */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'authenticated') load()
  }, [authStatus, load])

  // ── Gentle periodic wellness toast while WORKING (every 15 min) ──
  const statusRef = useRef<ShiftStatus | undefined>(undefined)
  statusRef.current = state?.status
  useEffect(() => {
    const id = setInterval(() => {
      if (statusRef.current === 'WORKING') {
        setSnack({
          msg: WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)],
          sev: 'info',
        })
      }
    }, 15 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // ── Open confirmation dialog (does NOT punch yet) ──
  const requestAction = () => {
    if (!state || state.nextAction === 'DONE') return
    setConfirmOpen(true)
  }

  // ── Punch action (runs only on confirm) ──
  const handleAction = async () => {
    if (!state || state.nextAction === 'DONE') return
    const action = state.nextAction
    setSubmitting(true)
    try {
      const r = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (r.ok) {
        setState(await r.json())
        setSnack({ msg: SUCCESS_MSG[action as Exclude<NextAction, 'DONE'>], sev: 'success' })
        setConfirmOpen(false)
      } else {
        setSnack({ msg: 'No se pudo registrar la marca. Intenta de nuevo.', sev: 'info' })
      }
    } catch {
      setSnack({ msg: 'Error de conexión. Intenta de nuevo.', sev: 'info' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Live big clock strings ──
  const clockStr = now.toLocaleTimeString('es-PA', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  })
  const dateStr = now.toLocaleDateString('es-PA', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const dateStrCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  if (authStatus === 'loading' || loading) {
    return (
      <Box>
        <Typography sx={{ fontFamily: HEADING, fontWeight: 700, fontSize: '1.6rem', color: C.text, mb: 2 }}>
          Reporte de Entrada y Salida
        </Typography>
        <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: C.yellow } }} />
      </Box>
    )
  }

  const sMeta = STATUS_META[state?.status ?? 'OUT']
  const aMeta = state ? ACTION_META[state.nextAction] : null
  const shift = state?.shift ?? null
  const liveWorked = shift ? workedMinutes(shift, now.getTime()) : 0

  const timeline = [
    { key: 'clockIn', label: 'Entrada', icon: <Login sx={{ fontSize: 18 }} />, time: shift?.clockIn ?? null, color: C.green },
    { key: 'lunchStart', label: 'Salida a almuerzo', icon: <Restaurant sx={{ fontSize: 18 }} />, time: shift?.lunchStart ?? null, color: C.amber },
    { key: 'lunchEnd', label: 'Regreso de almuerzo', icon: <FreeBreakfast sx={{ fontSize: 18 }} />, time: shift?.lunchEnd ?? null, color: C.blue },
    { key: 'clockOut', label: 'Salida', icon: <Logout sx={{ fontSize: 18 }} />, time: shift?.clockOut ?? null, color: C.dark },
  ]

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 0.4 }}>
          <AccessTime sx={{ color: C.yellow, fontSize: 28 }} />
          <Typography sx={{ fontFamily: HEADING, fontWeight: 700, fontSize: { xs: '1.4rem', sm: '1.7rem' }, color: C.text, letterSpacing: '-0.02em' }}>
            Reporte de Entrada y Salida
          </Typography>
        </Box>
        <Typography sx={{ color: C.textMid, fontSize: '0.92rem' }}>
          Marca tu jornada y cuídate durante el día.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* ── Clock + Status ── */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: '16px', border: C.border, boxShadow: 'none', bgcolor: C.card, height: '100%' }}>
            <CardContent sx={{ p: 3.5, textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography sx={{ color: C.textSoft, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                Hora actual · Panamá
              </Typography>
              <Typography sx={{ fontFamily: HEADING, fontWeight: 700, fontSize: { xs: '2.6rem', sm: '3.2rem' }, color: C.text, lineHeight: 1.05, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {clockStr}
              </Typography>
              <Typography sx={{ color: C.textMid, fontSize: '0.9rem', mt: 0.5 }}>
                {dateStrCap}
              </Typography>

              <Divider sx={{ my: 2.5, borderColor: '#F5F5F4' }} />

              <Typography sx={{ color: C.textSoft, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.2 }}>
                Estado
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Chip
                  label={sMeta.label}
                  sx={{
                    bgcolor: sMeta.bg,
                    color: sMeta.color,
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    py: 2.4,
                    px: 1.2,
                    borderRadius: '999px',
                    border: `1px solid ${sMeta.color}22`,
                  }}
                />
              </Box>

              {shift?.clockIn && (
                <Typography sx={{ mt: 2, color: C.textMid, fontSize: '0.85rem' }}>
                  Tiempo trabajado:{' '}
                  <Box component="span" sx={{ fontWeight: 800, color: C.text }}>
                    {fmtHM(liveWorked)}
                  </Box>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Timeline + Action ── */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: '16px', border: C.border, boxShadow: 'none', bgcolor: C.card, height: '100%' }}>
            <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography sx={{ fontFamily: HEADING, fontWeight: 700, fontSize: '1.05rem', color: C.text, mb: 2 }}>
                Tu jornada de hoy
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2.5 }}>
                {timeline.map((t, i) => {
                  const done = !!t.time
                  return (
                    <Box key={t.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.6, py: 0.9 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: '12px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: done ? `${t.color}14` : '#F5F5F4',
                        color: done ? t.color : C.textSoft,
                      }}>
                        {t.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: done ? C.text : C.textMid }}>
                          {t.label}
                        </Typography>
                      </Box>
                      <Typography sx={{
                        fontWeight: 800, fontSize: '0.95rem',
                        color: done ? C.text : C.textSoft,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {fmtTime(t.time)}
                      </Typography>
                    </Box>
                  )
                })}
              </Box>

              {/* Schedule note */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                px: 1.6, py: 1.2, mb: 2,
                borderRadius: '12px',
                bgcolor: '#F5F5F4',
                border: C.border,
              }}>
                <Schedule sx={{ fontSize: 18, color: C.textMid, flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.82rem', color: C.textMid, fontWeight: 600 }}>
                  Horario: 9:00 a.m. – 6:00 p.m. · 1 hora de almuerzo
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }} />

              {/* Primary action */}
              {aMeta ? (
                <Button
                  fullWidth
                  onClick={requestAction}
                  disabled={submitting}
                  startIcon={aMeta.icon}
                  sx={{
                    bgcolor: aMeta.color,
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    py: 1.6,
                    borderRadius: '14px',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: aMeta.hover, boxShadow: 'none' },
                    '&.Mui-disabled': { bgcolor: aMeta.color, opacity: 0.6, color: '#FFFFFF' },
                  }}
                >
                  {submitting ? 'Registrando…' : aMeta.label}
                </Button>
              ) : (
                <Box sx={{
                  textAlign: 'center', py: 2.2, borderRadius: '14px',
                  bgcolor: '#EFF6FF', border: '1px solid #DBEAFE',
                }}>
                  <EmojiEvents sx={{ color: C.blue, fontSize: 30, mb: 0.5 }} />
                  <Typography sx={{ fontWeight: 800, color: C.blue, fontSize: '1rem' }}>
                    Ya completaste tu jornada de hoy 🎉
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Wellness ── */}
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: '16px', border: '1px solid #FDE68A', boxShadow: 'none',
            bgcolor: C.activeBg,
          }}>
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.2 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: '#FFFFFF', color: C.amber, border: '1px solid #FDE68A',
              }}>
                <Favorite />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B45309', mb: 0.4 }}>
                  Bienestar
                </Typography>
                <Typography sx={{ fontFamily: HEADING, fontWeight: 600, fontSize: { xs: '1.05rem', sm: '1.2rem' }, color: '#78350F', lineHeight: 1.3 }}>
                  {WELLNESS_TIPS[tipIdx]}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Admin: team report ── */}
        {isAdmin && (
          <Grid item xs={12}>
            <AdminReport />
          </Grid>
        )}
      </Grid>

      {/* Confirmation dialog */}
      {aMeta && state && state.nextAction !== 'DONE' && (() => {
        const cMeta = CONFIRM_META[state.nextAction as Exclude<NextAction, 'DONE'>]
        return (
          <Dialog
            open={confirmOpen}
            onClose={() => { if (!submitting) setConfirmOpen(false) }}
            PaperProps={{ sx: { borderRadius: '16px', border: C.border, maxWidth: 420 } }}
          >
            <DialogTitle sx={{
              fontFamily: HEADING, fontWeight: 700, fontSize: '1.15rem', color: C.text,
              display: 'flex', alignItems: 'center', gap: 1.2, pb: 1,
            }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: `${aMeta.color}14`, color: aMeta.color,
              }}>
                {aMeta.icon}
              </Box>
              {cMeta.title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: C.textMid, fontSize: '0.95rem' }}>
                {cMeta.body}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                sx={{
                  textTransform: 'none', fontWeight: 700, color: C.textMid,
                  borderRadius: '10px', px: 2,
                  '&:hover': { bgcolor: '#F5F5F4' },
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAction}
                disabled={submitting}
                startIcon={aMeta.icon}
                sx={{
                  bgcolor: aMeta.color, color: '#FFFFFF',
                  textTransform: 'none', fontWeight: 800,
                  borderRadius: '10px', px: 2.2, boxShadow: 'none',
                  '&:hover': { bgcolor: aMeta.hover, boxShadow: 'none' },
                  '&.Mui-disabled': { bgcolor: aMeta.color, opacity: 0.6, color: '#FFFFFF' },
                }}
              >
                {submitting ? 'Registrando…' : cMeta.confirm}
              </Button>
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* Snackbar */}
      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack?.sev === 'info' ? 'info' : 'success'}
          variant="filled"
          onClose={() => setSnack(null)}
          icon={snack?.sev === 'info' ? <Coffee fontSize="inherit" /> : undefined}
          sx={{
            borderRadius: '12px', fontWeight: 600,
            bgcolor: snack?.sev === 'info' ? C.amber : C.green,
          }}
        >
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ── Admin team report ────────────────────────────────────────────────────
function todayPanama(): string {
  // YYYY-MM-DD in Panama timezone
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  return parts
}

function AdminReport() {
  const [date, setDate] = useState(() => todayPanama())
  const [shifts, setShifts] = useState<ReportShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/asistencia/report?date=${date}`)
      .then(r => (r.ok ? r.json() : { shifts: [] }))
      .then(d => { if (active) setShifts(d.shifts || []) })
      .catch(() => { if (active) setShifts([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date])

  const statusOf = (s: ReportShift): { label: string; color: string; bg: string } => {
    if (s.clockOut) return { label: 'Finalizada', color: C.blue, bg: '#EFF6FF' }
    if (s.lunchStart && !s.lunchEnd) return { label: 'En almuerzo', color: C.amber, bg: '#FFFBEB' }
    if (s.clockIn) return { label: 'Trabajando', color: C.green, bg: '#F0FDF4' }
    return { label: 'Sin marcar', color: C.textMid, bg: '#F5F5F4' }
  }

  const cellSx = { fontSize: '0.85rem', color: C.text, fontVariantNumeric: 'tabular-nums' as const, borderColor: '#F5F5F4' }
  const headSx = { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: C.textMid, borderColor: '#E7E5E4' }

  return (
    <Card sx={{ borderRadius: '16px', border: C.border, boxShadow: 'none', bgcolor: C.card }}>
      <CardContent sx={{ p: 3.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Groups sx={{ color: C.yellow }} />
            <Typography sx={{ fontFamily: HEADING, fontWeight: 700, fontSize: '1.1rem', color: C.text }}>
              Reporte del equipo
            </Typography>
          </Box>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={e => setDate(e.target.value)}
            InputProps={{ startAdornment: <CalendarMonth sx={{ fontSize: 18, color: C.textMid, mr: 1 }} /> }}
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' },
              '& fieldset': { borderColor: '#E7E5E4' },
            }}
          />
        </Box>

        {loading ? (
          <LinearProgress sx={{ borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: C.yellow } }} />
        ) : shifts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: C.textSoft }}>
            <Groups sx={{ fontSize: 44, opacity: 0.35, mb: 1 }} />
            <Typography sx={{ fontSize: '0.92rem', color: C.textMid }}>
              Sin registros para esta fecha.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Trabajador</TableCell>
                  <TableCell sx={headSx} align="center">Entrada</TableCell>
                  <TableCell sx={headSx} align="center">Sal. almuerzo</TableCell>
                  <TableCell sx={headSx} align="center">Regreso</TableCell>
                  <TableCell sx={headSx} align="center">Salida</TableCell>
                  <TableCell sx={headSx} align="center">Horas</TableCell>
                  <TableCell sx={headSx} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map(s => {
                  const st = statusOf(s)
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{s.userName}</TableCell>
                      <TableCell sx={cellSx} align="center">{fmtTime(s.clockIn)}</TableCell>
                      <TableCell sx={cellSx} align="center">{fmtTime(s.lunchStart)}</TableCell>
                      <TableCell sx={cellSx} align="center">{fmtTime(s.lunchEnd)}</TableCell>
                      <TableCell sx={cellSx} align="center">{fmtTime(s.clockOut)}</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }} align="center">{fmtHM(s.workedMinutes)}</TableCell>
                      <TableCell sx={cellSx} align="center">
                        <Chip
                          label={st.label}
                          size="small"
                          sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}
