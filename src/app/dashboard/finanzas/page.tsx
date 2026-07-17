'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Tabs, Tab, Alert,
  LinearProgress, MenuItem, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import { Lock, LockOpen, AccountBalanceWallet, Add, Visibility, VisibilityOff } from '@mui/icons-material'
import DashboardTab from './components/DashboardTab'
import RubrosTab from './components/RubrosTab'
import OperacionesTab from './components/OperacionesTab'
import RegistroTab from './components/RegistroTab'
import PrestamosTab from './components/PrestamosTab'
import ResumenMensualTab from './components/ResumenMensualTab'
import PorUnidadTab from './components/PorUnidadTab'
import AnalisisTab from './components/AnalisisTab'
import CatalogosTab from './components/CatalogosTab'
import EntryFormDialog from './components/EntryFormDialog'

interface SessionState {
  owner: boolean
  name?: string
  email?: string
  hasPin: boolean
  unlocked: boolean
}

const YEARS = [2025, 2026, 2027]

export default function FinanzasPage() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [year, setYear] = useState(2026)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadSession = useCallback(() => {
    setLoading(true)
    fetch('/api/finanzas/session')
      .then(r => (r.status === 403 ? { owner: false, hasPin: false, unlocked: false } : r.json()))
      .then(setSession)
      .catch(() => setSession({ owner: false, hasPin: false, unlocked: false }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadSession() }, [loadSession])

  if (loading) {
    return <Box sx={{ p: 4 }}><LinearProgress /></Box>
  }

  if (!session?.owner) {
    return (
      <CenteredCard>
        <Lock sx={{ fontSize: 48, color: '#B91C1C', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Acceso restringido</Typography>
        <Typography variant="body2" sx={{ color: '#78716C', mt: 1 }}>
          Este módulo es privado. Solo los dueños autorizados pueden ingresar.
        </Typography>
      </CenteredCard>
    )
  }

  if (!session.hasPin) {
    return <CreatePinScreen onDone={loadSession} name={session.name} />
  }

  if (!session.unlocked) {
    return <UnlockScreen onUnlocked={loadSession} name={session.name} />
  }

  const lock = async () => {
    await fetch('/api/finanzas/unlock', { method: 'DELETE' })
    loadSession()
  }

  const tabs = [
    <DashboardTab key="dash" year={year} onQuickAdd={() => setDialogOpen(true)} />,
    <RubrosTab key="rub" year={year} />,
    <OperacionesTab key="ope" onChanged={() => setRefreshKey(k => k + 1)} />,
    <RegistroTab key="reg" onChanged={() => setRefreshKey(k => k + 1)} />,
    <PrestamosTab key="pre" onChanged={() => setRefreshKey(k => k + 1)} />,
    <ResumenMensualTab key="mes" year={year} />,
    <PorUnidadTab key="uni" year={year} />,
    <AnalisisTab key="ana" year={year} />,
    <CatalogosTab key="cat" />,
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #171717 100%)',
        borderRadius: '16px', p: { xs: 2.5, sm: 3 },
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '12px', background: 'linear-gradient(135deg,#FACC15,#FDE047)', display: 'flex' }}>
            <AccountBalanceWallet sx={{ color: '#0A0A0A' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', fontFamily: '"Poppins", sans-serif' }}>
              Finanzas Personales
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Contabilidad privada · {session.name}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField select size="small" value={year} onChange={e => setYear(Number(e.target.value))}
            sx={{ minWidth: 100, '& .MuiInputBase-root': { bgcolor: 'white', borderRadius: 2 } }}>
            {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#FACC15', color: '#0A0A0A', '&:hover': { bgcolor: '#FDE047' } }}>
            Registrar
          </Button>
          <Button variant="outlined" startIcon={<Lock />} onClick={lock}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
            Bloquear
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#0A0A0A !important' }, '& .MuiTabs-indicator': { bgcolor: '#FACC15', height: 3 } }}>
          <Tab label="Resumen" />
          <Tab label="Rubros" />
          <Tab label="Operaciones" />
          <Tab label="Registro Diario" />
          <Tab label="Préstamos" />
          <Tab label="Mensual" />
          <Tab label="Por Unidad" />
          <Tab label="Análisis" />
          <Tab label="Catálogos" />
        </Tabs>
      </Box>

      <Box key={`${tab}-${refreshKey}`}>{tabs[tab]}</Box>

      <EntryFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        onSaved={() => setRefreshKey(k => k + 1)} entry={null} />
    </Box>
  )
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)', maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {children}
        </CardContent>
      </Card>
    </Box>
  )
}

function CreatePinScreen({ onDone, name }: { onDone: () => void; name?: string }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError(null)
    if (pin.length < 4) return setError('El PIN debe tener al menos 4 caracteres')
    if (pin !== confirm) return setError('Los PIN no coinciden')
    setSaving(true)
    try {
      const res = await fetch('/api/finanzas/pin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin: pin }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Error') }
      onDone()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <CenteredCard>
      <AccountBalanceWallet sx={{ fontSize: 44, color: '#FACC15', mb: 1.5 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Crea tu PIN</Typography>
      <Typography variant="body2" sx={{ color: '#78716C', mt: 0.5, mb: 2.5 }}>
        Protege el módulo con un PIN. {name ? `Hola, ${name}.` : ''}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{error}</Alert>}
      <TextField type="password" label="Nuevo PIN" fullWidth size="small" sx={{ mb: 1.5 }}
        value={pin} onChange={e => setPin(e.target.value)} />
      <TextField type="password" label="Confirmar PIN" fullWidth size="small" sx={{ mb: 2.5 }}
        value={confirm} onChange={e => setConfirm(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }} />
      <Button fullWidth variant="contained" onClick={submit} disabled={saving}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
        Crear PIN
      </Button>
    </CenteredCard>
  )
}

function UnlockScreen({ onUnlocked, name }: { onUnlocked: () => void; name?: string }) {
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/finanzas/unlock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'PIN incorrecto') }
      onUnlocked()
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <CenteredCard>
      <LockOpen sx={{ fontSize: 44, color: '#FACC15', mb: 1.5 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>Módulo bloqueado</Typography>
      <Typography variant="body2" sx={{ color: '#78716C', mt: 0.5, mb: 2.5 }}>
        Ingresa tu PIN para acceder a la contabilidad. {name ? `Hola, ${name}.` : ''}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{error}</Alert>}
      <TextField
        type={show ? 'text' : 'password'} label="PIN" fullWidth size="small" sx={{ mb: 2.5 }} autoFocus
        value={pin} onChange={e => setPin(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShow(s => !s)} edge="end" size="small">
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button fullWidth variant="contained" onClick={submit} disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockOpen />}
        sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
        Desbloquear
      </Button>
    </CenteredCard>
  )
}
