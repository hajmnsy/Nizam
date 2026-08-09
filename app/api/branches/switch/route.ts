import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { branchId } = await request.json()

        if (!branchId || isNaN(parseInt(branchId))) {
            return NextResponse.json({ error: 'Invalid branch ID' }, { status: 400 })
        }

        const cookieStore = cookies()
        const token = cookieStore.get('session_token')?.value

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        })

        if (!session || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const targetBranchId = parseInt(branchId)

        // Restrict non-admin users to their assigned branch only
        if (session.user.role !== 'ADMIN' && session.user.branchId !== null) {
            if (session.user.branchId !== targetBranchId) {
                return NextResponse.json(
                    { error: 'غير مسموح لك بالدخول إلى فروع أخرى' },
                    { status: 403 }
                )
            }
        }

        // Set the active branch cookie for 30 days
        cookieStore.set('active_branch_id', targetBranchId.toString(), {
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            httpOnly: false,
            sameSite: 'lax',
        })

        return NextResponse.json({ success: true, activeBranchId: targetBranchId })
    } catch (error) {
        console.error('Error switching branch:', error)
        return NextResponse.json({ error: 'Failed to switch branch' }, { status: 500 })
    }
}
