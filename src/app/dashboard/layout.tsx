import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/')
  }

  return <DashboardLayout>{children}</DashboardLayout>
}