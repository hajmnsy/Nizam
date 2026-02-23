import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const token = request.headers.get('cookie')?.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1]

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: { select: { id: true, username: true, role: true } } }
        })

        if (!session || session.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json(session.user)
    } catch (error) {
        console.error('Auth Error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
