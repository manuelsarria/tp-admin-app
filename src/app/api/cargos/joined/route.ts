import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Get current user to check role and companyId
    const currentUser = await getCurrentUser()

    // Build the SQL query with conditional WHERE clause
    let joinedData

    if (currentUser?.role === 'BUSINESS_USER' && currentUser?.companyId) {
      // Filter by company for BUSINESS_USER role (sees data for their company)
      joinedData = await prisma.$queryRaw`
        SELECT
          fsh.id as "fclId",
          fsh."trackingWarehouse",
          fsh.forwarder,
          fsh.mailbox,
          fsh."transportType",
          fsh."containerNumber",
          fsh."approximateDate",
          fsh.misidentified,
          fsh."dangerousGoods",
          fsh."refrigeratedProduct",
          fsh."createdAt" as "fclCreatedAt",
          fsh."updatedAt" as "fclUpdatedAt",
          cm.id as "cargoManagementId",
          cm."referenceNo",
          cm.eta,
          cm.location,
          cm.status,
          cm."shippingLine",
          cm."departureDate",
          cm."createdAt" as "cmCreatedAt",
          cm."updatedAt" as "cmUpdatedAt"
        FROM fcl_shipments fsh
        INNER JOIN cargo_management cm ON fsh."containerNumber" = cm."referenceNo"
        WHERE fsh."companyId" = ${currentUser.companyId}
        ORDER BY fsh."createdAt" DESC
      `
    } else if (currentUser?.role === 'MBE_MANAGER') {
      // MBE_MANAGER sees all shipments where mailbox starts with 'MBE-'
      joinedData = await prisma.$queryRaw`
        SELECT
          fsh.id as "fclId",
          fsh."trackingWarehouse",
          fsh.forwarder,
          fsh.mailbox,
          fsh."transportType",
          fsh."containerNumber",
          fsh."approximateDate",
          fsh.misidentified,
          fsh."dangerousGoods",
          fsh."refrigeratedProduct",
          fsh."createdAt" as "fclCreatedAt",
          fsh."updatedAt" as "fclUpdatedAt",
          cm.id as "cargoManagementId",
          cm."referenceNo",
          cm.eta,
          cm.location,
          cm.status,
          cm."shippingLine",
          cm."departureDate",
          cm."createdAt" as "cmCreatedAt",
          cm."updatedAt" as "cmUpdatedAt"
        FROM fcl_shipments fsh
        INNER JOIN cargo_management cm ON fsh."containerNumber" = cm."referenceNo"
        WHERE fsh.mailbox ILIKE 'MBE%'
        ORDER BY fsh."createdAt" DESC
      `
    } else if (currentUser?.role === 'CUSTOMER_USER' && currentUser?.id) {
      // Filter by userId OR mailbox for CUSTOMER_USER role (sees data assigned to them)
      joinedData = await prisma.$queryRaw`
        SELECT
          fsh.id as "fclId",
          fsh."trackingWarehouse",
          fsh.forwarder,
          fsh.mailbox,
          fsh."transportType",
          fsh."containerNumber",
          fsh."approximateDate",
          fsh.misidentified,
          fsh."dangerousGoods",
          fsh."refrigeratedProduct",
          fsh."createdAt" as "fclCreatedAt",
          fsh."updatedAt" as "fclUpdatedAt",
          cm.id as "cargoManagementId",
          cm."referenceNo",
          cm.eta,
          cm.location,
          cm.status,
          cm."shippingLine",
          cm."departureDate",
          cm."createdAt" as "cmCreatedAt",
          cm."updatedAt" as "cmUpdatedAt"
        FROM fcl_shipments fsh
        INNER JOIN cargo_management cm ON fsh."containerNumber" = cm."referenceNo"
        WHERE fsh."userId" = ${currentUser.id} OR fsh.mailbox = ${currentUser.mailbox}
        ORDER BY fsh."createdAt" DESC
      `
    } else {
      // ADMIN and WORKER see all data
      joinedData = await prisma.$queryRaw`
        SELECT
          fsh.id as "fclId",
          fsh."trackingWarehouse",
          fsh.forwarder,
          fsh.mailbox,
          fsh."transportType",
          fsh."containerNumber",
          fsh."approximateDate",
          fsh.misidentified,
          fsh."dangerousGoods",
          fsh."refrigeratedProduct",
          fsh."createdAt" as "fclCreatedAt",
          fsh."updatedAt" as "fclUpdatedAt",
          cm.id as "cargoManagementId",
          cm."referenceNo",
          cm.eta,
          cm.location,
          cm.status,
          cm."shippingLine",
          cm."departureDate",
          cm."createdAt" as "cmCreatedAt",
          cm."updatedAt" as "cmUpdatedAt"
        FROM fcl_shipments fsh
        INNER JOIN cargo_management cm ON fsh."containerNumber" = cm."referenceNo"
        ORDER BY fsh."createdAt" DESC
      `
    }

    return NextResponse.json({
      data: joinedData,
      meta: {
        total: Array.isArray(joinedData) ? joinedData.length : 0,
      },
    })
  } catch (error) {
    console.error('GET /api/cargos/joined error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
