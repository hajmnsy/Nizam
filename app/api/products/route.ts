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

        // Fetch all undelivered items to compute pending and physical stock
        const undeliveredItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    deliveryStatus: { in: ['PENDING', 'PARTIAL'] },
                    status: { in: ['PAID', 'CREDIT'] }
                },
                ...(allBranches ? {} : {
                    OR: [
                        { dispatchBranchId: branchId },
                        { dispatchBranchId: null, sale: { branchId } }
                    ]
                })
            },
            select: {
                productId: true,
                quantity: true,
                deliveredQuantity: true
            }
        });

        const pendingMap = new Map<number, number>();
        for (const item of undeliveredItems) {
            const delivered = item.deliveredQuantity || 0;
            const remaining = Math.max(0, item.quantity - delivered);
            if (remaining > 0) {
                pendingMap.set(item.productId, (pendingMap.get(item.productId) || 0) + remaining);
            }
        }

        const enrichedProducts = products.map(p => {
            const pendingQuantity = pendingMap.get(p.id) || 0;
            return {
                ...p,
                availableQuantity: p.quantity,
                pendingQuantity,
                physicalQuantity: p.quantity + pendingQuantity
            };
        });

        return NextResponse.json(enrichedProducts)
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
