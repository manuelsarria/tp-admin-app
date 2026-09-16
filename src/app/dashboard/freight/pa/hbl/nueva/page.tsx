import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclBookingForm } from '@/components/freight/LclBookingForm'

export default function PaNuevoHblPage() {
  return (
    <DashboardLayout>
      <LclBookingForm origin="PANAMA" />
    </DashboardLayout>
  )
}
