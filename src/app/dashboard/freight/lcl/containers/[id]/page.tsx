import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ContenedorDetailClient } from './client'

export default function ContenedorDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <ContenedorDetailClient id={params.id} />
    </DashboardLayout>
  )
}
