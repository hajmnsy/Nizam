export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const allBranches = searchParams.get('allBranches') === 'true' || searchParams.get('crossBranch') === 'true'
        const branchId = getActiveBranchId()

        const whereCondition = allBranches ? {} : { branchId }

        const products = await prisma.product.findMany({
            where: whereCondition,
            include: { 
                category: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const json = await request.json()
        const product = await prisma.product.create({
            data: {
                name: json.name,
                type: json.type,
                price: parseFloat(json.price),
                purchasePriceUSD: parseFloat(json.purchasePriceUSD) || 0,
                transportCostUSD: parseFloat(json.transportCostUSD) || 15,
                quantity: parseInt(json.quantity),
                weightPerUnit: parseFloat(json.weightPerUnit),
                length: parseFloat(json.length),
                thickness: parseFloat(json.thickness),
                width: parseFloat(json.width),
                categoryId: parseInt(json.categoryId) || 1,
                branchId
            }
        })
        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
    }
}
