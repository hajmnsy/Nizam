import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const purchase = await prisma.purchase.findUnique({
            where: { id: parseInt(params.id) },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
        }

        return NextResponse.json(purchase)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching purchase' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.findUnique({
                where: { id: parseInt(params.id) },
                include: { items: true }
            })

            if (!purchase) {
                throw new Error('Purchase not found')
            }

            // Restore stock (decrement what was incremented)
            for (const item of purchase.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                })
            }

            // Delete the purchase (cascades to items)
            await tx.purchase.delete({
                where: { id: parseInt(params.id) }
            })

            return purchase
        })

        return NextResponse.json({ success: true, deleted: result })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error deleting purchase' }, { status: 500 })
    }
}
