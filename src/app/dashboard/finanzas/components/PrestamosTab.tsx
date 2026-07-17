'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Grid, Typography, Chip, Button, IconButton, Tooltip,
  LinearProgress, Alert,
} from '@mui/material'
import { Add, Edit, Delete, Download, Payments, Visibility } from '@mui/icons-material'
import { formatMoney } from '@/lib/finance'
import type { Loan } from './types'
import { LOAN_KIND_LABEL, LOAN_STATUS_LABEL } from './types'
import LoanFormDialog from './LoanFormDialog'
import LoanPaymentDialog from './LoanPaymentDialog'
import LoanDetailDialog from './LoanDetailDialog'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVO: { bg: '#FFFBEB', color: '#B45309' },
  PAGADO: { bg: '#ECFDF5', color: '#047857' },
  CANCELADO: { bg: '#F5F5F4', color: '#78716C' },
}

export default function PrestamosTab({ onChanged }: { onChanged?: () => void }) {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Loan | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [paying, setPaying] = useState<Loan | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/finanzas/loans')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No se pudieron cargar los préstamos'))))
      .then((d: Loan[]) => { setLoans(Array.isArray(d) ? d : []); setError(null) })
      .catch(e => { setLoans([]); setError(e.message) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (loan: Loan) => {
    if (!window.confirm(`¿Borrar "${loan.name}" y todos sus pagos? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/finanzas/loans/${loan.id}`, { method: 'DELETE' })
    if (res.ok) { load(); onChanged?.() }
  }

  const refresh = () => { load(); onChanged?.() }

  const activos = loans.filter(l => l.status === 'ACTIVO')
  const totalAdeudado = activos.reduce((s, l) => s + (l.balance || 0), 0)
  const totalPagado = loans.reduce((s, l) => s + (l.paid || 0), 0)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header totals */}
      <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Total adeudado</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, fontFamily: '"Poppins", sans-serif', color: '#0A0A0A' }}>
                {formatMoney(totalAdeudado)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A8A29E' }}>
                {activos.length} préstamo{activos.length !== 1 ? 's' : ''} activo{activos.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Total pagado</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1.2, fontFamily: '"Poppins", sans-serif', color: '#047857' }}>
                {formatMoney(totalPagado)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#A8A29E' }}>
                {loans.length} préstamo{loans.length !== 1 ? 's' : ''} en total
              </Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<Add />}
            onClick={() => { setEditing(null); setFormOpen(true) }}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
            Nuevo préstamo
          </Button>
        </CardContent>
      </Card>

      {loading && <LinearProgress />}
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {!loading && loans.length === 0 && !error && (
        <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" sx={{ color: '#78716C' }}>
              Aún no hay préstamos registrados.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {loans.map(loan => {
          const c = STATUS_COLORS[loan.status] || STATUS_COLORS.ACTIVO
          const pct = Math.min(Math.max((loan.progress || 0) * 100, 0), 100)
          return (
            <Grid item xs={12} md={6} key={loan.id}>
              <Card sx={{ borderRadius: '16px', border: '1px solid rgba(10,10,10,0.06)', height: '100%' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Title row */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }} noWrap>
                        {loan.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#78716C' }}>
                        {[loan.counterparty, loan.reference].filter(Boolean).join(' · ') || LOAN_KIND_LABEL[loan.kind]}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <Chip label={LOAN_KIND_LABEL[loan.kind]} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: '#FEFCE8', color: '#854D0E' }} />
                      <Chip label={LOAN_STATUS_LABEL[loan.status]} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: c.bg, color: c.color }} />
                    </Box>
                  </Box>

                  {/* Numbers — Saldo dominant */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Saldo</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.1, fontFamily: '"Poppins", sans-serif', color: '#0A0A0A' }}>
                        {formatMoney(loan.balance)}
                      </Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Total</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatMoney(loan.totalAmount)}</Typography>
                    </Box>
                    <Box sx={{ pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Pagado</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#047857' }}>{formatMoney(loan.paid)}</Typography>
                    </Box>
                  </Box>

                  {/* Progress */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>
                        Cuotas {loan.installmentsPaid}{loan.installmentsTotal ? ` / ${loan.installmentsTotal}` : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{Math.round(pct)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(10,10,10,0.08)', '& .MuiLinearProgress-bar': { bgcolor: '#FACC15', borderRadius: 4 } }} />
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                    <Button size="small" variant="contained" startIcon={<Payments />}
                      onClick={() => { setPaying(loan); setPayOpen(true) }}
                      sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
                      Registrar pago
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<Visibility />}
                      onClick={() => { setDetailId(loan.id); setDetailOpen(true) }}
                      sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A', borderColor: 'rgba(10,10,10,0.2)' }}>
                      Ver detalle
                    </Button>
                    <Button size="small" component="a" href={`/api/finanzas/loans/${loan.id}/report`}
                      startIcon={<Download />}
                      sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A' }}>
                      Descargar informe
                    </Button>
                    <Box sx={{ ml: 'auto' }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => { setEditing(loan); setFormOpen(true) }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Borrar">
                        <IconButton size="small" onClick={() => handleDelete(loan)}>
                          <Delete fontSize="small" sx={{ color: '#B91C1C' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <LoanFormDialog open={formOpen} loan={editing}
        onClose={() => setFormOpen(false)} onSaved={refresh} />

      <LoanPaymentDialog open={payOpen} loan={paying} payment={null}
        onClose={() => setPayOpen(false)} onSaved={refresh} />

      <LoanDetailDialog open={detailOpen} loanId={detailId}
        onClose={() => setDetailOpen(false)} onChanged={refresh} />
    </Box>
  )
}
