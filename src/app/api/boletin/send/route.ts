export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { sendEmail } from '@/lib/email'

interface SendPayload {
  containerId: string
  containerNumber?: string
  mblNumber: string
  vessel?: string
  etd?: string
  eta?: string
  status: string
  recipients: { name: string; email: string }[]
  bookings: { hblNumber: string; clientName: string; packages: number; cbm?: number; description?: string }[]
}

function buildEmailHtml(data: SendPayload): string {
  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

  const statusLabel: Record<string, string> = {
    OPEN: 'Abierto', LOADING: 'Cargando', CLOSED: 'Cerrado',
    IN_TRANSIT: 'En Tránsito', ARRIVED: 'Llegado', COMPLETED: 'Completado',
  }

  const statusColor: Record<string, string> = {
    OPEN: '#3B82F6', LOADING: '#F59E0B', CLOSED: '#6B7280',
    IN_TRANSIT: '#0066CC', ARRIVED: '#10B981', COMPLETED: '#059669',
  }

  const bookingRows = data.bookings.map(b => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;font-weight:600;color:#FACC15;font-family:monospace;">${b.hblNumber}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;">${b.clientName}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;text-align:center;">${b.packages}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;text-align:center;">${b.cbm?.toFixed(3) || '—'}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;">${b.description || '—'}</td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#fff;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F172A,#FACC15);padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:0.5px;">TP LOGISTICS</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Actualización Semanal de Contenedor</p>
    </div>

    <div style="padding:32px 40px;">
      <!-- Container Info -->
      <div style="background:#F8FAFC;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #E5E7EB;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="margin:0;font-size:18px;color:#0F172A;">Contenedor ${data.containerNumber || data.mblNumber}</h2>
          <span style="background:${statusColor[data.status] || '#6B7280'};color:#fff;padding:6px 16px;border-radius:100px;font-size:12px;font-weight:700;">
            ${statusLabel[data.status] || data.status}
          </span>
        </div>
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:6px 0;"><strong>MBL:</strong> ${data.mblNumber}</td>
            <td style="padding:6px 0;"><strong>Buque:</strong> ${data.vessel || '—'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;"><strong>Zarpe (ETD):</strong> ${fmtDate(data.etd)}</td>
            <td style="padding:6px 0;"><strong>Llegada (ETA):</strong> ${fmtDate(data.eta)}</td>
          </tr>
        </table>
      </div>

      <!-- Bookings Table -->
      <h3 style="margin:0 0 12px;font-size:15px;color:#0F172A;">Detalle de Carga</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#334155;">
        <thead>
          <tr style="background:#F1F5F9;">
            <th style="padding:10px 14px;text-align:left;font-weight:700;font-size:12px;color:#6B7280;">HBL</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;font-size:12px;color:#6B7280;">Cliente</th>
            <th style="padding:10px 14px;text-align:center;font-weight:700;font-size:12px;color:#6B7280;">Bultos</th>
            <th style="padding:10px 14px;text-align:center;font-weight:700;font-size:12px;color:#6B7280;">CBM</th>
            <th style="padding:10px 14px;text-align:left;font-weight:700;font-size:12px;color:#6B7280;">Descripción</th>
          </tr>
        </thead>
        <tbody>${bookingRows}</tbody>
      </table>

      <!-- Tracking Link -->
      <div style="text-align:center;margin-top:32px;">
        <a href="https://tplogist.com/trackyourparcel" style="background:#FACC15;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
          Rastrea tu Paquete
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#F8FAFC;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">TP Logistics — Panamá | +507 6377-7906</p>
      <p style="margin:4px 0 0;font-size:11px;color:#CBD5E1;">Este es un boletín informativo semanal sobre el estado de tu carga.</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: SendPayload = await request.json()
    if (!payload.containerId || !payload.recipients?.length) {
      return NextResponse.json({ error: 'containerId and recipients required' }, { status: 400 })
    }

    const html = buildEmailHtml(payload)
    const subject = `📦 Actualización Contenedor ${payload.containerNumber || payload.mblNumber} — TP Logistics`

    const results: { email: string; success: boolean; error?: string }[] = []

    for (const r of payload.recipients) {
      try {
        await sendEmail(r.email, subject, html)
        // Log the send
        await prisma.boletinEnvio.create({
          data: {
            lclContainerId: payload.containerId,
            containerNumber: payload.containerNumber || null,
            mblNumber: payload.mblNumber,
            clienteNombre: r.name,
            clienteEmail: r.email,
            enviadoPor: session.user.name || session.user.email || 'Admin',
          },
        })
        results.push({ email: r.email, success: true })
      } catch (err: any) {
        results.push({ email: r.email, success: false, error: err.message })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('POST /api/boletin/send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
