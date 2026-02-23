export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] })
    }

    try {
        const [products, customers, sales] = await Promise.all([
            // Search Products
            prisma.product.findMany({
                where: {
                    name: { contains: query }
                },
                take: 5,
                select: { id: true, name: true, quantity: true, price: true }
            }),
            // Search Sales by Customer
            prisma.sale.findMany({
                where: {
                    customer: { contains: query }
                },
                take: 3,
                select: { id: true, customer: true, total: true, createdAt: true }
            }),
            // Search Sales by ID (if query is number)
            !isNaN(Number(query)) ? prisma.sale.findMany({
                where: { id: parseInt(query) },
                select: { id: true, customer: true, total: true, createdAt: true }
            }) : []
        ])

        return NextResponse.json({
            results: [
                ...products.map(p => ({ type: 'product', ...p })),
                ...customers.map(c => ({ type: 'customer', ...c })),
                ...(Array.isArray(sales) ? sales : []).map(s => ({ type: 'sale', ...s }))
            ]
        })
    } catch (error) {
        return NextResponse.json({ results: [] })
    }
}
