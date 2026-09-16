import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclContainerList } from '@/components/freight/LclContainerList'

export default function PaMblPage() {
  return (
    <DashboardLayout>
      <LclContainerList origin="PANAMA" />
    </DashboardLayout>
  )
}
