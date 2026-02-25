export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        // json structure: { customer: string, items: [{ productId, quantity, price }], status?: string }

        const status = json.status || 'PAID'
        const discount = parseFloat(json.discount || '0')

        // Calculate total
        const subtotal = json.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        const total = subtotal - discount

        // Calculate paid and remaining
        let paidAmount = total;
        if (status === 'QUOTATION') {
            paidAmount = 0;
        } else if (json.paidAmount !== undefined && json.paidAmount !== null) {
            paidAmount = parseFloat(json.paidAmount);
        }

        // Ensure paidAmount does not exceed total
        paidAmount = Math.min(paidAmount, total);
        const remainingAmount = Math.max(0, total - paidAmount);

        // Calculate discount proportion
        const discountRatio = subtotal > 0 && discount > 0 ? discount / subtotal : 0;

        // Prepare new items and calculate the actual total based on rounded unit prices
        let actualNewTotal = 0;
        const newItemsData = json.items.map((item: any) => {
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
        let adjustedPaidAmount = paidAmount;
        if (status === 'PAID') adjustedPaidAmount = actualNewTotal;
        else if (status === 'CREDIT' && remainingAmount === 0) adjustedPaidAmount = actualNewTotal;

        const actualRemainingAmount = Math.max(0, actualNewTotal - adjustedPaidAmount);
        const finalStatus = actualRemainingAmount === 0 && status === 'CREDIT' ? 'PAID' : status;

        let invoiceNumber = null;
        if (finalStatus !== 'QUOTATION') {
            const maxInvoice = await prisma.sale.aggregate({
                _max: {
                    invoiceNumber: true
                }
            });
            invoiceNumber = (maxInvoice._max.invoiceNumber || 0) + 1;
        }

        const sale = await prisma.sale.create({
            data: {
                invoiceNumber: invoiceNumber,
                customer: json.customer || 'Customer',
                total: actualNewTotal,
                discount: discount,
                paidAmount: adjustedPaidAmount,
                remainingAmount: actualRemainingAmount,
                status: finalStatus,
                items: {
                    create: newItemsData
                }
            },
            include: {
                items: true
            }
        });

        // Update stock ONLY if not a quotation
        if (finalStatus !== 'QUOTATION') {
            for (const item of json.items) {
                const updatedProduct = await prisma.product.update({
                    where: { id: parseInt(item.productId) },
                    data: {
                        quantity: {
                            decrement: parseInt(item.quantity)
                        }
                    }
                })

                // Auto-generate notification for low stock
                if (updatedProduct.quantity <= 5) {
                    await prisma.notification.create({
                        data: {
                            title: 'تنبيه مخزون منخفض',
                            message: `انخفض مخزون ${updatedProduct.name} إلى ${updatedProduct.quantity} قطعة بقسم ${updatedProduct.type}. يرجى إعادة الطلب.`,
                            type: 'WARNING'
                        }
                    })
                }
            }
        }

        return NextResponse.json(sale)
    } catch (error: any) {
        console.error('Error creating sale:', error)
        return NextResponse.json({
            error: 'Error creating sale',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dateParam = searchParams.get('date') // Expected format: YYYY-MM-DD

    try {
        let whereClause: any = {}

        if (status) {
            whereClause.status = status
        }

        if (dateParam) {
            // Create start and end date objects for the specified date
            const startDate = new Date(dateParam)
            startDate.setUTCHours(0, 0, 0, 0)

            const endDate = new Date(dateParam)
            endDate.setUTCHours(23, 59, 59, 999)

            whereClause.createdAt = {
                gte: startDate,
                lte: endDate
            }
        }

        const sales = await prisma.sale.findMany({
            where: whereClause,
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(sales)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 })
    }
}
