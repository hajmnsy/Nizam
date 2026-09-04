export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function POST(request: Request) {
    try {
        const json = await request.json()
        // json structure: { customer: string, items: [{ productId, quantity, price }], status?: string, createdAt?: string }

        const status = json.status || 'PAID'
        const discount = parseFloat(json.discount || '0')
        
        let finalCreatedAt = undefined;
        if (json.createdAt) {
            const todayLocalStr = new Date(new Date().getTime() + (2 * 60 * 60 * 1000)).toISOString().split('T')[0];
            if (json.createdAt === todayLocalStr) {
                finalCreatedAt = new Date(); 
            } else {
                finalCreatedAt = new Date(`${json.createdAt}T00:00:00.000+02:00`);
            }
        }


        // Calculate total cleanly with rounding at the item level
        const subtotal = json.items.reduce((sum: number, item: any) => sum + Math.round(item.price * item.quantity), 0)
        const total = Math.round(subtotal - discount)

        // Calculate paid and remaining
        let paidAmount = total;
        if (status === 'QUOTATION') {
            paidAmount = 0;
        } else if (json.paidAmount !== undefined && json.paidAmount !== null) {
            paidAmount = Math.round(parseFloat(json.paidAmount));
        }

        // Ensure paidAmount does not exceed total
        paidAmount = Math.round(Math.min(paidAmount, total));
        const remainingAmount = Math.round(Math.max(0, total - paidAmount));

        const branchId = getActiveBranchId()
        const dispatchBranchId = json.dispatchBranchId ? parseInt(json.dispatchBranchId) : null

        // Use the exact custom prices from the client, but rounded!
        const newItemsData = json.items.map((item: any) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: Math.round(parseFloat(item.price)),
            dispatchBranchId: item.dispatchBranchId ? parseInt(item.dispatchBranchId) : dispatchBranchId
        }));

        // Adjust paidAmount based on the actual new total if it was meant to be exactly full
        let adjustedPaidAmount = paidAmount;
        if (status === 'PAID') adjustedPaidAmount = total;
        else if (status === 'CREDIT' && remainingAmount === 0) adjustedPaidAmount = total;

        const actualRemainingAmount = Math.max(0, total - adjustedPaidAmount);
        const finalStatus = actualRemainingAmount === 0 && status === 'CREDIT' ? 'PAID' : status;

        // Determine payment method amounts
        const paymentMethod = json.paymentMethod || 'CASH';
        let cashAmount = parseFloat(json.cashAmount || '0');
        let bankAmount = parseFloat(json.bankAmount || '0');
        let chequeAmount = parseFloat(json.chequeAmount || '0');

        if (paymentMethod === 'CASH') {
            cashAmount = adjustedPaidAmount;
            bankAmount = 0;
            chequeAmount = 0;
        } else if (paymentMethod === 'BANK') {
            bankAmount = adjustedPaidAmount;
            cashAmount = 0;
            chequeAmount = 0;
        } else if (paymentMethod === 'CHEQUE') {
            chequeAmount = adjustedPaidAmount;
            cashAmount = 0;
            bankAmount = 0;
        } else if (paymentMethod === 'MULTIPLE') {
            // Validate sum of split payments matches adjustedPaidAmount
            const sumSplit = cashAmount + bankAmount + chequeAmount;
            if (sumSplit === 0 && adjustedPaidAmount > 0) {
                cashAmount = adjustedPaidAmount;
            }
        }

        const customerId = json.customerId ? parseInt(json.customerId) : null;

        const result = await prisma.$transaction(async (tx) => {
            let invoiceNumber = null;
            if (finalStatus !== 'QUOTATION') {
                const maxInvoice = await tx.sale.aggregate({
                    where: { branchId },
                    _max: {
                        invoiceNumber: true
                    }
                });
                invoiceNumber = (maxInvoice._max.invoiceNumber || 0) + 1;
            }

            const sale = await tx.sale.create({
                data: {
                    invoiceNumber: invoiceNumber,
                    customer: json.customer || 'Customer',
                    customerId: customerId,
                    total: total,
                    discount: discount,
                    paidAmount: adjustedPaidAmount,
                    remainingAmount: actualRemainingAmount,
                    status: finalStatus,
                    paymentMethod: paymentMethod,
                    currency: json.currency || 'SDG',
                    currencyRate: parseFloat(json.currencyRate) || 1,
                    cashAmount: cashAmount,
                    bankAmount: bankAmount,
                    chequeAmount: chequeAmount,
                    bankName: json.bankName?.trim() || null,
                    bankRef: json.bankRef?.trim() || null,
                    bankTransfers: json.bankTransfers ? (typeof json.bankTransfers === 'string' ? json.bankTransfers : JSON.stringify(json.bankTransfers)) : null,
                    chequeNumber: json.chequeNumber?.trim() || null,
                    chequeBank: json.chequeBank?.trim() || null,
                    createdAt: finalCreatedAt,
                    branchId,
                    dispatchBranchId: dispatchBranchId || branchId,
                    items: {
                        create: newItemsData
                    },
                    payments: adjustedPaidAmount > 0 ? {
                        create: {
                            amount: adjustedPaidAmount
                        }
                    } : undefined
                },
                include: {
                    items: true,
                    payments: true,
                    branch: true,
                    dispatchBranch: true
                }
            });

            // Update stock ONLY if not a quotation
            if (finalStatus !== 'QUOTATION') {
                for (const item of json.items) {
                    let targetProductId = parseInt(item.productId);
                    const originalProduct = await tx.product.findUnique({
                        where: { id: targetProductId }
                    });

                    // If dispatching from a different branch, find matching product by name in target branch
                    if (dispatchBranchId && dispatchBranchId !== branchId && originalProduct) {
                        const dispatchProduct = await tx.product.findFirst({
                            where: {
                                branchId: dispatchBranchId,
                                name: originalProduct.name
                            }
                        });
                        if (dispatchProduct) {
                            targetProductId = dispatchProduct.id;
                        }
                    }

                    const updatedProduct = await tx.product.update({
                        where: { id: targetProductId },
                        data: {
                            quantity: {
                                decrement: parseInt(item.quantity)
                            }
                        }
                    })

                    // Auto-generate notification for low stock in target branch
                    if (updatedProduct.quantity <= 5) {
                        await tx.notification.create({
                            data: {
                                title: 'تنبيه مخزون منخفض',
                                message: `انخفض مخزون ${updatedProduct.name} إلى ${updatedProduct.quantity} قطعة بقسم ${updatedProduct.type || 'عام'}. يرجى إعادة الطلب.`,
                                type: 'WARNING',
                                branchId: dispatchBranchId || branchId
                            }
                        })
                    }
                }
            }

            return sale;
        });

        return NextResponse.json(result)
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
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    try {
        const branchId = getActiveBranchId()
        let whereClause: any = { branchId }

        const customer = searchParams.get('customer')
        if (customer) {
            whereClause.customer = { contains: customer }
        }

        if (status && status !== 'ALL') {
            whereClause.status = status
        }

        if (startDateParam && endDateParam) {
            const startDate = new Date(`${startDateParam}T00:00:00.000+02:00`)
            const endDate = new Date(`${endDateParam}T23:59:59.999+02:00`)
            whereClause.createdAt = {
                gte: startDate,
                lte: endDate
            }
        } else if (dateParam) {
            // Create start and end date objects for the specified date in Sudan timezone (+02:00)
            const startDate = new Date(`${dateParam}T00:00:00.000+02:00`)
            const endDate = new Date(`${dateParam}T23:59:59.999+02:00`)

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
