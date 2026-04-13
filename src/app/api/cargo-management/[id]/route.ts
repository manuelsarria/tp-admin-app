import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCargoManagementSchema } from '@/lib/validation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const record = await prisma.cargoManagement.findUnique({
      where: { id: params.id },
      include: {
        statusHistory: {
          orderBy: { changedAt: 'asc' }
        }
      }
    })
    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error(`GET /api/cargo-management/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.log('PATCH request for ID:', params.id)
    const body = await request.json()
    console.log('PATCH body received:', body)

    const validated = updateCargoManagementSchema.parse(body)
    console.log('Validated data:', validated)

    // Get the current record to check if status changed
    const currentRecord = await prisma.cargoManagement.findUnique({
      where: { id: params.id }
    })

    console.log('Current record found:', currentRecord ? 'Yes' : 'No')

    if (!currentRecord) {
      console.error('Record not found for ID:', params.id)
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Only include fields that are present in the validated data
    if (validated.containerNumber !== undefined) {
      updateData.containerNumber = validated.containerNumber
    }
    if (validated.eta !== undefined) {
      updateData.eta = new Date(validated.eta)
    }
    if (validated.location !== undefined) {
      updateData.location = validated.location
    }
    if (validated.status !== undefined) {
      updateData.status = validated.status
    }
    if (validated.shippingLine !== undefined) {
      updateData.shippingLine = validated.shippingLine
    }
    if (validated.departureDate !== undefined) {
      updateData.departureDate = validated.departureDate ? new Date(validated.departureDate) : null
    }

    console.log('Update data to be saved:', updateData)

    // Update record and create status history if status changed
    const record = await prisma.$transaction(async (tx) => {
      try {
        console.log('Starting transaction update for ID:', params.id)
        const updated = await tx.cargoManagement.update({
          where: { id: params.id },
          data: updateData,
        })
        console.log('Record updated successfully')

        // Create status history entry if status changed
        if (validated.status !== undefined && validated.status !== currentRecord.status) {
          console.log('Creating status history entry:', {
            cargoManagementId: params.id,
            status: validated.status,
            oldStatus: currentRecord.status
          })
          await tx.statusHistory.create({
            data: {
              cargoManagementId: params.id,
              status: validated.status,
            }
          })
          console.log('Status history created for status change:', validated.status)
        } else {
          console.log('Status not changed, skipping history entry')
        }

        return updated
      } catch (txError) {
        console.error('Transaction error:', txError)
        throw txError
      }
    })

    console.log('Updated record:', record)
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues)
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
    }
    console.error(`PATCH /api/cargo-management/${params.id} error:`, error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json({
      error: 'Internal server error',
      message: (error as Error).message,
      details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'WORKER'].includes(session.user.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.cargoManagement.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`DELETE /api/cargo-management/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
