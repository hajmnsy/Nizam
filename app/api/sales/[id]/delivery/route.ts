export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleDeliveryUpdate(request, params.id);
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    return handleDeliveryUpdate(request, params.id);
}

async function handleDeliveryUpdate(request: Request, idParam: string) {
    try {
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const json = await request.json();
        const { deliveryStatus: explicitStatus, deliveredBy, deliveryNotes, deliveredAt, items } = json;

        const existingSale = await prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingSale) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        let finalStatus = explicitStatus;

        // Perform updates in a transaction
        const updatedSale = await prisma.$transaction(async (tx) => {
            // 1. If individual items were passed, update deliveredQuantity per item
            if (Array.isArray(items) && items.length > 0) {
                let totalOrdered = 0;
                let totalDelivered = 0;

                for (const existingItem of existingSale.items) {
                    const submittedItem = items.find((it: any) => it.id === existingItem.id);
                    let itemDelivered = existingItem.deliveredQuantity || 0;

                    if (submittedItem && submittedItem.deliveredQuantity !== undefined) {
                        itemDelivered = Math.max(0, Math.min(existingItem.quantity, parseInt(submittedItem.deliveredQuantity) || 0));
                        await tx.saleItem.update({
                            where: { id: existingItem.id },
                            data: { deliveredQuantity: itemDelivered }
                        });
                    }

                    totalOrdered += existingItem.quantity;
                    totalDelivered += itemDelivered;
                }

                // Compute final status automatically based on quantities if not forced or to ensure consistency
                if (totalDelivered === 0) {
                    finalStatus = 'PENDING';
                } else if (totalDelivered >= totalOrdered) {
                    finalStatus = 'DELIVERED';
                } else {
                    finalStatus = 'PARTIAL';
                }
            } else if (explicitStatus === 'DELIVERED') {
                // If explicitly set to DELIVERED without items breakdown, mark all items as fully delivered
                await tx.saleItem.updateMany({
                    where: { saleId: id },
                    data: {
                        deliveredQuantity: {
                            set: undefined // Note: prisma updateMany cannot reference column directly, do via loop
                        }
                    }
                });
                for (const item of existingSale.items) {
                    await tx.saleItem.update({
                        where: { id: item.id },
                        data: { deliveredQuantity: item.quantity }
                    });
                }
                finalStatus = 'DELIVERED';
            } else if (explicitStatus === 'PENDING') {
                // If reset to PENDING, set all items deliveredQuantity to 0
                await tx.saleItem.updateMany({
                    where: { saleId: id },
                    data: { deliveredQuantity: 0 }
                });
                finalStatus = 'PENDING';
            }

            if (!finalStatus) finalStatus = 'PENDING';

            const saleUpdateData: any = {
                deliveryStatus: finalStatus,
                deliveredAt: finalStatus !== 'PENDING'
                    ? (deliveredAt ? new Date(deliveredAt) : (existingSale.deliveredAt || new Date()))
                    : null
            };

            if (deliveredBy !== undefined) saleUpdateData.deliveredBy = deliveredBy?.trim() || null;
            if (deliveryNotes !== undefined) saleUpdateData.deliveryNotes = deliveryNotes?.trim() || null;

            return await tx.sale.update({
                where: { id },
                data: saleUpdateData,
                include: {
                    items: { include: { product: true } },
                    branch: true,
                    dispatchBranch: true
                }
            });
        });

        let message = 'تم تحديث حالة الاستلام بنجاح';
        if (finalStatus === 'DELIVERED') {
            message = 'تم تأكيد استلام وصرف البضاعة بالكامل';
        } else if (finalStatus === 'PARTIAL') {
            message = 'تم تسجيل الاستلام الجزئي للبضاعة';
        } else {
            message = 'تم تصحيح الحالة إلى بانتظار الاستلام';
        }

        return NextResponse.json({
            success: true,
            sale: updatedSale,
            message
        });
    } catch (error: any) {
        console.error('Error updating delivery status:', error);
        return NextResponse.json({
            error: 'حدث خطأ أثناء تحديث حالة الاستلام',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
