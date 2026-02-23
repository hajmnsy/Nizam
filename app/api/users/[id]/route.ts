import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const json = await request.json()
        const updateData: any = { role: json.role }

        // Only update password if provided
        if (json.password) {
            updateData.password = hashPassword(json.password)
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, username: true, role: true, createdAt: true }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        // Optional: Check if trying to delete the last admin
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
        const userToDelete = await prisma.user.findUnique({ where: { id } })

        if (userToDelete?.role === 'ADMIN' && adminCount <= 1) {
            return NextResponse.json({ error: 'لا يمكن حذف حساب المدير الوحيد في النظام' }, { status: 400 })
        }

        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
