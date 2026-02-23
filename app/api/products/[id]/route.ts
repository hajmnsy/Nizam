import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const product = await prisma.product.findUnique({
            where: { id }
        })

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching product' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        const json = await request.json()

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: json.name,
                type: json.type,
                price: parseFloat(json.price),
                quantity: parseInt(json.quantity),
                weightPerUnit: parseFloat(json.weightPerUnit),
                length: parseFloat(json.length),
                thickness: parseFloat(json.thickness),
                width: parseFloat(json.width),
                categoryId: parseInt(json.categoryId)
            }
        })

        // Auto-generate notification for low stock on manual edit
        if (product.quantity <= 5) {
            await prisma.notification.create({
                data: {
                    title: 'تنبيه مخزون منخفض (تعديل يدوي)',
                    message: `تم تعديل مخزون ${product.name} إلى ${product.quantity} قطعة بقسم ${product.type}. يرجى التحقق.`,
                    type: 'WARNING'
                }
            })
        }

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 })
    }
}
