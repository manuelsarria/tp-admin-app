'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box, Typography, Card, CardContent, Grid, Button, CircularProgress,
  Chip, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import {
  AccountBalance, TrendingUp, TrendingDown, Add, ArrowForward,
  AttachMoney, Assessment, LocalShipping,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const ALLOWED_EMAILS = ['manuell.sarria@gmail.com', 'krlos@cyber.pty']
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ORIGIN_LABELS: Record<string, string> = { CHINA: 'China', PANAMA: 'Panamá', COSTA_RICA: 'Costa Rica', USA: 'USA', OTHER: 'Otro' }
const ORIGIN_COLORS: Record<string, string> = { CHINA: '#FACC15', PANAMA: '#3B82F6', COSTA_RICA: '#16A34A', USA: '#6366F1', OTHER: '#9CA3AF' }
const PIE_COLORS = ['#FACC15', '#3B82F6', '#16A34A', '#F59E0B', '#6366F1', '#9CA3AF']

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtDec = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ContabilidadDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [year, setYear] = useState(new Date().getFullYear())
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || !session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) {
      router.replace('/dashboard')
    }
  }, [session, status])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/contabilidad/reports?year=${year}`)
      .then(r => r.json())
      .then(d => setReport(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  if (status === 'loading' || !session) return null
  if (!session.user?.email || !ALLOWED_EMAILS.includes(session.user.email)) return null

  const pnl = report?.pnl || {}
  const monthly = (report?.monthly || []).map((m: any) => ({ ...m, label: MONTHS[m.month - 1] }))
  const byOrigin = Object.entries(report?.byOrigin || {}).map(([k, v]: any) => ({
    name: ORIGIN_LABELS[k] || k, income: v.income, expense: v.expense,
  }))
  const byCategory = Object.entries(report?.byCategory || {})
    .map(([k, v]: any) => ({ name: k.replace(/_/g, ' '), value: v.income + v.expense }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
  const topOps = (report?.operations?.list || [])
    .sort((a: any, b: any) => b.utilidad - a.utilidad)
    .slice(0, 5)

  const statCards = [
    { label: 'Ingresos Totales', value: fmtDec(pnl.totalRevenue || 0), color: '#16A34A', bg: '#F0FDF4', icon: <TrendingUp /> },
    { label: 'COGS', value: fmtDec(pnl.totalCOGS || 0), color: '#DC2626', bg: '#FEF2F2', icon: <TrendingDown /> },
    { label: 'Utilidad Bruta', value: fmtDec(pnl.grossProfit || 0), color: pnl.grossProfit >= 0 ? '#16A34A' : '#DC2626', bg: pnl.grossProfit >= 0 ? '#F0FDF4' : '#FEF2F2', icon: <AttachMoney /> },
    { label: 'Utilidad Neta', value: fmtDec(pnl.netIncome || 0), color: pnl.netIncome >= 0 ? '#16A34A' : '#DC2626', bg: pnl.netIncome >= 0 ? '#F0FDF4' : '#FEF2F2', icon: <AccountBalance /> },
    { label: 'Gastos Operativos', value: fmtDec(pnl.operatingExpenses || 0), color: '#F59E0B', bg: '#FFFBEB', icon: <Assessment /> },
    { label: 'Utilidad por Ops.', value: fmtDec(report?.operations?.totalUtilidad || 0), color: '#3B82F6', bg: '#EFF6FF', icon: <LocalShipping /> },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <AccountBalance sx={{ color: '#FACC15', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Contabilidad</Typography>
            <Chip label="Privado" size="small" sx={{ bgcolor: '#FACC15', color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Control financiero y análisis de rentabilidad logística
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Add />} onClick={() => router.push('/dashboard/contabilidad/operaciones/nueva')}
            sx={{ borderColor: '#FACC15', color: '#FACC15', textTransform: 'none', fontWeight: 600 }}>
            Nueva Operación
          </Button>
          <Button variant="outlined" startIcon={<Add />} onClick={() => router.push('/dashboard/contabilidad/transacciones')}
            sx={{ textTransform: 'none', fontWeight: 600 }}>
            Transacciones
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress sx={{ color: '#FACC15' }} /></Box>
      ) : (
        <>
          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {statCards.map(s => (
              <Grid item xs={6} sm={4} md={2} key={s.label}>
                <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: s.bg, height: '100%' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: s.color, mb: 0.5 }}>
                      {s.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: s.color, lineHeight: 1.2 }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.68rem' }}>{s.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Monthly Bar Chart */}
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Ingresos vs Gastos — {year}</Typography>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthly} barSize={16}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmtDec(v)} />
                      <Legend />
                      <Bar dataKey="income" name="Ingresos" fill="#16A34A" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expense" name="Gastos" fill="#FACC15" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Pie by origin */}
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Actividad por País</Typography>
                  {byOrigin.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: '#9CA3AF' }}>Sin datos</Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={byOrigin} dataKey="income" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                          {byOrigin.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmtDec(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Net line */}
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Utilidad Neta Mensual</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthly}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmtDec(v)} />
                      <Line type="monotone" dataKey="net" name="Utilidad" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Top operations */}
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Top Operaciones</Typography>
                    <Button size="small" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      onClick={() => router.push('/dashboard/contabilidad/operaciones')}
                      sx={{ textTransform: 'none', fontSize: '0.78rem' }}>
                      Ver todas
                    </Button>
                  </Box>
                  {topOps.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: '#9CA3AF' }}>
                      <LocalShipping sx={{ fontSize: 40, opacity: 0.3 }} />
                      <Typography variant="body2" sx={{ mt: 1 }}>Sin operaciones en {year}</Typography>
                      <Button size="small" variant="contained" onClick={() => router.push('/dashboard/contabilidad/operaciones/nueva')}
                        sx={{ mt: 1.5, bgcolor: '#FACC15', textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Crear primera operación
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {topOps.map((op: any, i: number) => (
                        <Box key={op.id} onClick={() => router.push(`/dashboard/contabilidad/operaciones/${op.id}`)}
                          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5,
                            borderRadius: 2, bgcolor: '#F8FAFC', cursor: 'pointer',
                            '&:hover': { bgcolor: '#F1F5F9' } }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>{op.title}</Typography>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>{op.clientName} · {op.shipmentType}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: op.utilidad >= 0 ? '#16A34A' : '#DC2626' }}>
                              {fmtDec(op.utilidad)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{op.rentabilidad.toFixed(1)}%</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
