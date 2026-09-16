import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditarHblPaClient } from './client'

export default function EditarHblPaPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <EditarHblPaClient id={params.id} />
    </DashboardLayout>
  )
}
