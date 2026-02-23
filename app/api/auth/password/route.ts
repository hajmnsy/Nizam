import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
    try {
        const token = cookies().get('session_token')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        })

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 })
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, session.user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        })

        // Terminate other sessions for security (Optional, but good practice)
        await prisma.session.deleteMany({
            where: {
                userId: session.user.id,
                NOT: {
                    token: token
                }
            }
        })

        return NextResponse.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' })
    } catch (error) {
        console.error('Password Update Error:', error)
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }
}
