'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, Grid, Table, TableHead, TableBody, TableRow, TableCell, IconButton,
  Tooltip, LinearProgress, Alert,
} from '@mui/material'
import { Add, Edit, Delete, Download } from '@mui/icons-material'
import { formatMoney } from '@/lib/finance'
import type { Loan, LoanPayment } from './types'
import { LOAN_KIND_LABEL, LOAN_STATUS_LABEL, LOAN_PAYMENT_KIND_LABEL } from './types'
import LoanPaymentDialog from './LoanPaymentDialog'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVO: { bg: '#FFFBEB', color: '#B45309' },
  PAGADO: { bg: '#ECFDF5', color: '#047857' },
  CANCELADO: { bg: '#F5F5F4', color: '#78716C' },
}

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value ?? '—'}</Typography>
    </Grid>
  )
}

export default function LoanDetailDialog({
  open, onClose, loanId, onChanged,
}: {
  open: boolean
  onClose: () => void
  loanId: string | null
  onChanged?: () => void
}) {
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payDialog, setPayDialog] = useState(false)
  const [editingPayment, setEditingPayment] = useState<LoanPayment | null>(null)

  const load = useCallback(() => {
    if (!loanId) return
    setLoading(true)
    fetch(`/api/finanzas/loans/${loanId}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('No se pudo cargar el préstamo'))))
      .then((d: Loan) => { setLoan(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [loanId])

  useEffect(() => { if (open) load() }, [open, load])

  const deletePayment = async (id: string) => {
    if (!loan) return
    if (!window.confirm('¿Borrar este pago? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/finanzas/loans/${loan.id}/payments/${id}`, { method: 'DELETE' })
    if (res.ok) { load(); onChanged?.() }
  }

  // Running balance starts at total − abono inicial; each payment reduces it.
  let running = loan ? loan.totalAmount - loan.downPayment : 0
  const rows = (loan?.payments || []).map(p => {
    running -= p.amount
    return { payment: p, balance: running }
  })

  const statusColor = loan ? (STATUS_COLORS[loan.status] || STATUS_COLORS.ACTIVO) : STATUS_COLORS.ACTIVO

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {loan?.name || 'Préstamo'}
          {loan && (
            <>
              <Chip label={LOAN_STATUS_LABEL[loan.status]} size="small"
                sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: statusColor.bg, color: statusColor.color }} />
              <Chip label={LOAN_KIND_LABEL[loan.kind]} size="small"
                sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: '#FEFCE8', color: '#854D0E' }} />
            </>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          {loan && (
            <>
              {/* Big numbers */}
              <Box sx={{
                display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-end',
                p: 2, mb: 2, borderRadius: '12px', bgcolor: '#FAFAF9',
              }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Saldo</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.9rem', lineHeight: 1.1, fontFamily: '"Poppins", sans-serif', color: '#0A0A0A' }}>
                    {formatMoney(loan.balance)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Total</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{formatMoney(loan.totalAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>Pagado</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#047857' }}>{formatMoney(loan.paid)}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#78716C', fontWeight: 600 }}>
                      Cuotas {loan.installmentsPaid}{loan.installmentsTotal ? ` / ${loan.installmentsTotal}` : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {Math.round((loan.progress || 0) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(Math.max((loan.progress || 0) * 100, 0), 100)}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(10,10,10,0.08)', '& .MuiLinearProgress-bar': { bgcolor: '#FACC15', borderRadius: 4 } }} />
                </Box>
              </Box>

              {/* Detail fields */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Field label="Contraparte" value={loan.counterparty || '—'} />
                <Field label="Referencia" value={loan.reference || '—'} />
                <Field label="Capital" value={formatMoney(loan.principal)} />
                <Field label="Interés y cargos" value={formatMoney(loan.interest)} />
                <Field label="Abono inicial" value={formatMoney(loan.downPayment)} />
                <Field label="Cuota" value={loan.installmentAmount != null ? formatMoney(loan.installmentAmount) : '—'} />
                <Field label="Tasa" value={loan.interestRate != null ? `${loan.interestRate}%` : '—'} />
                <Field label="Inicio" value={fmtDate(loan.startDate)} />
                <Field label="Primera cuota" value={fmtDate(loan.firstPaymentDate)} />
                <Field label="Vencimiento" value={fmtDate(loan.dueDate)} />
                <Field label="Unidad" value={loan.unit || '—'} />
                <Field label="Categoría" value={loan.category || '—'} />
                {loan.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#A8A29E', fontWeight: 600 }}>Observaciones</Typography>
                    <Typography variant="body2">{loan.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              {/* Payment history */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontFamily: '"Poppins", sans-serif' }}>
                  Historial de pagos ({loan.payments.length})
                </Typography>
                <Button size="small" variant="contained" startIcon={<Add />}
                  onClick={() => { setEditingPayment(null); setPayDialog(true) }}
                  sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0A0A0A', color: '#fff', '&:hover': { bgcolor: '#262626' } }}>
                  Registrar pago
                </Button>
              </Box>

              <Box sx={{ border: '1px solid rgba(10,10,10,0.06)', borderRadius: '12px', overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#FAFAF9' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Fondo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Referencia</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Monto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Saldo corrido</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ textAlign: 'center', color: '#78716C', py: 3 }}>
                          Aún no hay pagos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                    {rows.map(({ payment: p, balance }) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{fmtDate(p.date)}</TableCell>
                        <TableCell>
                          <Chip label={LOAN_PAYMENT_KIND_LABEL[p.kind]} size="small"
                            sx={{ fontWeight: 700, fontSize: '0.66rem', bgcolor: '#FEFCE8', color: '#854D0E' }} />
                        </TableCell>
                        <TableCell>{p.sourceUnit || loan.unit || '—'}</TableCell>
                        <TableCell>{p.method || '—'}</TableCell>
                        <TableCell>{p.reference || '—'}</TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#B91C1C' }}>
                            −{formatMoney(Math.abs(p.amount))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatMoney(Math.max(balance, 0))}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => { setEditingPayment(p); setPayDialog(true) }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Borrar">
                            <IconButton size="small" onClick={() => deletePayment(p.id)}>
                              <Delete fontSize="small" sx={{ color: '#B91C1C' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {loan && (
            <Button component="a" href={`/api/finanzas/loans/${loan.id}/report`} startIcon={<Download />}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0A0A0A', mr: 'auto' }}>
              Descargar informe
            </Button>
          )}
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <LoanPaymentDialog
        open={payDialog}
        loan={loan}
        payment={editingPayment}
        onClose={() => setPayDialog(false)}
        onSaved={() => { load(); onChanged?.() }}
      />
    </>
  )
}
