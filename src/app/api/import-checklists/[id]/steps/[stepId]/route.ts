import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function PUT(req: NextRequest, { params }: { params: { id: string; stepId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify checklist ownership
    const checklist = await prisma.importChecklist.findUnique({ where: { id: params.id } })
    if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
    if (session.user.role !== 'ADMIN' && checklist.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data: Record<string, any> = {}

    if (body.status !== undefined) {
      data.status = body.status
      if (body.status === 'COMPLETED') {
        data.completedAt = new Date()
      } else {
        data.completedAt = null
      }
    }
    if (body.notes !== undefined) data.notes = body.notes
    if (body.name !== undefined) data.name = body.name

    const step = await prisma.checklistStep.update({
      where: { id: params.stepId },
      data,
    })

    // Auto-complete checklist if all steps are COMPLETED
    const allSteps = await prisma.checklistStep.findMany({ where: { checklistId: params.id } })
    const allCompleted = allSteps.every(s => s.status === 'COMPLETED')
    if (allCompleted && checklist.status === 'ACTIVE') {
      await prisma.importChecklist.update({
        where: { id: params.id },
        data: { status: 'COMPLETED' },
      })
    } else if (!allCompleted && checklist.status === 'COMPLETED') {
      // Reopen if a step was unchecked
      await prisma.importChecklist.update({
        where: { id: params.id },
        data: { status: 'ACTIVE' },
      })
    }

    return NextResponse.json(step)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error updating step' }, { status: 500 })
  }
}
