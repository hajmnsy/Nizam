import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { username }
        })

        if (!user || user.password !== hashPassword(password)) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            )
        }

        // Delete old sessions for this user
        await prisma.session.deleteMany({
            where: { userId: user.id }
        })

        // Create new session (7 days)
        const token = generateToken()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await prisma.session.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            }
        })

        const response = NextResponse.json({ success: true })
        response.cookies.set('session_token', token, {
            httpOnly: true,
            path: '/',
            expires: expiresAt,
            sameSite: 'lax',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        )
    }
}
