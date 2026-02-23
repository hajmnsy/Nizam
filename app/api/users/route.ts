export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

// Get all users
export async function GET(request: Request) {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

// Create a new user
export async function POST(request: Request) {
    try {
        const { username, password, role } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { username }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'اسم المستخدم مسجل مسبقاً' }, { status: 400 })
        }

        const user = await prisma.user.create({
            data: {
                username,
                password: hashPassword(password),
                role: role || 'CASHIER'
            },
            select: { id: true, username: true, role: true, createdAt: true }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}
