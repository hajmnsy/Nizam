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

        let products = await prisma.product.findMany({
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

        // Auto-seed product catalog for existing empty branches from Main Branch (branchId: 1)
        if (!allBranches && products.length === 0 && branchId > 1) {
            const mainProducts = await prisma.product.findMany({
                where: { branchId: 1 },
                include: { category: true }
            })

            if (mainProducts.length > 0) {
                const branchCats = await prisma.category.findMany({ where: { branchId } })
                const catMap: Record<string, number> = {}
                for (const c of branchCats) catMap[c.name] = c.id

                const fallbackCat = branchCats[0]

                for (const prod of mainProducts) {
                    let targetCatId = (prod.category && catMap[prod.category.name]) ? catMap[prod.category.name] : fallbackCat?.id
                    if (!targetCatId && prod.category) {
                        const newCat = await prisma.category.create({
                            data: {
                                name: prod.category.name,
                                sellingPricePerTonUSD: prod.category.sellingPricePerTonUSD || 0,
                                branchId
                            }
                        })
                        targetCatId = newCat.id
                        catMap[prod.category.name] = newCat.id
                    }

                    if (targetCatId) {
                        await prisma.product.create({
                            data: {
                                name: prod.name,
                                type: prod.type,
                                price: prod.price,
                                purchasePriceUSD: prod.purchasePriceUSD || 0,
                                transportCostUSD: prod.transportCostUSD || 15,
                                quantity: 0,
                                weightPerUnit: prod.weightPerUnit,
                                length: prod.length,
                                thickness: prod.thickness,
                                width: prod.width,
                                categoryId: targetCatId,
                                branchId
                            }
                        })
                    }
                }

                products = await prisma.product.findMany({
                    where: whereCondition,
                    include: { 
                        category: true,
                        branch: { select: { id: true, name: true, code: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                })
            }
        }

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
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
