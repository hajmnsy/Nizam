import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        // Check if there are products belonging to this category
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        })

        if (productCount > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف هذا التصنيف لوجود منتجات مرتبطة به. يرجى حذف المنتجات أو نقلها أولاً.' }, { status: 400 })
        }

        await prisma.category.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete category:', error)
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
}
