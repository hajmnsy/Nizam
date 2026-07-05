import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId || isNaN(parseInt(productId))) {
        return NextResponse.json({ error: 'Valid Product ID is required' }, { status: 400 })
    }

    try {
        const pId = parseInt(productId)
        const branchId = getActiveBranchId()

        // Get Sales History
        const sales = await prisma.saleItem.findMany({
            where: { 
                productId: pId,
                sale: { branchId }
            },
            include: {
                sale: true
            }
        })

        // Get Purchases History
        const purchases = await prisma.purchaseItem.findMany({
            where: { 
                productId: pId,
                purchase: { branchId }
            },
            include: {
                purchase: true
            }
        })

        // Combine and format
        const history: any[] = []

        sales.forEach(saleItem => {
            if (saleItem.sale.status !== 'QUOTATION') {
                history.push({
                    type: 'SALE',
                    date: saleItem.sale.createdAt,
                    invoiceNumber: saleItem.sale.invoiceNumber || saleItem.sale.id,
                    customerOrSupplier: saleItem.sale.customer || 'عميل نقدي',
                    quantity: saleItem.quantity,
                    price: saleItem.price,
                })
            }
        })

        purchases.forEach(purchaseItem => {
            history.push({
                type: 'PURCHASE',
                date: purchaseItem.purchase.createdAt,
                invoiceNumber: purchaseItem.purchase.invoiceNumber || purchaseItem.purchase.id,
                customerOrSupplier: purchaseItem.purchase.supplier || 'مورد عام',
                quantity: purchaseItem.quantity,
                price: purchaseItem.price,
            })
        })

        // Sort by date descending
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json({ history })
    } catch (error) {
        console.error('Error fetching item history:', error)
        return NextResponse.json({ error: 'Error fetching item history' }, { status: 500 })
    }
}
