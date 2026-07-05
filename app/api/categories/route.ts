export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const branchId = getActiveBranchId()
        const categories = await prisma.category.findMany({
            where: { branchId }
        })
        return NextResponse.json(categories)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const { name, sellingPricePerTonUSD } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'اسم التصنيف مطلوب' }, { status: 400 })
        }

        const existing = await prisma.category.findFirst({
            where: {
                branchId,
                name: name.trim()
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'اسم التصنيف مسجل مسبقاً في هذا الفرع' }, { status: 400 })
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                sellingPricePerTonUSD: parseFloat(sellingPricePerTonUSD) || 0,
                branchId
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const { id, sellingPricePerTonUSD } = await request.json()
        
        if (!id || typeof sellingPricePerTonUSD !== 'number') {
             return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { sellingPricePerTonUSD }
        })
        return NextResponse.json(category)
    } catch (error) {
        console.error('Error updating category', error)
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
}
