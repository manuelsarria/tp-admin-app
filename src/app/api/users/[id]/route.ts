import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { isSuperAdmin } from '@/lib/permissions'
import * as bcrypt from 'bcryptjs'

// PUT - Update user (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, role, companyId, isActive, mailbox, address, ruc_id, password } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const requesterIsSuperAdmin = isSuperAdmin(session.user.email)

    // Only the super-admin may promote a user to ADMIN.
    if (role === 'ADMIN' && existingUser.role !== 'ADMIN' && !requesterIsSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo el administrador principal puede asignar el rol ADMIN' },
        { status: 403 }
      )
    }

    // The super-admin account can only be modified by itself.
    if (isSuperAdmin(existingUser.email) && !requesterIsSuperAdmin) {
      return NextResponse.json(
        { error: 'No puedes modificar la cuenta del administrador principal' },
        { status: 403 }
      )
    }

    // ADMIN accounts can only be modified by the super-admin or by the admin
    // themselves — a regular admin cannot edit/demote/reset a peer admin.
    if (
      existingUser.role === 'ADMIN' &&
      existingUser.id !== session.user.id &&
      !requesterIsSuperAdmin
    ) {
      return NextResponse.json(
        { error: 'Solo el administrador principal puede modificar a otros administradores' },
        { status: 403 }
      )
    }

    // If email is being changed, check if new email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(role && { role }),
        ...(companyId !== undefined && { companyId: companyId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(mailbox !== undefined && { mailbox: mailbox ? mailbox : null }),
        ...(address !== undefined && { address: address ? address : null }),
        ...(ruc_id !== undefined && { ruc_id: ruc_id ? ruc_id : null }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        mailbox: true,
        address: true,
        ruc_id: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (Admin only) - Actually just deactivates
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Deactivate user instead of deleting
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
