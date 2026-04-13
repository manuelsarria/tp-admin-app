import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclBookingList } from '@/components/freight/LclBookingList'

export default function LclBookingsPage() {
  return (
    <DashboardLayout>
      <LclBookingList />
    </DashboardLayout>
  )
}
