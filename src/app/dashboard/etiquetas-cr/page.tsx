'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid,
  CircularProgress,
} from '@mui/material'
import {
  Label, Download, Refresh,
} from '@mui/icons-material'

// ── CR Label Preview ────────────────────────────────────────────────────────
function CRLabelPreview({ code, name }: { code: string; name?: string }) {
  return (
    <Box id="label-container-cr" sx={{
      width: 800, height: 520, position: 'relative', overflow: 'hidden',
      border: '2px solid #E5E7EB', borderRadius: '4px', bgcolor: 'white',
      fontFamily: '"Arial", "Helvetica", sans-serif',
    }}>
      {/* Blue Header — Costa Rica */}
      <Box sx={{
        bgcolor: '#002B7F', color: 'white', textAlign: 'center',
        py: 2, px: 3,
      }}>
        <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', letterSpacing: '0.15em', lineHeight: 1.3 }}>
          CHINA - COSTA RICA
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: 'white', mt: 0.5 }}>
          广东省广州市南沙区
        </Typography>
      </Box>

      {/* Center - Mailbox Code */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 300,
      }}>
        {/* CR Badge */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, mb: 1,
        }}>
          <Box component="img" src="/images/TP-Logo.png" alt="CNC"
            sx={{ height: 32, objectFit: 'contain', opacity: 0.15 }} />
          <Typography sx={{
            fontWeight: 900, fontSize: '1.1rem', color: '#002B7F',
            bgcolor: '#E8F0FE', px: 1.5, py: 0.3, borderRadius: '6px',
            letterSpacing: '0.1em',
          }}>
            COSTA RICA
          </Typography>
        </Box>

        <Typography sx={{
          fontWeight: 900, fontSize: code.length > 12 ? '4.5rem' : '6rem',
          color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1,
          fontFamily: '"Arial Black", "Impact", sans-serif',
        }}>
          {code || 'CR-TP-XXXX'}
        </Typography>

        {name && (
          <Typography sx={{
            fontWeight: 600, fontSize: '1.3rem', color: '#374151', mt: 1,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {name}
          </Typography>
        )}
      </Box>

      {/* Blue Footer */}
      <Box sx={{
        bgcolor: '#002B7F', color: 'white', position: 'absolute', bottom: 0, left: 0, right: 0,
        py: 1.5, px: 3,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Box sx={{ textAlign: 'left' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>广东省广州市南沙区</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>13536140636</Typography>
          </Box>
          <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: 'white', letterSpacing: '0.05em' }}>
            ← 送货前联系仓库 →
          </Typography>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>广东省广州市南沙区</Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>13536140636</Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', textAlign: 'center', letterSpacing: '0.02em' }}>
          注：送货前一定要先联系仓库，仓库不负责卸货，大件货，重货请先咨询费用
        </Typography>
      </Box>
    </Box>
  )
}

// ── Page 2: Shipping Info CR ─────────────────────────────────────────────────
function CRShippingInfoPage({ code, name }: { code: string; name?: string }) {
  const S = { fontFamily: '"Arial", "Helvetica", "PingFang SC", "Microsoft YaHei", sans-serif' }
  return (
    <Box id="info-container-cr" sx={{ width: 800, bgcolor: 'white', p: 5, ...S }}>

      {/* ── Section 1: 唛头信息 ── */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: '#002B7F', letterSpacing: '0.1em' }}>TP LOGISTICS — COSTA RICA</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', mt: 0.5 }}>唛头信息</Typography>
      </Box>

      <Box sx={{ border: '1px solid #002B7F', borderRadius: 1, p: 2.5, mb: 3 }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#002B7F', fontWeight: 700, mb: 1.5, lineHeight: 1.5 }}>
          注意：填完后请发给仓库负责人核对信息再打印贴在外.（每一箱都需要贴这份唛头）
        </Typography>

        <Typography sx={{ fontSize: '1rem', fontWeight: 800, mb: 2 }}>
          入仓号：{code}{name ? ` - ${name}` : ''}
        </Typography>

        {['中英品名：', '海关编码 / HS CODE:', '产品数量：', '包装件数：',
          '包装尺寸（长宽高）：', '总立方 (total cbm)：', '总毛重 (total Weight)：',
          '箱子编号：　　　　第____箱 / 共____箱',
        ].map((field, i) => (
          <Box key={i} sx={{ borderBottom: '1px solid #ddd', py: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>{field}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── Section 2: 发货须知 ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#16A34A', mb: 1.5 }}>
          Important information for your supplier / 发货前需要注意：
        </Typography>

        {[
          '1. 唛头信息需要填好发给制定的货代负责人核对，同时发货物包装后的照片。',
          '2. 每一箱/托盘/件货物必须贴唛头信息，否则拒绝收货。',
          '3. 液体，粉末，电池，化妆品，电子产品，敏感货需要提前通知，同时提供 MSDS 报告，签订运输报告，否则拒绝收货。',
        ].map((text, i) => (
          <Typography key={i} sx={{ fontSize: '0.82rem', color: '#333', mb: 1, lineHeight: 1.6 }}>{text}</Typography>
        ))}
      </Box>

      {/* ── Section 3: 包装要求 ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#16A34A', mb: 1.5 }}>
          包装要求：
        </Typography>

        {[
          '1. 易碎品，含玻璃的产品都需要使用厚实坚固的木箱来保护货物，避免货物收到损失。如果货物收到损失，仓库不负责赔偿。',
          '2. 每一个纸箱都需要打编织袋，避免漏掉货物。如果没有编织袋，需要使用出口的纸箱。如果是打托盘就不要打编织袋。',
        ].map((text, i) => (
          <Typography key={i} sx={{ fontSize: '0.82rem', color: '#333', mb: 1, lineHeight: 1.6 }}>{text}</Typography>
        ))}
      </Box>

      {/* ── Section 4: 仓库地址 ── */}
      <Box sx={{ bgcolor: '#EBF0FA', border: '1px solid #002B7F', borderRadius: 1, p: 2.5 }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#002B7F', mb: 1.5 }}>
          仓库地址 / Warehouse Address
        </Typography>

        {[
          '省份 (Province): 广东省',
          '城市 (City): 广州市',
          '区 (District): 南沙区',
          '街道 (Street): 大岗镇',
          `地址 (Address): 荔岗路 1号2栋101厂之121 (${code})`,
          `收件人 (Recipient): ${code}${name ? ' - ' + name : ''}`,
          '电话 (Phone): 13536140636',
        ].map((line, i) => (
          <Typography key={i} sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', lineHeight: 1.8 }}>{line}</Typography>
        ))}

        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #002B7F' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#002B7F', textAlign: 'center' }}>
            注：送货前一定要先联系仓库，仓库不负责卸货，大件货，重货请先咨询费用
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', mt: 0.5 }}>
            Note: Please put this label on the outside of each box before shipping, otherwise our warehouse will refuse to accept the goods.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function EtiquetasCRPage() {
  const [code, setCode] = useState('')
  const [clientName, setClientName] = useState('')
  const [lastCode, setLastCode] = useState<string | null>(null)
  const [loadingLast, setLoadingLast] = useState(true)
  const [editingLast, setEditingLast] = useState(false)
  const [lastCodeInput, setLastCodeInput] = useState('')
  const [downloading, setDownloading] = useState(false)

  const [regenCode, setRegenCode] = useState('')
  const [regenName, setRegenName] = useState('')

  // Responsive preview scale
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(0.85)
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.offsetWidth - 32
        setPreviewScale(Math.min(w / 800, 0.85))
      }
    }
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])

  // Load last CR code from settings
  useEffect(() => {
    fetch('/api/settings/lastMailboxCodeCR').then(r => r.json())
      .then(setting => {
        if (setting?.value) {
          setLastCode(setting.value)
          const num = parseInt(setting.value.replace('CR-TP-', ''))
          if (!isNaN(num)) setCode(`CR-TP-${num + 1}`)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLast(false))
  }, [])

  const saveLastCode = async (newCode: string) => {
    setLastCode(newCode)
    const num = parseInt(newCode.replace('CR-TP-', ''))
    if (!isNaN(num)) setCode(`CR-TP-${num + 1}`)
    await fetch('/api/settings/lastMailboxCodeCR', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newCode }),
    })
  }

  const generatePDF = async (labelCode: string) => {
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')
    const scale = 3

    const el1 = document.getElementById('label-container-cr')
    if (!el1) return
    const c1 = await html2canvas(el1, { scale, useCORS: true, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [c1.width / scale, c1.height / scale] })
    pdf.addImage(c1.toDataURL('image/png'), 'PNG', 0, 0, c1.width / scale, c1.height / scale)

    const el2 = document.getElementById('info-container-cr')
    if (el2) {
      const c2 = await html2canvas(el2, { scale, useCORS: true, backgroundColor: '#ffffff' })
      const w2 = c2.width / scale
      const h2 = c2.height / scale
      pdf.addPage([w2, h2], h2 > w2 ? 'portrait' : 'landscape')
      pdf.addImage(c2.toDataURL('image/png'), 'PNG', 0, 0, w2, h2)
    }

    pdf.save(`Etiqueta-CR-${labelCode}.pdf`)
  }

  const handleDownloadOnly = async (labelCode: string) => {
    setDownloading(true)
    try { await generatePDF(labelCode) }
    catch { alert('Error al generar PDF') }
    finally { setDownloading(false) }
  }

  const handleDownload = async (labelCode: string) => {
    setDownloading(true)
    try {
      await generatePDF(labelCode)
      if (labelCode.startsWith('CR-TP-')) await saveLastCode(labelCode)
    } catch { alert('Error al generar PDF') }
    finally { setDownloading(false) }
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Label sx={{ color: '#002B7F', fontSize: 30 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Generador de Etiquetas — Costa Rica</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Genera etiquetas de casillero para clientes de Costa Rica. Descarga en PDF listo para imprimir.
        </Typography>
      </Box>

      {/* Last code indicator */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 }, borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none', bgcolor: '#EBF0FA' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.68rem' }}>
              Ultimo codigo CR creado
            </Typography>
            {loadingLast ? (
              <CircularProgress size={20} sx={{ color: '#002B7F', mt: 0.5 }} />
            ) : editingLast ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                <TextField size="small" value={lastCodeInput}
                  onChange={e => setLastCodeInput(e.target.value.toUpperCase())}
                  placeholder="CR-TP-0001"
                  InputProps={{ sx: { fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' } }}
                  sx={{ flex: 1 }} />
                <Button size="small" variant="contained"
                  onClick={() => { saveLastCode(lastCodeInput); setEditingLast(false) }}
                  sx={{ bgcolor: '#002B7F', '&:hover': { bgcolor: '#001F5C' }, minWidth: 0, px: 2, fontWeight: 700, textTransform: 'none', borderRadius: 2 }}>
                  OK
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                onClick={() => { setLastCodeInput(lastCode || ''); setEditingLast(true) }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#002B7F', fontFamily: 'monospace' }}>
                  {lastCode || 'Sin configurar'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.65rem' }}>click para editar</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={3}>
        {/* ── Left: Controls ── */}
        <Grid item xs={12} lg={5}>

          {/* New Label */}
          <Card sx={{ mb: 3, borderRadius: 3, border: '2px solid #002B7F', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Label sx={{ color: '#002B7F', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Nueva Etiqueta CR
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Codigo de Casillero CR *"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    fullWidth size="small"
                    placeholder="CR-TP-0001"
                    InputProps={{
                      sx: { fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Nombre del Cliente (opcional)"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    fullWidth size="small"
                    placeholder="Nombre completo"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained" fullWidth
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                    disabled={!code.trim() || downloading}
                    onClick={() => handleDownload(code)}
                    sx={{ bgcolor: '#002B7F', '&:hover': { bgcolor: '#001F5C' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1.25 }}
                  >
                    {downloading ? 'Generando PDF...' : 'Descargar Etiqueta CR PDF'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Regenerate */}
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Refresh sx={{ color: '#002B7F', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Regenerar Etiqueta CR
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontSize: '0.82rem' }}>
                Genera una etiqueta CR sin afectar el consecutivo.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Casillero CR *" value={regenCode}
                    onChange={e => setRegenCode(e.target.value.toUpperCase())}
                    fullWidth size="small" placeholder="CR-TP-0001"
                    InputProps={{ sx: { fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem' } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Nombre (opcional)" value={regenName}
                    onChange={e => setRegenName(e.target.value)}
                    fullWidth size="small" placeholder="Nombre del cliente" />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained" fullWidth
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                    disabled={!regenCode.trim() || downloading}
                    onClick={() => {
                      setCode(regenCode)
                      setClientName(regenName)
                      setTimeout(() => handleDownloadOnly(regenCode), 300)
                    }}
                    sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, borderRadius: 2, fontWeight: 700, textTransform: 'none', py: 1.25 }}
                  >
                    Descargar PDF
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Preview ── */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Vista Previa
              </Typography>
              <Box ref={previewContainerRef} sx={{ width: '100%' }}>
                <Box sx={{
                  width: '100%',
                  overflow: 'hidden',
                  height: 520 * previewScale,
                }}>
                  <Box sx={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    width: 800,
                  }}>
                    <CRLabelPreview code={code} name={clientName} />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Hidden: Shipping info page for PDF capture */}
      <Box sx={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CRShippingInfoPage code={code} name={clientName} />
      </Box>
    </Box>
  )
}
