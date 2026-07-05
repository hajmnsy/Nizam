export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const branchId = getActiveBranchId()
        const [sales, expenses, inventory] = await Promise.all([
            prisma.sale.findMany({
                where: { branchId },
                orderBy: { createdAt: 'desc' },
                include: { items: { include: { product: true } } }
            }),
            prisma.expense.findMany({
                where: { branchId },
                orderBy: { date: 'desc' }
            }),
            prisma.product.findMany({
                where: { branchId },
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
