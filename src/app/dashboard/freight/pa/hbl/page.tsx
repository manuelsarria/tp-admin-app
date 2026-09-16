import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclBookingList } from '@/components/freight/LclBookingList'

export default function PaHblPage() {
  return (
    <DashboardLayout>
      <LclBookingList origin="PANAMA" />
    </DashboardLayout>
  )
}
