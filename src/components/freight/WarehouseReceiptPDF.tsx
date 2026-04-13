import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export interface WarehouseEntryForReceipt {
  wrNumber: string
  clientName: string
  consigneeName?: string | null
  description?: string | null
  pieces: number
  pieceType: string
  weight?: number | null
  largo?: number | null
  ancho?: number | null
  alto?: number | null
  unidadMedida: string
  destWarehouse?: string | null
  originWarehouse: string
  status: string
  coordinatorName?: string | null
  createdAt: Date | string
}

interface Props {
  entry: WarehouseEntryForReceipt
  qrBase64: string
  logoBase64: string | null
}

const DEST_LABELS: Record<string, string> = {
  PANAMA_OESTE: 'Bodega Panamá Oeste',
  COLON_FREE_ZONE: 'Colón Free Zone',
  PANAMA_CIUDAD: 'Bodega Ciudad Panamá',
}

const STATUS_LABELS: Record<string, string> = {
  IN_WAREHOUSE: 'En Bodega',
  IN_TRANSIT: 'En Tránsito',
  ARRIVED: 'Llegó a Panamá',
  DELIVERED: 'Entregado',
}

const fmtDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const RED = '#FACC15'
const DARK = '#1a1a1a'
const LIGHT_GRAY = '#F5F5F5'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: RED,
  },
  logo: {
    width: 120,
    height: 36,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 120,
    height: 36,
    backgroundColor: RED,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: RED,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 7.5,
    color: '#555',
    marginBottom: 1,
  },
  // Title
  titleBar: {
    backgroundColor: RED,
    padding: 8,
    marginBottom: 14,
    borderRadius: 3,
  },
  titleText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // Main content layout
  contentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  // Left: data table
  dataTable: {
    flex: 1,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  dataLabel: {
    width: 110,
    backgroundColor: RED,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    padding: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataValue: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    color: DARK,
    fontSize: 8.5,
    padding: 5,
    fontFamily: 'Helvetica',
  },
  // Right: QR section
  qrSection: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
  },
  qrImage: {
    width: 100,
    height: 100,
    marginBottom: 6,
  },
  qrLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
  },
  footerBold: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 2,
  },
})

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.dataRow}>
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={s.dataValue}>{value}</Text>
    </View>
  )
}

export function WarehouseReceiptPDF({ entry, qrBase64, logoBase64 }: Props) {
  const destLabel = entry.destWarehouse
    ? DEST_LABELS[entry.destWarehouse] || entry.destWarehouse
    : '-'
  const statusLabel = STATUS_LABELS[entry.status] || entry.status
  const dims =
    entry.largo && entry.ancho && entry.alto
      ? `${entry.largo} × ${entry.ancho} × ${entry.alto} ${entry.unidadMedida}`
      : '-'
  const createdDate = fmtDate(entry.createdAt)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            {logoBase64 ? (
              <Image src={logoBase64} style={s.logo} />
            ) : (
              <View style={s.logoPlaceholder}>
                <Text style={s.logoPlaceholderText}>CNC</Text>
              </View>
            )}
          </View>
          <View style={s.companyInfo}>
            <Text style={s.companyName}>TP Logistics</Text>
            <Text style={s.companyDetail}>155715816-2-2021 DV 36</Text>
            <Text style={s.companyDetail}>Calle 5ta y Av. 3ra, Edif. 9570</Text>
            <Text style={s.companyDetail}>France Field, Zona Libre Colón, Panamá</Text>
            <Text style={s.companyDetail}>TEL: +507 6377-7906</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.titleBar}>
          <Text style={s.titleText}>Warehouse Receipt</Text>
        </View>

        {/* Main content */}
        <View style={s.contentRow}>
          {/* Data table */}
          <View style={s.dataTable}>
            <DataRow label="DO / WR #" value={entry.wrNumber} />
            <DataRow label="Fecha" value={createdDate} />
            <DataRow label="Cliente" value={entry.clientName} />
            <DataRow label="Consignee" value={entry.consigneeName || entry.clientName} />
            <DataRow label="Estado" value={statusLabel} />
            <DataRow label="Coordinador" value={entry.coordinatorName || '-'} />
            <DataRow
              label="Piezas"
              value={`${entry.pieces} ${entry.pieceType}`}
            />
            <DataRow label="Descripción" value={entry.description || '-'} />
            <DataRow label="Dimensiones" value={dims} />
            <DataRow label="Peso" value={entry.weight ? `${entry.weight} KG` : '-'} />
            <DataRow label="Origen" value={entry.originWarehouse} />
            <DataRow label="Destino" value={destLabel} />
          </View>

          {/* QR Code */}
          <View style={s.qrSection}>
            <Image src={qrBase64} style={s.qrImage} />
            <Text style={s.qrLabel}>{entry.wrNumber}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Fecha de elaboración:</Text>
          <Text style={s.footerBold}>{createdDate}</Text>
          <Text style={[s.footerText, { marginTop: 6 }]}>
            Este documento es generado automáticamente por el sistema TP Logistics.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
