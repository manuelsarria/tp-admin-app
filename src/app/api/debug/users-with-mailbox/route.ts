import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/debug/users-with-mailbox - Debug endpoint to see all users with mailbox
export async function GET() {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mailbox: true,
        isActive: true,
        companyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const usersWithMailbox = await prisma.user.findMany({
      where: {
        mailbox: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        mailbox: true,
        isActive: true,
        companyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const activeUsersWithMailbox = await prisma.user.findMany({
      where: {
        isActive: true,
        mailbox: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        mailbox: true,
        isActive: true,
        companyId: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      allUsersCount: allUsers.length,
      allUsers,
      usersWithMailboxCount: usersWithMailbox.length,
      usersWithMailbox,
      activeUsersWithMailboxCount: activeUsersWithMailbox.length,
      activeUsersWithMailbox,
    })
  } catch (error) {
    console.error('GET /api/debug/users-with-mailbox error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
