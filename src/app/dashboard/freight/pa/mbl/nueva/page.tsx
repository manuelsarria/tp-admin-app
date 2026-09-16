import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclContainerForm } from '@/components/freight/LclContainerForm'

export default function PaNuevoMblPage() {
  return (
    <DashboardLayout>
      <LclContainerForm origin="PANAMA" />
    </DashboardLayout>
  )
}
