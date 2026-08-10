export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const returns = await prisma.saleReturn.findMany({
            where: { branchId },
            include: {
                sale: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        customer: true,
                        createdAt: true
                    }
                },
                items: {
                    include: {
                        product: { select: { id: true, name: true, thickness: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(returns)
    } catch (error) {
        console.error('Error fetching sale returns:', error)
        return NextResponse.json({ error: 'حدث خطأ أثناء جلب راجع البضاعة' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const json = await request.json()
        const { saleId, reason, items } = json

        if (!saleId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'البيانات غير مكتملة' }, { status: 400 })
        }

        const sale = await prisma.sale.findUnique({
            where: { id: parseInt(saleId) },
            include: { items: true }
        })

        if (!sale) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 })
        }

        const totalRefund = items.reduce((sum: number, item: any) => {
            const qty = parseInt(item.quantity) || 0
            const price = parseFloat(item.unitPrice) || 0
            return sum + (qty * price)
        }, 0)

        if (totalRefund <= 0) {
            return NextResponse.json({ error: 'إجمالي مبلغ المرتجع يجب أن يكون أكبر من صفر' }, { status: 400 })
        }

        // Determine dispatch branch for inventory return
        const targetBranchId = sale.dispatchBranchId || sale.branchId || branchId;

        // Perform transaction: Create SaleReturn, Increment Stock, Create Expense Entry in today's daybook
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Return Record
            const saleReturn = await tx.saleReturn.create({
                data: {
                    saleId: sale.id,
                    branchId: branchId,
                    totalRefund,
                    reason: reason || 'إرجاع بضاعة من العميل',
                    items: {
                        create: items.map((item: any) => ({
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            totalPrice: parseInt(item.quantity) * parseFloat(item.unitPrice)
                        }))
                    }
                }
            })

            // 2. Increment Stock back in warehouse
            for (const item of items) {
                const qty = parseInt(item.quantity)
                const origProdId = parseInt(item.productId)

                // Match product in target dispatch branch if cross-branch
                let targetProdId = origProdId;
                if (targetBranchId !== sale.branchId) {
                    const origProd = await tx.product.findUnique({ where: { id: origProdId } });
                    if (origProd) {
                        const dispatchProd = await tx.product.findFirst({
                            where: { branchId: targetBranchId, name: origProd.name }
                        });
                        if (dispatchProd) targetProdId = dispatchProd.id;
                    }
                }

                await tx.product.update({
                    where: { id: targetProdId },
                    data: {
                        quantity: { increment: qty }
                    }
                })
            }

            // 3. Create Expense entry in TODAY'S DAYBOOK (خصم المرتجع من يومية اليوم الحالية)
            const expense = await tx.expense.create({
                data: {
                    description: `مرتجع بضاعة - فاتورة إذن #${sale.invoiceNumber || sale.id} (العميل: ${sale.customer || 'نقدي'}) - السبب: ${reason || 'راجع بضاعة'}`,
                    amount: totalRefund,
                    category: 'مرتجع مبيعات',
                    date: new Date(), // Today's date!
                    branchId: branchId
                }
            })

            // Link expense to return record
            await tx.saleReturn.update({
                where: { id: saleReturn.id },
                data: { expenseId: expense.id }
            })

            return saleReturn;
        })

        return NextResponse.json({ success: true, returnId: result.id })
    } catch (error: any) {
        console.error('Error creating sale return:', error)
        return NextResponse.json({ error: error.message || 'حدث خطأ أثناء حفظ مرتجع البضاعة' }, { status: 500 })
    }
}
