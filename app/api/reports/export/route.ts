import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const [sales, expenses, inventory] = await Promise.all([
            prisma.sale.findMany({
                orderBy: { createdAt: 'desc' },
                include: { items: { include: { product: true } } }
            }),
            prisma.expense.findMany({
                orderBy: { date: 'desc' }
            }),
            prisma.product.findMany({
                orderBy: { name: 'asc' },
                include: { category: true }
            })
        ])

        return NextResponse.json({ sales, expenses, inventory })
    } catch (error) {
        console.error('Export Error:', error)
        return NextResponse.json({ error: 'Failed to generate export data' }, { status: 500 })
    }
}
