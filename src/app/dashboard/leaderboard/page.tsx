'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  keyframes,
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import BoltIcon from '@mui/icons-material/Bolt'
import PaidIcon from '@mui/icons-material/Paid'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

// ---------- Palette ----------
const BG = '#0A0A0A'
const SURFACE = '#141416'
const BORDER = '#27272A'
const YELLOW = '#FACC15'
const GREEN = '#22C55E'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const TEXT = '#FAFAFA'
const MUTED = '#A1A1AA'
const FONT_HEAD = '"Space Grotesk", "Inter", -apple-system, sans-serif'
const FONT_BODY = '"Inter", -apple-system, sans-serif'

// ---------- Types ----------
type Seller = {
  name: string
  system?: 'TP' | 'CNC'
  sales: number
  commission: number
  count: number
  pending: number
  paid: number
}
type Totals = {
  sales: number
  commission: number
  pending: number
  paid: number
  count: number
}
type Team = {
  tasksCompletedToday: number
  tasksPending: number
  tasksOverdue: number
  workingNow: number
  workingNames: string[]
}
type SystemBlock = {
  system: 'TP' | 'CNC'
  sellers: Seller[]
  totals: Totals
  team?: Team
} | null
type Combined = { sellers: Seller[]; totals: Totals }
type ApiResponse = {
  period: string
  generatedAt: string
  systems: { TP: SystemBlock; CNC: SystemBlock }
  combined: Combined
}

type Period = 'month' | 'today' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Mes',
  today: 'Hoy',
  all: 'Todo',
}

const MOTIVATIONAL = [
  '¡Cada venta cuenta! 🚀',
  'El equipo que mide, mejora 📈',
  '¡Vamos por más! 💪',
  'Hoy es un gran día para cerrar 🤝',
  'La constancia construye campeones 🏆',
  'Pequeños pasos, grandes resultados ✨',
  'Tu esfuerzo mueve montañas 🏔️',
  '¡A romperla, equipo! 🔥',
]

// ---------- Helpers ----------
const usd = (n: number | undefined | null) =>
  '$' +
  Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const num = (n: number | undefined | null) =>
  Number(n ?? 0).toLocaleString('en-US')

const MEDALS = ['🥇', '🥈', '🥉']

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.35; }
  100% { opacity: 1; }
`
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`
const shine = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

function systemColor(s?: 'TP' | 'CNC') {
  return s === 'CNC' ? RED : YELLOW
}

// ---------- Sub components ----------
function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <Box
      sx={{
        flex: '1 1 220px',
        minWidth: 200,
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        p: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        animation: `${fadeUp} 0.5s ease both`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 120% at 0% 0%, ${accent}22 0%, transparent 55%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
        <Typography
          sx={{
            color: MUTED,
            fontSize: 'clamp(0.7rem, 0.9vw, 0.95rem)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: FONT_BODY,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: TEXT,
          fontFamily: FONT_HEAD,
          fontWeight: 700,
          lineHeight: 1,
          fontSize: 'clamp(1.8rem, 3.4vw, 3.4rem)',
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

function PodiumCard({ seller, rank }: { seller: Seller; rank: number }) {
  const accent = systemColor(seller.system)
  const isFirst = rank === 0
  return (
    <Box
      sx={{
        flex: '1 1 240px',
        minWidth: 220,
        order: { xs: rank, md: rank === 0 ? 1 : rank === 1 ? 0 : 2 },
        bgcolor: SURFACE,
        border: `1px solid ${isFirst ? YELLOW : BORDER}`,
        borderRadius: 5,
        p: { xs: 2.5, md: 3 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transform: { md: isFirst ? 'scale(1.06)' : 'scale(1)' },
        boxShadow: isFirst ? `0 0 0 1px ${YELLOW}55, 0 20px 60px -20px ${YELLOW}55` : 'none',
        animation: `${fadeUp} 0.55s ease both`,
        '&::after': isFirst
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, transparent, ${YELLOW}, transparent)`,
              backgroundSize: '200% 100%',
              animation: `${shine} 3s linear infinite`,
            }
          : {},
      }}
    >
      <Typography sx={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', lineHeight: 1 }}>
        {MEDALS[rank]}
      </Typography>
      <Typography
        sx={{
          color: TEXT,
          fontFamily: FONT_HEAD,
          fontWeight: 700,
          fontSize: 'clamp(1.1rem, 1.8vw, 1.7rem)',
          mt: 1,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {seller.name}
      </Typography>
      <Chip
        label={seller.system ?? 'TP'}
        size="small"
        sx={{
          mt: 1,
          bgcolor: `${accent}1f`,
          color: accent,
          border: `1px solid ${accent}55`,
          fontWeight: 700,
          fontFamily: FONT_BODY,
        }}
      />
      <Typography
        sx={{
          color: YELLOW,
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 'clamp(1.8rem, 3.2vw, 3rem)',
          mt: 1.5,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {usd(seller.commission)}
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>
        comisión
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mt: 2,
          pt: 2,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <Box>
          <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: '1.05rem', fontFamily: FONT_HEAD }}>
            {usd(seller.sales)}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: '0.7rem', fontWeight: 600 }}>ventas</Typography>
        </Box>
        <Box>
          <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: '1.05rem', fontFamily: FONT_HEAD }}>
            {num(seller.count)}
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: '0.7rem', fontWeight: 600 }}>ops</Typography>
        </Box>
      </Box>
    </Box>
  )
}

function RankRow({ seller, rank }: { seller: Seller; rank: number }) {
  const accent = systemColor(seller.system)
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.5, md: 3 },
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        px: { xs: 2, md: 3 },
        py: { xs: 1.5, md: 2 },
        animation: `${fadeUp} 0.5s ease both`,
        transition: 'border-color .2s',
        '&:hover': { borderColor: '#3f3f46' },
      }}
    >
      <Typography
        sx={{
          color: MUTED,
          fontFamily: FONT_HEAD,
          fontWeight: 700,
          fontSize: 'clamp(1.1rem, 1.6vw, 1.6rem)',
          width: { xs: 32, md: 48 },
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {rank + 1}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: TEXT,
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontSize: 'clamp(1rem, 1.5vw, 1.5rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.02em',
          }}
        >
          {seller.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
          <Chip
            label={seller.system ?? 'TP'}
            size="small"
            sx={{
              height: 20,
              bgcolor: `${accent}1f`,
              color: accent,
              border: `1px solid ${accent}55`,
              fontWeight: 700,
              fontSize: '0.65rem',
            }}
          />
          <Typography sx={{ color: MUTED, fontSize: '0.8rem', fontWeight: 600 }}>
            {usd(seller.sales)} ventas · {num(seller.count)} ops
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography
          sx={{
            color: YELLOW,
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 'clamp(1.1rem, 1.9vw, 1.9rem)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {usd(seller.commission)}
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: '0.66rem', fontWeight: 600, mt: 0.3 }}>
          comisión
        </Typography>
      </Box>
    </Box>
  )
}

function SystemTotalsCard({
  title,
  accent,
  block,
}: {
  title: string
  accent: string
  block: SystemBlock
}) {
  const connected = !!block
  const t = block?.totals
  return (
    <Box
      sx={{
        flex: '1 1 320px',
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        p: { xs: 2.5, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        opacity: connected ? 1 : 0.7,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          sx={{
            color: accent,
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 'clamp(1.3rem, 2vw, 2rem)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        <Chip
          icon={
            <FiberManualRecordIcon sx={{ fontSize: '0.7rem !important', color: `${connected ? GREEN : RED} !important` }} />
          }
          label={connected ? 'conectado' : 'sin conexión'}
          size="small"
          sx={{
            bgcolor: connected ? `${GREEN}1a` : `${RED}1a`,
            color: connected ? GREEN : RED,
            border: `1px solid ${connected ? GREEN : RED}44`,
            fontWeight: 700,
            fontSize: '0.66rem',
          }}
        />
      </Box>
      {connected ? (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.4rem, 2.4vw, 2.4rem)', lineHeight: 1 }}>
              {usd(t?.sales)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>Ventas</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: YELLOW, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.4rem, 2.4vw, 2.4rem)', lineHeight: 1 }}>
              {usd(t?.commission)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>Comisión</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.4rem, 2.4vw, 2.4rem)', lineHeight: 1 }}>
              {num(t?.count)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: '0.78rem', fontWeight: 600, mt: 0.5 }}>Operaciones</Typography>
          </Box>
        </Box>
      ) : (
        <Typography sx={{ color: MUTED, fontSize: '0.95rem', fontWeight: 500 }}>
          Sistema aún no conectado. Pronto verás aquí las ventas de {title}.
        </Typography>
      )}
    </Box>
  )
}

function TeamStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  color: string
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1rem, 1.5vw, 1.5rem)', lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: '0.72rem', fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Box>
  )
}

// ---------- Page ----------
export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [clock, setClock] = useState('')
  const [motoIdx, setMotoIdx] = useState(0)
  const periodRef = useRef(period)
  periodRef.current = period

  const fetchData = useCallback(async (p: Period, soft = false) => {
    if (soft) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard/combined?period=${p}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('bad response')
      const json: ApiResponse = await res.json()
      if (periodRef.current === p) {
        setData(json)
        setError(false)
      }
    } catch {
      if (!soft) setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // initial + on period change
  useEffect(() => {
    fetchData(period, false)
  }, [period, fetchData])

  // auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => fetchData(periodRef.current, true), 60000)
    return () => clearInterval(id)
  }, [fetchData])

  // live clock (Panama)
  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat('es-PA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'America/Panama',
        }).format(new Date())
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // rotating motivation
  useEffect(() => {
    const id = setInterval(() => setMotoIdx((i) => (i + 1) % MOTIVATIONAL.length), 12000)
    return () => clearInterval(id)
  }, [])

  const updatedAt = useMemo(() => {
    if (!data?.generatedAt) return ''
    try {
      return new Intl.DateTimeFormat('es-PA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Panama',
      }).format(new Date(data.generatedAt))
    } catch {
      return ''
    }
  }, [data?.generatedAt])

  const handleFullscreen = () => {
    const el = document.documentElement
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const sellers = data?.combined.sellers ?? []
  const podium = sellers.slice(0, 3)
  const rest = sellers.slice(3)
  const totals = data?.combined.totals
  const team = data?.systems.TP?.team
  const hasSales = sellers.length > 0

  return (
    <Box
      sx={{
        minHeight: '100vh',
        m: { xs: -2, md: -3 },
        background: `radial-gradient(140% 100% at 50% -10%, #18181b 0%, ${BG} 55%)`,
        color: TEXT,
        fontFamily: FONT_BODY,
        p: { xs: 2, md: 4 },
      }}
    >
      {/* ---------- Top bar ---------- */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: { xs: 3, md: 4 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <EmojiEventsIcon sx={{ color: YELLOW, fontSize: 'clamp(2rem, 3.5vw, 3.4rem)' }} />
          <Box>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontWeight: 800,
                fontSize: 'clamp(1.5rem, 3.4vw, 3.2rem)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: TEXT,
              }}
            >
              Rendimiento del Equipo
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 'clamp(0.7rem, 1vw, 0.95rem)', fontWeight: 600, mt: 0.5 }}>
              Tu Pedido + CNC · {PERIOD_LABELS[period]}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2.5 }, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => v && setPeriod(v)}
            size="small"
            sx={{
              bgcolor: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: '999px',
              p: 0.5,
              '& .MuiToggleButton-root': {
                color: MUTED,
                border: 'none',
                borderRadius: '999px !important',
                px: 2.2,
                fontWeight: 700,
                fontFamily: FONT_BODY,
                '&.Mui-selected': {
                  bgcolor: YELLOW,
                  color: '#0A0A0A',
                  '&:hover': { bgcolor: YELLOW },
                },
                '&:hover': { color: TEXT },
              },
            }}
          >
            {(['month', 'today', 'all'] as Period[]).map((p) => (
              <ToggleButton key={p} value={p}>
                {PERIOD_LABELS[p]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(1rem, 1.6vw, 1.6rem)', color: TEXT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {clock}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, justifyContent: 'flex-end', mt: 0.4 }}>
              {refreshing && (
                <BoltIcon sx={{ fontSize: '0.9rem', color: YELLOW, animation: `${pulse} 1s ease-in-out infinite` }} />
              )}
              <Typography sx={{ color: MUTED, fontSize: '0.72rem', fontWeight: 600 }}>
                {refreshing ? 'actualizando…' : updatedAt ? `Actualizado ${updatedAt}` : '—'}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Pantalla completa">
            <IconButton
              onClick={handleFullscreen}
              sx={{
                color: TEXT,
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                '&:hover': { bgcolor: '#1f1f23', borderColor: YELLOW, color: YELLOW },
              }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ---------- Loading ---------- */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
          <CircularProgress sx={{ color: YELLOW }} size={56} />
          <Typography sx={{ color: MUTED, fontWeight: 600 }}>Cargando rendimiento…</Typography>
        </Box>
      )}

      {/* ---------- Error ---------- */}
      {!loading && error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 1.5 }}>
          <ErrorOutlineIcon sx={{ color: RED, fontSize: '3rem' }} />
          <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: '1.4rem' }}>
            No se pudo cargar el tablero
          </Typography>
          <Typography sx={{ color: MUTED }}>Reintentando automáticamente…</Typography>
        </Box>
      )}

      {/* ---------- Content ---------- */}
      {!loading && !error && data && (
        <>
          {/* HERO KPIs */}
          <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 }, flexWrap: 'wrap', mb: { xs: 3, md: 4 } }}>
            <KpiCard icon={<TrendingUpIcon sx={{ fontSize: '1.6rem' }} />} label="Ventas Totales" value={usd(totals?.sales)} accent={TEXT} />
            <KpiCard icon={<PaidIcon sx={{ fontSize: '1.6rem' }} />} label="Comisión Total" value={usd(totals?.commission)} accent={YELLOW} />
            <KpiCard icon={<HourglassBottomIcon sx={{ fontSize: '1.6rem' }} />} label="Comisión Pendiente" value={usd(totals?.pending)} accent={AMBER} />
            <KpiCard icon={<ReceiptLongIcon sx={{ fontSize: '1.6rem' }} />} label="Operaciones" value={num(totals?.count)} accent={GREEN} />
          </Box>

          {!hasSales ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '35vh',
                bgcolor: SURFACE,
                border: `1px dashed ${BORDER}`,
                borderRadius: 5,
                p: 4,
                textAlign: 'center',
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: '3rem' }}>🚀</Typography>
              <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(1.2rem, 2.2vw, 2rem)' }}>
                Aún no hay ventas registradas este periodo
              </Typography>
              <Typography sx={{ color: YELLOW, fontWeight: 700, fontSize: '1.1rem' }}>¡A vender! 🚀</Typography>
            </Box>
          ) : (
            <>
              {/* PODIUM */}
              {podium.length > 0 && (
                <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 }, flexWrap: 'wrap', mb: { xs: 3, md: 4 }, alignItems: 'stretch' }}>
                  {podium.map((s, i) => (
                    <PodiumCard key={`${s.name}-${s.system}`} seller={s} rank={i} />
                  ))}
                </Box>
              )}

              {/* REST RANKING */}
              {rest.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: { xs: 3, md: 4 } }}>
                  {rest.map((s, i) => (
                    <RankRow key={`${s.name}-${s.system}`} seller={s} rank={i + 3} />
                  ))}
                </Box>
              )}
            </>
          )}

          {/* PER-SYSTEM SPLIT */}
          <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 }, flexWrap: 'wrap', mb: { xs: 3, md: 4 } }}>
            <SystemTotalsCard title="TP" accent={YELLOW} block={data.systems.TP} />
            <SystemTotalsCard title="CNC" accent={RED} block={data.systems.CNC} />
          </Box>

          {/* TEAM ACTIVITY */}
          {team && (
            <Box
              sx={{
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                p: { xs: 2.5, md: 3 },
                mb: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupsIcon sx={{ color: YELLOW }} />
                <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(1rem, 1.5vw, 1.4rem)' }}>
                  Actividad del Equipo
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: { xs: 2.5, md: 5 }, flexWrap: 'wrap' }}>
                <TeamStat
                  icon={<BoltIcon sx={{ fontSize: '1.8rem' }} />}
                  value={
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                      {team.workingNow}
                      <FiberManualRecordIcon sx={{ fontSize: '0.7rem', color: GREEN, animation: `${pulse} 1.6s ease-in-out infinite` }} />
                    </Box>
                  }
                  label="Trabajando ahora"
                  color={GREEN}
                />
                <TeamStat icon={<CheckCircleIcon sx={{ fontSize: '1.8rem' }} />} value={team.tasksCompletedToday} label="Tareas completadas hoy" color={GREEN} />
                <TeamStat icon={<PendingActionsIcon sx={{ fontSize: '1.8rem' }} />} value={team.tasksPending} label="Pendientes" color={AMBER} />
                <TeamStat icon={<ErrorOutlineIcon sx={{ fontSize: '1.8rem' }} />} value={team.tasksOverdue} label="Vencidas" color={RED} />
              </Box>
              {team.workingNames?.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2.5 }}>
                  {team.workingNames.map((n) => (
                    <Chip
                      key={n}
                      label={n}
                      size="small"
                      sx={{ bgcolor: `${GREEN}14`, color: GREEN, border: `1px solid ${GREEN}33`, fontWeight: 700 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      {/* ---------- Motivational footer ---------- */}
      {!loading && (
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 2, md: 3 },
            mt: 1,
          }}
        >
          <Typography
            key={motoIdx}
            sx={{
              fontFamily: FONT_HEAD,
              fontWeight: 700,
              fontSize: 'clamp(1.1rem, 2.2vw, 2rem)',
              letterSpacing: '-0.02em',
              background: `linear-gradient(90deg, ${YELLOW}, #FDE68A, ${YELLOW})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${fadeUp} 0.6s ease both`,
            }}
          >
            {MOTIVATIONAL[motoIdx]}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
