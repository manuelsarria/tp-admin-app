'use client'

import { LclContainerDetail } from '@/components/freight/LclContainerDetail'

export function MblPaDetailClient({ id }: { id: string }) {
  return <LclContainerDetail id={id} origin="PANAMA" />
}
