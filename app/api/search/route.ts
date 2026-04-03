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
            prisma.sale.groupBy({
                by: ['customer'],
                where: {
                    customer: { contains: query }
                },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            }),
            // Search Sales by ID (if query is number)
            !isNaN(Number(query)) ? prisma.sale.findMany({
                where: { 
                    OR: [
                        { id: parseInt(query) },
                        { invoiceNumber: parseInt(query) }
                    ]
                 },
                select: { id: true, invoiceNumber: true, customer: true, total: true, createdAt: true }
            }) : []
        ])

        return NextResponse.json({
            results: [
                ...products.map(p => ({ type: 'product', ...p })),
                ...customers.map(c => ({ type: 'customer', name: c.customer, count: c._count.id })),
                ...(Array.isArray(sales) ? sales : []).map(s => ({ type: 'sale', ...s }))
            ]
        })
    } catch (error) {
        return NextResponse.json({ results: [] })
    }
}
