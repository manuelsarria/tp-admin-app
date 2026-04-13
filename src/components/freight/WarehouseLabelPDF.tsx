import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'

export interface WarehouseEntryForPDF {
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
}

interface Props {
  entry: WarehouseEntryForPDF
  barcodeBase64: string
  qrBase64: string
}

const DEST_LABELS: Record<string, string> = {
  PANAMA_OESTE: 'Bodega Panamá Oeste',
  COLON_FREE_ZONE: 'Colón Free Zone',
  PANAMA_CIUDAD: 'Bodega Ciudad Panamá',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1a1a1a',
    padding: 0,
    backgroundColor: '#ffffff',
  },
  labelPage: {
    padding: 14,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FACC15',
    paddingBottom: 6,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FACC15',
  },
  companyInfo: {
    fontSize: 6.5,
    color: '#555',
    textAlign: 'right',
  },
  // Shipper / Consignee section
  partiesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    padding: 5,
  },
  partyLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
  },
  // WR Number section
  wrSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  wrLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  wrNumber: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  infoCellLast: {
    marginRight: 0,
  },
  infoLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#222',
  },
  // Description row
  descRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  descCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  descCellLast: {
    marginRight: 0,
  },
  // Barcode / QR section
  codesSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  barcode: {
    width: 200,
    height: 40,
    marginBottom: 3,
  },
  barcodeText: {
    fontSize: 7,
    color: '#444',
    marginBottom: 6,
    letterSpacing: 1,
  },
  qr: {
    width: 80,
    height: 80,
  },
  pieceIndicator: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#FACC15',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  pieceIndicatorText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#fff',
  },
})

function LabelPage({
  entry,
  pieceIndex,
  barcodeBase64,
  qrBase64,
}: {
  entry: WarehouseEntryForPDF
  pieceIndex: number
  barcodeBase64: string
  qrBase64: string
}) {
  const destLabel = entry.destWarehouse ? (DEST_LABELS[entry.destWarehouse] || entry.destWarehouse) : '-'
  const dims =
    entry.largo && entry.ancho && entry.alto
      ? `${entry.largo}×${entry.ancho}×${entry.alto} ${entry.unidadMedida}`
      : '-'

  return (
    <Page size="A5" style={s.page}>
      <View style={s.labelPage}>
        {/* Piece indicator badge */}
        <View style={s.pieceIndicator}>
          <Text style={s.pieceIndicatorText}>
            {pieceIndex} / {entry.pieces}
          </Text>
        </View>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>TP Logistics</Text>
          </View>
          <View>
            <Text style={s.companyInfo}>155715816-2-2021</Text>
            <Text style={s.companyInfo}>Calle 5ta y Av. 3ra, Edif. 9570</Text>
            <Text style={s.companyInfo}>France Field, Zona Libre Colón, Panamá</Text>
            <Text style={s.companyInfo}>+507 6377-7906</Text>
          </View>
        </View>

        {/* Shipper / Consignee */}
        <View style={s.partiesRow}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Shipper</Text>
            <Text style={s.partyName}>{entry.clientName}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Consignee</Text>
            <Text style={s.partyName}>{entry.consigneeName || entry.clientName}</Text>
          </View>
        </View>

        {/* WR Number */}
        <View style={s.wrSection}>
          <Text style={s.wrLabel}>Warehouse Receipt</Text>
          <Text style={s.wrNumber}>{entry.wrNumber}</Text>
        </View>

        {/* Info grid: Location / Piece / Total */}
        <View style={s.infoGrid}>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Location</Text>
            <Text style={s.infoValue}>{destLabel}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Piece #</Text>
            <Text style={s.infoValue}>{pieceIndex}</Text>
          </View>
          <View style={[s.infoCell, s.infoCellLast]}>
            <Text style={s.infoLabel}>Total Pieces</Text>
            <Text style={s.infoValue}>{entry.pieces} {entry.pieceType}</Text>
          </View>
        </View>

        {/* Description / Dimensions / Weight */}
        <View style={s.descRow}>
          <View style={s.descCell}>
            <Text style={s.infoLabel}>Description</Text>
            <Text style={s.infoValue}>{entry.description || '-'}</Text>
          </View>
          <View style={s.descCell}>
            <Text style={s.infoLabel}>Dimensions</Text>
            <Text style={s.infoValue}>{dims}</Text>
          </View>
          <View style={[s.descCell, s.descCellLast]}>
            <Text style={s.infoLabel}>Weight</Text>
            <Text style={s.infoValue}>{entry.weight ? `${entry.weight} KG` : '-'}</Text>
          </View>
        </View>

        {/* Barcode + QR */}
        <View style={s.codesSection}>
          <Image src={barcodeBase64} style={s.barcode} />
          <Text style={s.barcodeText}>{entry.wrNumber}</Text>
          <Image src={qrBase64} style={s.qr} />
        </View>
      </View>
    </Page>
  )
}

export function WarehouseLabelPDF({ entry, barcodeBase64, qrBase64 }: Props) {
  const pages = Array.from({ length: entry.pieces }, (_, i) => i + 1)

  return (
    <Document>
      {pages.map(i => (
        <LabelPage
          key={i}
          entry={entry}
          pieceIndex={i}
          barcodeBase64={barcodeBase64}
          qrBase64={qrBase64}
        />
      ))}
    </Document>
  )
}
