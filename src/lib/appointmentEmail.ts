import { sendEmail } from './email'

interface AppointmentData {
  apptNumber: string
  serviceType: string
  appointmentDate: Date | string
  appointmentTime: string
  clientName: string
  clientEmail: string
  clientPhone: string
  companyName?: string | null
  description?: string | null
  pieces?: number | null
  weight?: number | null
}

interface WarehouseData {
  name: string
  address?: string | null
  phone?: string | null
}

const SERVICE_LABELS: Record<string, string> = {
  ENTREGA_CARGA: 'Entrega de Carga',
  RETIRO_CARGA: 'Retiro de Carga',
}

export async function sendAppointmentConfirmation(
  appointment: AppointmentData,
  warehouse: WarehouseData
) {
  const date = new Date(appointment.appointmentDate)
  const formattedDate = date.toLocaleDateString('es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Panama',
  })

  const serviceLabel = SERVICE_LABELS[appointment.serviceType] || appointment.serviceType

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C41E3A 0%,#8B0000 100%);padding:30px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;">TP LOGISTICS</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Confirmacion de Cita</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="color:#333;font-size:16px;margin:0 0 8px;font-weight:600;">
                Hola ${appointment.clientName},
              </p>
              <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Tu cita ha sido confirmada exitosamente. A continuacion los detalles:
              </p>

              <!-- Reference Number -->
              <div style="background:#FEF2F2;border:2px solid #FACC15;border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:24px;">
                <p style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Numero de Referencia</p>
                <p style="color:#FACC15;font-size:24px;font-weight:800;margin:0;font-family:monospace;letter-spacing:2px;">${appointment.apptNumber}</p>
              </div>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Almacen</span><br>
                    <span style="color:#333;font-size:15px;font-weight:600;">${warehouse.name}</span>
                    ${warehouse.address ? `<br><span style="color:#666;font-size:13px;">${warehouse.address}</span>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Servicio</span><br>
                    <span style="color:#333;font-size:15px;font-weight:600;">${serviceLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br>
                    <span style="color:#333;font-size:15px;font-weight:600;">${formattedDate}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Hora</span><br>
                    <span style="color:#333;font-size:15px;font-weight:600;">${appointment.appointmentTime}</span>
                  </td>
                </tr>
                ${appointment.description ? `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Descripcion</span><br>
                    <span style="color:#333;font-size:14px;">${appointment.description}</span>
                  </td>
                </tr>` : ''}
              </table>

              ${warehouse.phone ? `
              <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 16px;">
                Si necesitas modificar o cancelar tu cita, contacta al almacen al <strong>${warehouse.phone}</strong>.
              </p>` : ''}

              <p style="color:#999;font-size:12px;margin:24px 0 0;text-align:center;">
                Este correo fue enviado automaticamente. Por favor no responda a este mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} TP Logistics — Panama
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  await sendEmail(
    appointment.clientEmail,
    `TP Logistics — Confirmacion de Cita #${appointment.apptNumber}`,
    html
  )
}
