import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EditarBookingClient } from './client'

export default function EditarBookingPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <EditarBookingClient id={params.id} />
    </DashboardLayout>
  )
}
