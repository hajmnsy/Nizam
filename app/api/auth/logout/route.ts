import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST() {
    try {
        const cookieStore = cookies()
        const token = cookieStore.get('session_token')?.value

        if (token) {
            await prisma.session.deleteMany({
                where: { token }
            })
        }

        const response = NextResponse.json({ success: true })
        response.cookies.set('session_token', '', {
            httpOnly: true,
            path: '/',
            expires: new Date(0),
        })

        return response
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ' },
            { status: 500 }
        )
    }
}
