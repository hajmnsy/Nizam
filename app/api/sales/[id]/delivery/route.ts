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
        const { deliveryStatus, deliveredBy, deliveryNotes, deliveredAt } = json;

        if (!deliveryStatus || !['PENDING', 'DELIVERED'].includes(deliveryStatus)) {
            return NextResponse.json({ error: 'حالة الاستلام غير صالحة (PENDING أو DELIVERED)' }, { status: 400 });
        }

        const existingSale = await prisma.sale.findUnique({
            where: { id },
            select: { id: true, invoiceNumber: true, deliveryStatus: true }
        });

        if (!existingSale) {
            return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
        }

        const updatedSale = await prisma.sale.update({
            where: { id },
            data: {
                deliveryStatus,
                deliveredAt: deliveryStatus === 'DELIVERED' 
                    ? (deliveredAt ? new Date(deliveredAt) : new Date()) 
                    : null,
                deliveredBy: deliveredBy !== undefined ? (deliveredBy?.trim() || null) : undefined,
                deliveryNotes: deliveryNotes !== undefined ? (deliveryNotes?.trim() || null) : undefined
            },
            include: {
                items: { include: { product: true } },
                branch: true
            }
        });

        return NextResponse.json({
            success: true,
            sale: updatedSale,
            message: deliveryStatus === 'DELIVERED' ? 'تم تأكيد استلام وصرف البضاعة بنجاح' : 'تم تصحيح الحالة إلى بانتظار الاستلام'
        });
    } catch (error: any) {
        console.error('Error updating delivery status:', error);
        return NextResponse.json({
            error: 'حدث خطأ أثناء تحديث حالة الاستلام',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
