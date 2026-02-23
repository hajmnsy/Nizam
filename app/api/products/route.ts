export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const product = await prisma.product.create({
            data: {
                name: json.name,
                type: json.type,
                price: parseFloat(json.price),
                quantity: parseInt(json.quantity),
                weightPerUnit: parseFloat(json.weightPerUnit),
                length: parseFloat(json.length),
                thickness: parseFloat(json.thickness),
                width: parseFloat(json.width),
                categoryId: parseInt(json.categoryId) || 1
            }
        })
        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
    }
}
