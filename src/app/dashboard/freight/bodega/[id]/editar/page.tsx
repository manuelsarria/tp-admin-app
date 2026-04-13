import { WarehouseEditPageClient } from './WarehouseEditPageClient'

export default function EditarBodegaPage({ params }: { params: { id: string } }) {
  return <WarehouseEditPageClient id={params.id} />
}
