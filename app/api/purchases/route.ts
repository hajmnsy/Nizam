export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        
        const total = json.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)

        const result = await prisma.$transaction(async (tx) => {
            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber: json.invoiceNumber || null,
                    supplier: json.supplier || 'مورد عام',
                    total: total,
                    status: 'COMPLETED',
                    createdAt: json.createdAt ? new Date(`${json.createdAt}T00:00:00.000+02:00`) : new Date(),
                    items: {
                        create: json.items.map((item: any) => ({
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity),
                            price: parseFloat(item.price)
                        }))
                    }
                },
                include: {
                    items: true
                }
            });

            // Update stock
            for (const item of json.items) {
                await tx.product.update({
                    where: { id: parseInt(item.productId) },
                    data: {
                        quantity: {
                            increment: parseInt(item.quantity)
                        }
                    }
                })
            }

            return purchase;
        });

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error creating purchase:', error)
        return NextResponse.json({
            error: 'Error creating purchase',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    try {
        let whereClause: any = {}

        const supplier = searchParams.get('supplier')
        if (supplier) {
            whereClause.supplier = { contains: supplier }
        }

        if (dateParam) {
            const startDate = new Date(`${dateParam}T00:00:00.000+02:00`)
            const endDate = new Date(`${dateParam}T23:59:59.999+02:00`)

            whereClause.createdAt = {
                gte: startDate,
                lte: endDate
            }
        }

        const purchases = await prisma.purchase.findMany({
            where: whereClause,
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(purchases)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching purchases' }, { status: 500 })
    }
}
