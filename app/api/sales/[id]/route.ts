
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        return NextResponse.json(sale)
    } catch (error) {
        console.error('Error fetching sale:', error)
        return NextResponse.json(
            { error: 'Error fetching sale' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const json = await request.json()
        const { status, items, total, discount, customer } = json

        // Existing Scenario 1: Just converting QUOTATION to PAID without editing items
        if (status === 'PAID' && !items) {
            const sale = await prisma.sale.findUnique({
                where: { id },
                include: { items: true }
            })

            if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
            if (sale.status === 'PAID') return NextResponse.json({ error: 'Sale already paid' }, { status: 400 })

            for (const item of sale.items) {
                await prisma.product.update({
                    where: { id: item.productId },
                    data: { quantity: { decrement: item.quantity } }
                })
            }

            const updatedSale = await prisma.sale.update({
                where: { id },
                data: {
                    status: 'PAID',
                    paidAmount: sale.total - sale.discount,
                    remainingAmount: 0
                }
            })

            return NextResponse.json(updatedSale)
        }

        // Scenario 2: Full Invoice Editing
        if (items && Array.isArray(items)) {
            // Get original sale to reconcile stock
            const originalSale = await prisma.sale.findUnique({
                where: { id },
                include: { items: true }
            })

            if (!originalSale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })

            // Calculate new totals
            const newSubtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
            const newTotal = newSubtotal - (discount || 0)

            // Determine paidAmount and remainingAmount based on the new total and provided paidAmount
            const targetStatus = status || originalSale.status
            let newPaidAmount = newTotal;

            if (targetStatus === 'CREDIT' && json.paidAmount !== undefined) {
                newPaidAmount = Math.min(parseFloat(json.paidAmount), newTotal);
            } else if (targetStatus === 'QUOTATION') {
                newPaidAmount = 0;
            }

            const newRemainingAmount = Math.max(0, newTotal - newPaidAmount);

            // Use transaction for safe multi-step update
            const updatedSale = await prisma.$transaction(async (tx) => {
                // If the original sale was PAID or CREDIT, restore stock first
                if (originalSale.status === 'PAID' || originalSale.status === 'CREDIT') {
                    for (const oldItem of originalSale.items) {
                        await tx.product.update({
                            where: { id: oldItem.productId },
                            data: { quantity: { increment: oldItem.quantity } }
                        })
                    }
                }

                // Delete old items
                await tx.saleItem.deleteMany({
                    where: { saleId: id }
                })

                // Calculate discount proportion
                const discountRatio = newSubtotal > 0 && discount > 0 ? discount / newSubtotal : 0;

                // Prepare new items and calculate the actual total based on rounded unit prices
                let actualNewTotal = 0;
                const newItemsData = items.map((item: any) => {
                    const originalItemTotal = item.price * item.quantity;
                    const itemDiscount = originalItemTotal * discountRatio;
                    const newUnitPrice = parseFloat(((originalItemTotal - itemDiscount) / item.quantity).toFixed(2));

                    actualNewTotal += newUnitPrice * item.quantity;

                    return {
                        productId: parseInt(item.productId),
                        quantity: parseInt(item.quantity),
                        price: newUnitPrice
                    };
                });

                // Adjust paidAmount based on the actual new total if it was meant to be exactly full
                let adjustedPaidAmount = newPaidAmount;
                if (targetStatus === 'PAID') adjustedPaidAmount = actualNewTotal;
                else if (targetStatus === 'CREDIT' && newRemainingAmount === 0) adjustedPaidAmount = actualNewTotal;

                const actualRemainingAmount = Math.max(0, actualNewTotal - adjustedPaidAmount);

                // Create new items and update sale main data
                const newSale = await tx.sale.update({
                    where: { id },
                    data: {
                        customer: customer,
                        total: actualNewTotal,
                        discount: discount || 0,
                        paidAmount: adjustedPaidAmount,
                        remainingAmount: actualRemainingAmount,
                        status: actualRemainingAmount === 0 && targetStatus === 'CREDIT' ? 'PAID' : targetStatus,
                        items: {
                            create: newItemsData
                        }
                    },
                    include: { items: true }
                })

                // If new status is PAID or CREDIT, deduct the new quantities from stock
                if (newSale.status === 'PAID' || newSale.status === 'CREDIT') {
                    for (const newItem of items) {
                        await tx.product.update({
                            where: { id: parseInt(newItem.productId) },
                            data: { quantity: { decrement: parseInt(newItem.quantity) } }
                        })
                    }
                }

                return newSale
            })

            return NextResponse.json(updatedSale)
        }

        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 })

    } catch (error) {
        console.error('Error updating sale:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        // Find the sale first to get its items and status
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
        }

        // Perform deletion and stock restoration in a transaction
        await prisma.$transaction(async (tx) => {
            // Restore the stock for each item if the sale had deducted it
            if (sale.status === 'PAID' || sale.status === 'CREDIT') {
                for (const item of sale.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: { increment: item.quantity } }
                    })
                }
            }

            // Delete the SaleItems
            await tx.saleItem.deleteMany({
                where: { saleId: id }
            })

            // Delete the Sale
            await tx.sale.delete({
                where: { id }
            })
        })

        return NextResponse.json({ success: true, message: 'Sale deleted successfully' })

    } catch (error) {
        console.error('Error deleting sale:', error)
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
}
