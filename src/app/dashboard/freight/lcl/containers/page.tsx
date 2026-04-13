import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { LclContainerList } from '@/components/freight/LclContainerList'

export default function LclContainersPage() {
  return (
    <DashboardLayout>
      <LclContainerList />
    </DashboardLayout>
  )
}
