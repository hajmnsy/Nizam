export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
    try {
        const data = await request.json()
        const { id, quantity, price } = data

        if (!id) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
        }

        const updateData: any = {}
        if (quantity !== undefined) updateData.quantity = Number(quantity)
        if (price !== undefined) updateData.price = Number(price)

        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: updateData
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
