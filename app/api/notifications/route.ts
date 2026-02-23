import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20 // Only fetch the last 20 notifications 
        })
        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }
}

// Mark notifications as read
export async function PUT(request: Request) {
    try {
        const { ids } = await request.json()

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        await prisma.notification.updateMany({
            where: { id: { in: ids } },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating notifications:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }
}
