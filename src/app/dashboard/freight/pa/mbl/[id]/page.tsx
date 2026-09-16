import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { MblPaDetailClient } from './client'

export default function MblPaDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <MblPaDetailClient id={params.id} />
    </DashboardLayout>
  )
}
