import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const json = await request.json()
        const amount = parseFloat(json.amount)

        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
        }

        const sale = await prisma.sale.findUnique({ where: { id } })
        if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

        if (sale.remainingAmount <= 0) {
            return NextResponse.json({ error: 'Sale is already paid in full' }, { status: 400 })
        }

        const newPaidAmount = sale.paidAmount + amount
        const newRemainingAmount = Math.max(0, sale.total - newPaidAmount)
        const newStatus = newRemainingAmount === 0 ? 'PAID' : sale.status

        const updatedSale = await prisma.sale.update({
            where: { id },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus
            }
        })

        return NextResponse.json(updatedSale)
    } catch (error: any) {
        console.error('Payment error:', error)
        return NextResponse.json({ error: 'Error recording payment', details: error.message }, { status: 500 })
    }
}
