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
  TextField,
  Button,
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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'

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

const PW_STORAGE_KEY = 'pantalla_pw'
const MUTE_STORAGE_KEY = 'pantalla_mute'

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

// ---------- Celebration animations ----------
const bannerPop = keyframes`
  0% { opacity: 0; transform: translateY(-18px) scale(0.85); }
  12% { opacity: 1; transform: translateY(0) scale(1.04); }
  20% { transform: translateY(0) scale(1); }
  85% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.96); }
`
const confettiFall = keyframes`
  0% { opacity: 0; transform: translateY(-12vh) rotate(0deg) scale(0.6); }
  10% { opacity: 1; }
  100% { opacity: 0; transform: translateY(96vh) rotate(540deg) scale(1.1); }
`
const CONFETTI_EMOJIS = ['🎉', '🎊', '🔔', '⭐', '💰', '🥳', '✨']

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
        flex: 1,
        minWidth: 0,
        height: '100%',
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        px: 'clamp(0.9rem, 1.6vw, 2rem)',
        py: 'clamp(0.6rem, 1.4vh, 1.6rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 'clamp(0.3rem, 0.8vh, 0.9rem)' }}>
        <Box sx={{ color: accent, display: 'flex' }}>{icon}</Box>
        <Typography
          sx={{
            color: MUTED,
            fontSize: 'clamp(0.62rem, 0.95vh, 0.95rem)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: FONT_BODY,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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
          fontSize: 'clamp(1.8rem, 4.5vh, 3.5rem)',
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
        flex: 1,
        minWidth: 0,
        height: '100%',
        order: rank === 0 ? 1 : rank === 1 ? 0 : 2,
        bgcolor: SURFACE,
        border: `1px solid ${isFirst ? YELLOW : BORDER}`,
        borderRadius: 4,
        px: 'clamp(0.8rem, 1.4vw, 2rem)',
        py: 'clamp(0.6rem, 1.4vh, 1.8rem)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        transform: isFirst ? 'scale(1.04)' : 'scale(1)',
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
      <Typography sx={{ fontSize: 'clamp(1.6rem, 4.5vh, 3.2rem)', lineHeight: 1 }}>
        {MEDALS[rank]}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'clamp(0.3rem, 0.8vh, 1rem)', maxWidth: '100%' }}>
        <Typography
          sx={{
            color: TEXT,
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontSize: 'clamp(1rem, 2.4vh, 1.8rem)',
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
            height: 20,
            flexShrink: 0,
            bgcolor: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}55`,
            fontWeight: 700,
            fontSize: '0.62rem',
            fontFamily: FONT_BODY,
          }}
        />
      </Box>
      <Typography
        sx={{
          color: YELLOW,
          fontFamily: FONT_HEAD,
          fontWeight: 800,
          fontSize: 'clamp(1.6rem, 4vh, 3rem)',
          mt: 'clamp(0.3rem, 0.8vh, 1rem)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {usd(seller.commission)}
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 0.9vh, 0.78rem)', fontWeight: 600, mt: 0.4 }}>
        {usd(seller.sales)} ventas · {num(seller.count)} ops
      </Typography>
    </Box>
  )
}

function RankRow({ seller, rank }: { seller: Seller; rank: number }) {
  const accent = systemColor(seller.system)
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.5, md: 2.5 },
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 2.5,
        px: 'clamp(0.9rem, 1.4vw, 2rem)',
        py: 'clamp(0.3rem, 0.8vh, 1.2rem)',
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
          fontSize: 'clamp(1rem, 2.2vh, 1.6rem)',
          width: { xs: 28, md: 44 },
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {rank + 1}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          sx={{
            color: TEXT,
            fontFamily: FONT_HEAD,
            fontWeight: 700,
            fontSize: 'clamp(0.95rem, 2vh, 1.5rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.02em',
            minWidth: 0,
          }}
        >
          {seller.name}
        </Typography>
        <Chip
          label={seller.system ?? 'TP'}
          size="small"
          sx={{
            height: 20,
            flexShrink: 0,
            bgcolor: `${accent}1f`,
            color: accent,
            border: `1px solid ${accent}55`,
            fontWeight: 700,
            fontSize: '0.62rem',
          }}
        />
        <Typography
          sx={{
            color: MUTED,
            fontSize: 'clamp(0.65rem, 1.2vh, 0.85rem)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          {usd(seller.sales)} ventas · {num(seller.count)} ops
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
        <Typography
          sx={{
            color: YELLOW,
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.4vh, 1.9rem)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {usd(seller.commission)}
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 0.9vh, 0.72rem)', fontWeight: 600 }}>
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
        flex: 1,
        minWidth: 0,
        height: '100%',
        bgcolor: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 3,
        px: 'clamp(0.9rem, 1.4vw, 2rem)',
        py: 'clamp(0.6rem, 1.2vh, 1.6rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        opacity: connected ? 1 : 0.7,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 'clamp(0.4rem, 1vh, 1.2rem)' }}>
        <Typography
          sx={{
            color: accent,
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 'clamp(1.1rem, 2.4vh, 2rem)',
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
            height: 22,
            bgcolor: connected ? `${GREEN}1a` : `${RED}1a`,
            color: connected ? GREEN : RED,
            border: `1px solid ${connected ? GREEN : RED}44`,
            fontWeight: 700,
            fontSize: '0.62rem',
          }}
        />
      </Box>
      {connected ? (
        <Box sx={{ display: 'flex', gap: 'clamp(1rem, 2vw, 2.5rem)' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.2rem, 2.8vh, 2.4rem)', lineHeight: 1 }}>
              {usd(t?.sales)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 0.9vh, 0.78rem)', fontWeight: 600, mt: 0.4 }}>Ventas</Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: YELLOW, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.2rem, 2.8vh, 2.4rem)', lineHeight: 1 }}>
              {usd(t?.commission)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 0.9vh, 0.78rem)', fontWeight: 600, mt: 0.4 }}>Comisión</Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1.2rem, 2.8vh, 2.4rem)', lineHeight: 1 }}>
              {num(t?.count)}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 0.9vh, 0.78rem)', fontWeight: 600, mt: 0.4 }}>Ops</Typography>
          </Box>
        </Box>
      ) : (
        <Typography sx={{ color: MUTED, fontSize: 'clamp(0.75rem, 1.2vh, 0.95rem)', fontWeight: 500 }}>
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 'clamp(1rem, 2.6vh, 1.6rem)', lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 1vh, 0.74rem)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</Typography>
      </Box>
    </Box>
  )
}

// ---------- Celebration overlay ----------
function CelebrationOverlay({
  sellerName,
  amount,
}: {
  sellerName?: string
  amount?: number
}) {
  // A dozen confetti pieces with deterministic-ish randomized positions/timing.
  const pieces = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
        left: Math.round((i / 14) * 92 + Math.random() * 6) + '%',
        delay: (Math.random() * 0.6).toFixed(2) + 's',
        dur: (1.8 + Math.random() * 1.4).toFixed(2) + 's',
        size: `clamp(1.4rem, ${2.4 + Math.random() * 2}vw, 3.2rem)`,
      })),
    []
  )

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Confetti */}
      {pieces.map((p, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: 0,
            left: p.left,
            fontSize: p.size,
            lineHeight: 1,
            animation: `${confettiFall} ${p.dur} ease-in ${p.delay} both`,
          }}
        >
          {p.emoji}
        </Box>
      ))}

      {/* Banner */}
      <Box
        sx={{
          animation: `${bannerPop} 3.6s ease both`,
          textAlign: 'center',
          px: 'clamp(2rem, 6vw, 6rem)',
          py: 'clamp(1.2rem, 3vh, 2.6rem)',
          borderRadius: 5,
          bgcolor: 'rgba(20,20,22,0.92)',
          border: `2px solid ${YELLOW}`,
          boxShadow: `0 0 0 1px ${YELLOW}55, 0 30px 90px -20px ${YELLOW}66`,
          maxWidth: '90vw',
        }}
      >
        <Typography
          sx={{
            fontFamily: FONT_HEAD,
            fontWeight: 900,
            fontSize: 'clamp(2rem, 7vh, 5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            background: `linear-gradient(90deg, ${YELLOW}, #FDE68A, ${YELLOW})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          🎉 ¡NUEVA VENTA! 🔔
        </Typography>
        {sellerName && (
          <Typography
            sx={{
              color: TEXT,
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 'clamp(1.1rem, 3.4vh, 2.4rem)',
              mt: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {sellerName}
          </Typography>
        )}
        {amount != null && (
          <Typography
            sx={{
              color: GREEN,
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 'clamp(1rem, 3vh, 2rem)',
              mt: 0.5,
            }}
          >
            {usd(amount)} 💰
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ---------- Password gate ----------
function PasswordGate({
  onSubmit,
  error,
  submitting,
}: {
  onSubmit: (pw: string) => void
  error: string
  submitting: boolean
}) {
  const [value, setValue] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pw = value.trim()
    if (pw) onSubmit(pw)
  }
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(140% 100% at 50% -10%, #18181b 0%, ${BG} 55%)`,
        color: TEXT,
        fontFamily: FONT_BODY,
        p: 3,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 5,
          p: { xs: 3.5, md: 5 },
          textAlign: 'center',
          animation: `${fadeUp} 0.5s ease both`,
          boxShadow: `0 30px 80px -30px #000`,
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: `${YELLOW}1a`,
            border: `1px solid ${YELLOW}44`,
            mb: 2.5,
          }}
        >
          <EmojiEventsIcon sx={{ color: YELLOW, fontSize: '2rem' }} />
        </Box>
        <Typography
          sx={{
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            letterSpacing: '-0.02em',
            color: TEXT,
            mb: 0.5,
          }}
        >
          Pantalla de Rendimiento
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: '0.9rem', fontWeight: 500, mb: 3 }}>
          Ingresa la contraseña para ver el tablero del equipo
        </Typography>

        <TextField
          type="password"
          fullWidth
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Contraseña"
          disabled={submitting}
          sx={{
            mb: error ? 1 : 2.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: BG,
              color: TEXT,
              borderRadius: 3,
              fontFamily: FONT_BODY,
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: '#3f3f46' },
              '&.Mui-focused fieldset': { borderColor: YELLOW },
            },
            '& input': { color: TEXT },
            '& input::placeholder': { color: MUTED, opacity: 1 },
          }}
        />

        {error && (
          <Typography sx={{ color: RED, fontSize: '0.85rem', fontWeight: 600, mb: 2, mt: 0.5 }}>
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={submitting || !value.trim()}
          sx={{
            bgcolor: YELLOW,
            color: '#0A0A0A',
            fontFamily: FONT_HEAD,
            fontWeight: 800,
            fontSize: '1.05rem',
            textTransform: 'none',
            borderRadius: 3,
            py: 1.3,
            '&:hover': { bgcolor: '#eab308' },
            '&.Mui-disabled': { bgcolor: '#3f3f46', color: MUTED },
          }}
        >
          {submitting ? (
            <CircularProgress size={22} sx={{ color: '#0A0A0A' }} />
          ) : (
            'Entrar'
          )}
        </Button>
      </Box>
    </Box>
  )
}

// ---------- Page ----------
export default function PantallaPage() {
  // auth state
  const [password, setPassword] = useState<string | null>(null)
  const [authed, setAuthed] = useState(false)
  const [gateError, setGateError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)
  const passwordRef = useRef<string | null>(null)
  passwordRef.current = password

  // board state
  const [period, setPeriod] = useState<Period>('month')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [clock, setClock] = useState('')
  const [motoIdx, setMotoIdx] = useState(0)
  const periodRef = useRef(period)
  periodRef.current = period

  // ---------- Celebration state ----------
  const [celebration, setCelebration] = useState<{
    sellerName?: string
    amount?: number
    key: number
  } | null>(null)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  mutedRef.current = muted
  // Previous known total ops count (per period). null = not yet initialized.
  const prevCountRef = useRef<number | null>(null)
  // The period the baseline belongs to, so a period switch resets the baseline.
  const baselinePeriodRef = useRef<Period>(period)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load persisted mute choice on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    setMuted(window.localStorage.getItem(MUTE_STORAGE_KEY) === '1')
  }, [])

  // Create or resume the shared AudioContext (must run from a user gesture).
  const unlockAudio = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume()
    } catch {
      /* ignore */
    }
  }, [])

  // Unlock audio on the very first click anywhere (fallback to the gate button).
  useEffect(() => {
    const handler = () => unlockAudio()
    window.addEventListener('pointerdown', handler, { once: true })
    return () => window.removeEventListener('pointerdown', handler)
  }, [unlockAudio])

  // Synthesize a short festive bell arpeggio (no audio files / libraries).
  const playCelebrationSound = useCallback(() => {
    if (mutedRef.current) return
    const ctx = audioCtxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    try {
      const now = ctx.currentTime
      // C5 - E5 - G5 - C6 - E6 major arpeggio.
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
      const master = ctx.createGain()
      master.gain.value = 0.32
      master.connect(ctx.destination)

      notes.forEach((freq, i) => {
        const t = now + i * 0.13
        // Bell = fundamental + a couple of partials for a "campana" shimmer.
        const partials = [
          { mult: 1, gain: 1, type: 'triangle' as OscillatorType },
          { mult: 2.01, gain: 0.4, type: 'sine' as OscillatorType },
          { mult: 3.02, gain: 0.18, type: 'sine' as OscillatorType },
        ]
        partials.forEach((p) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = p.type
          osc.frequency.value = freq * p.mult
          // Quick attack + exponential decay envelope.
          g.gain.setValueAtTime(0.0001, t)
          g.gain.linearRampToValueAtTime(p.gain, t + 0.012)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
          osc.connect(g)
          g.connect(master)
          osc.start(t)
          osc.stop(t + 0.65)
        })
      })
    } catch {
      /* ignore */
    }
  }, [])

  // Fire a celebration: visual overlay + sound. Auto-dismisses after ~3.6s.
  const triggerCelebration = useCallback(
    (sellerName?: string, amount?: number) => {
      playCelebrationSound()
      setCelebration({ sellerName, amount, key: Date.now() })
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = setTimeout(() => setCelebration(null), 3800)
    },
    [playCelebrationSound]
  )

  // Toggle mute and persist.
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      if (typeof window !== 'undefined')
        window.localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current)
    }
  }, [])

  // Measure the ranking area so we render only as many rows as fit (no scroll).
  const rankAreaRef = useRef<HTMLDivElement | null>(null)
  const [rankAreaH, setRankAreaH] = useState(0)
  useEffect(() => {
    const el = rankAreaRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setRankAreaH(entry.contentRect.height)
    })
    ro.observe(el)
    setRankAreaH(el.clientHeight)
    return () => ro.disconnect()
  }, [authed, loading, error, data])

  // Core fetch — always sends the x-screen-password header.
  // Returns true on success, false on failure. Throws nothing.
  const loadBoard = useCallback(
    async (pw: string, p: Period, soft = false): Promise<'ok' | 'unauthorized' | 'error'> => {
      if (soft) setRefreshing(true)
      else setLoading(true)
      try {
        const res = await fetch(`/api/leaderboard/combined?period=${p}`, {
          cache: 'no-store',
          headers: { 'x-screen-password': pw },
        })
        if (res.status === 401) {
          if (!soft) setLoading(false)
          else setRefreshing(false)
          return 'unauthorized'
        }
        if (!res.ok) throw new Error('bad response')
        const json: ApiResponse = await res.json()
        if (periodRef.current === p) {
          setData(json)
          setError(false)
        }
        return 'ok'
      } catch {
        if (!soft) setError(true)
        return 'error'
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  // Bootstrap: try a saved password from localStorage on mount.
  useEffect(() => {
    let cancelled = false
    const saved =
      typeof window !== 'undefined' ? window.localStorage.getItem(PW_STORAGE_KEY) : null
    if (!saved) {
      setBootstrapped(true)
      return
    }
    setSubmitting(true)
    loadBoard(saved, periodRef.current, false).then((result) => {
      if (cancelled) return
      if (result === 'unauthorized') {
        window.localStorage.removeItem(PW_STORAGE_KEY)
        setAuthed(false)
        setGateError('Contraseña incorrecta')
      } else {
        // 'ok' or transient 'error' (network) — keep the saved password and
        // let the board show its own retry/error UI.
        setPassword(saved)
        setAuthed(true)
      }
      setSubmitting(false)
      setBootstrapped(true)
    })
    return () => {
      cancelled = true
    }
  }, [loadBoard])

  // Gate submit handler.
  const handleGateSubmit = useCallback(
    async (pw: string) => {
      // The "Entrar" click is a user gesture — unlock audio now.
      unlockAudio()
      setSubmitting(true)
      setGateError('')
      const result = await loadBoard(pw, periodRef.current, false)
      if (result === 'ok') {
        if (typeof window !== 'undefined') window.localStorage.setItem(PW_STORAGE_KEY, pw)
        setPassword(pw)
        setAuthed(true)
      } else if (result === 'unauthorized') {
        setGateError('Contraseña incorrecta')
      } else {
        setGateError('No se pudo conectar. Intenta de nuevo.')
      }
      setSubmitting(false)
    },
    [loadBoard, unlockAudio]
  )

  // Lock: clear stored password and return to the gate.
  const handleLock = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(PW_STORAGE_KEY)
    setPassword(null)
    setAuthed(false)
    setData(null)
    setGateError('')
  }, [])

  // Re-fetch when period changes (only while authed).
  useEffect(() => {
    if (!authed || !passwordRef.current) return
    loadBoard(passwordRef.current, period, false)
  }, [period, authed, loadBoard])

  // Auto-refresh every 60s (only while authed).
  useEffect(() => {
    if (!authed) return
    const id = setInterval(() => {
      const pw = passwordRef.current
      if (pw) loadBoard(pw, periodRef.current, true)
    }, 60000)
    return () => clearInterval(id)
  }, [authed, loadBoard])

  // ---------- Celebration detector ----------
  // Watch the combined ops count. Celebrate only when the period is unchanged
  // and the count strictly increased vs. the previously known value. The very
  // first observed value just initializes the baseline (no celebration). A
  // period switch resets the baseline so switching numbers never celebrates.
  useEffect(() => {
    if (!data) return
    const newCount = data.combined?.totals?.count ?? 0
    const samePeriod = baselinePeriodRef.current === period
    if (!samePeriod) {
      // Period changed: reset baseline, don't celebrate.
      baselinePeriodRef.current = period
      prevCountRef.current = newCount
      return
    }
    const prev = prevCountRef.current
    if (prev !== null && newCount > prev) {
      const top = data.combined?.sellers?.[0]
      triggerCelebration(top?.name, top?.commission)
    }
    prevCountRef.current = newCount
  }, [data, period, triggerCelebration])

  // Live clock (Panama).
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

  // Rotating motivation.
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

  const handleRetry = () => {
    const pw = passwordRef.current
    if (pw) loadBoard(pw, periodRef.current, false)
  }

  // ---------- Render: gate ----------
  if (!bootstrapped) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
        }}
      >
        <CircularProgress sx={{ color: YELLOW }} size={48} />
      </Box>
    )
  }

  if (!authed) {
    return (
      <PasswordGate onSubmit={handleGateSubmit} error={gateError} submitting={submitting} />
    )
  }

  // ---------- Render: board ----------
  const sellers = data?.combined.sellers ?? []
  const podium = sellers.slice(0, 3)
  const rest = sellers.slice(3)
  const totals = data?.combined.totals
  const team = data?.systems.TP?.team
  const hasSales = sellers.length > 0

  // Cap the "rest" rows to how many fit the measured ranking area (no scroll).
  const ROW_PX = 64 // approx height of a compact rank row incl. gap
  const fitRows = Math.max(0, Math.floor((rankAreaH - 8) / ROW_PX))
  const visibleRest = rest.slice(0, fitRows)
  const hiddenCount = rest.length - visibleRest.length

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: `radial-gradient(140% 100% at 50% -10%, #18181b 0%, ${BG} 55%)`,
        color: TEXT,
        fontFamily: FONT_BODY,
        px: 'clamp(1rem, 2vw, 3rem)',
        py: 'clamp(0.6rem, 1.2vh, 1.4rem)',
        gap: 'clamp(0.5rem, 1.2vh, 1.4rem)',
        boxSizing: 'border-box',
      }}
    >
      {/* ---------- CELEBRATION OVERLAY ---------- */}
      {celebration && (
        <CelebrationOverlay
          key={celebration.key}
          sellerName={celebration.sellerName}
          amount={celebration.amount}
        />
      )}

      {/* ---------- HEADER (~9vh) ---------- */}
      <Box
        sx={{
          flex: '0 0 auto',
          height: 'clamp(56px, 9vh, 96px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <EmojiEventsIcon sx={{ color: YELLOW, fontSize: 'clamp(1.8rem, 4.5vh, 3rem)' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: FONT_HEAD,
                fontWeight: 800,
                fontSize: 'clamp(1.3rem, 4vh, 2.8rem)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: TEXT,
                whiteSpace: 'nowrap',
              }}
            >
              Rendimiento del Equipo
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 'clamp(0.65rem, 1.3vh, 0.95rem)', fontWeight: 600, mt: 0.4, whiteSpace: 'nowrap' }}>
              TP + CNC · {PERIOD_LABELS[period]}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, flexShrink: 0 }}>
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
                px: 2,
                py: 0.4,
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
            <Typography sx={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(0.95rem, 2.4vh, 1.6rem)', color: TEXT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {clock}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, justifyContent: 'flex-end', mt: 0.3 }}>
              {refreshing && (
                <BoltIcon sx={{ fontSize: '0.9rem', color: YELLOW, animation: `${pulse} 1s ease-in-out infinite` }} />
              )}
              <Typography sx={{ color: MUTED, fontSize: 'clamp(0.6rem, 1.1vh, 0.72rem)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {refreshing ? 'actualizando…' : updatedAt ? `Actualizado ${updatedAt}` : '—'}
              </Typography>
            </Box>
          </Box>

          <Tooltip title={muted ? 'Activar sonido de ventas' : 'Silenciar sonido de ventas'}>
            <IconButton
              onClick={toggleMute}
              size="small"
              sx={{
                color: muted ? MUTED : YELLOW,
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                '&:hover': { bgcolor: '#1f1f23', borderColor: YELLOW, color: YELLOW },
              }}
            >
              {muted ? <NotificationsOffIcon /> : <NotificationsActiveIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Pantalla completa">
            <IconButton
              onClick={handleFullscreen}
              size="small"
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

          <Tooltip title="Bloquear pantalla">
            <IconButton
              onClick={handleLock}
              size="small"
              sx={{
                color: MUTED,
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                '&:hover': { bgcolor: '#1f1f23', borderColor: RED, color: RED },
              }}
            >
              <LockOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ---------- Loading ---------- */}
      {loading && (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress sx={{ color: YELLOW }} size={56} />
          <Typography sx={{ color: MUTED, fontWeight: 600 }}>Cargando rendimiento…</Typography>
        </Box>
      )}

      {/* ---------- Error ---------- */}
      {!loading && error && (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <ErrorOutlineIcon sx={{ color: RED, fontSize: '3rem' }} />
          <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: '1.4rem' }}>
            No se pudo cargar el tablero
          </Typography>
          <Typography sx={{ color: MUTED }}>Reintentando automáticamente…</Typography>
          <Button
            onClick={handleRetry}
            sx={{
              mt: 1,
              bgcolor: YELLOW,
              color: '#0A0A0A',
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 3,
              px: 3,
              '&:hover': { bgcolor: '#eab308' },
            }}
          >
            Reintentar
          </Button>
        </Box>
      )}

      {/* ---------- Content ---------- */}
      {!loading && !error && data && (
        <>
          {/* KPI ROW (~18vh) */}
          <Box
            sx={{
              flex: '0 0 auto',
              height: 'clamp(96px, 18vh, 200px)',
              display: 'flex',
              gap: 'clamp(0.5rem, 1.2vw, 1.6rem)',
            }}
          >
            <KpiCard icon={<TrendingUpIcon sx={{ fontSize: '1.6rem' }} />} label="Ventas Totales" value={usd(totals?.sales)} accent={TEXT} />
            <KpiCard icon={<PaidIcon sx={{ fontSize: '1.6rem' }} />} label="Comisión Total" value={usd(totals?.commission)} accent={YELLOW} />
            <KpiCard icon={<HourglassBottomIcon sx={{ fontSize: '1.6rem' }} />} label="Comisión Pendiente" value={usd(totals?.pending)} accent={AMBER} />
            <KpiCard icon={<ReceiptLongIcon sx={{ fontSize: '1.6rem' }} />} label="Operaciones" value={num(totals?.count)} accent={GREEN} />
          </Box>

          {/* MAIN RANKING (flex-grow) */}
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'clamp(0.4rem, 1vh, 1rem)' }}>
            {!hasSales ? (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: 'clamp(2.5rem, 8vh, 5rem)', lineHeight: 1 }}>🚀</Typography>
                <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(1.1rem, 3vh, 2rem)' }}>
                  Aún no hay ventas registradas este periodo
                </Typography>
                <Typography sx={{ color: YELLOW, fontWeight: 700, fontSize: 'clamp(0.95rem, 2vh, 1.3rem)' }}>¡A vender! 🚀</Typography>
              </Box>
            ) : (
              <>
                {/* PODIUM */}
                {podium.length > 0 && (
                  <Box
                    sx={{
                      flex: '0 0 auto',
                      height: 'clamp(110px, 22vh, 240px)',
                      display: 'flex',
                      gap: 'clamp(0.5rem, 1.2vw, 1.6rem)',
                      alignItems: 'stretch',
                    }}
                  >
                    {podium.map((s, i) => (
                      <PodiumCard key={`${s.name}-${s.system}`} seller={s} rank={i} />
                    ))}
                  </Box>
                )}

                {/* REST RANKING — only as many rows as fit */}
                <Box
                  ref={rankAreaRef}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(0.3rem, 0.7vh, 0.8rem)',
                    overflow: 'hidden',
                  }}
                >
                  {visibleRest.map((s, i) => (
                    <RankRow key={`${s.name}-${s.system}`} seller={s} rank={i + 3} />
                  ))}
                  {hiddenCount > 0 && (
                    <Typography
                      sx={{
                        flex: '0 0 auto',
                        textAlign: 'center',
                        color: MUTED,
                        fontFamily: FONT_HEAD,
                        fontWeight: 700,
                        fontSize: 'clamp(0.7rem, 1.4vh, 1rem)',
                        py: 0.3,
                      }}
                    >
                      +{hiddenCount} más
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* BOTTOM STRIP (~20vh): TP | CNC | Actividad */}
          <Box
            sx={{
              flex: '0 0 auto',
              height: 'clamp(120px, 20vh, 240px)',
              display: 'flex',
              gap: 'clamp(0.5rem, 1.2vw, 1.6rem)',
            }}
          >
            <SystemTotalsCard title="TP" accent={YELLOW} block={data.systems.TP} />
            <SystemTotalsCard title="CNC" accent={RED} block={data.systems.CNC} />

            {/* TEAM ACTIVITY */}
            <Box
              sx={{
                flex: 1.3,
                minWidth: 0,
                height: '100%',
                bgcolor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 3,
                px: 'clamp(0.9rem, 1.4vw, 2rem)',
                py: 'clamp(0.6rem, 1.2vh, 1.6rem)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 'clamp(0.4rem, 1vh, 1rem)' }}>
                <GroupsIcon sx={{ color: YELLOW, fontSize: 'clamp(1.1rem, 2.4vh, 1.6rem)' }} />
                <Typography sx={{ color: TEXT, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 'clamp(0.9rem, 2.2vh, 1.4rem)' }}>
                  Actividad del Equipo
                </Typography>
                <Typography
                  key={motoIdx}
                  sx={{
                    ml: 'auto',
                    fontFamily: FONT_HEAD,
                    fontWeight: 700,
                    fontSize: 'clamp(0.6rem, 1.3vh, 0.95rem)',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
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
              {team ? (
                <>
                  <Box sx={{ display: 'flex', gap: 'clamp(0.8rem, 2vw, 2.5rem)', flexWrap: 'nowrap' }}>
                    <TeamStat
                      icon={<BoltIcon sx={{ fontSize: '1.6rem' }} />}
                      value={
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
                          {team.workingNow}
                          <FiberManualRecordIcon sx={{ fontSize: '0.7rem', color: GREEN, animation: `${pulse} 1.6s ease-in-out infinite` }} />
                        </Box>
                      }
                      label="Trabajando ahora"
                      color={GREEN}
                    />
                    <TeamStat icon={<CheckCircleIcon sx={{ fontSize: '1.6rem' }} />} value={team.tasksCompletedToday} label="Completadas hoy" color={GREEN} />
                    <TeamStat icon={<PendingActionsIcon sx={{ fontSize: '1.6rem' }} />} value={team.tasksPending} label="Pendientes" color={AMBER} />
                    <TeamStat icon={<ErrorOutlineIcon sx={{ fontSize: '1.6rem' }} />} value={team.tasksOverdue} label="Vencidas" color={RED} />
                  </Box>
                  {team.workingNames?.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 'clamp(0.4rem, 1vh, 1rem)', overflow: 'hidden', maxHeight: 'clamp(24px, 4vh, 40px)' }}>
                      {team.workingNames.map((n) => (
                        <Chip
                          key={n}
                          label={n}
                          size="small"
                          sx={{ height: 22, bgcolor: `${GREEN}14`, color: GREEN, border: `1px solid ${GREEN}33`, fontWeight: 700, fontSize: '0.68rem' }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              ) : (
                <Typography sx={{ color: MUTED, fontSize: 'clamp(0.75rem, 1.2vh, 0.95rem)', fontWeight: 500 }}>
                  Sin datos de actividad del equipo.
                </Typography>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
