import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get all branches
export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { id: 'asc' }
        })
        return NextResponse.json(branches)
    } catch (error) {
        console.error('Error fetching branches:', error)
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 })
    }
}

// Create a branch
export async function POST(request: Request) {
    try {
        const { name, code, address, phone } = await request.json()

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
        }

        // Clean code
        const cleanCode = code.trim().toLowerCase()

        const existing = await prisma.branch.findFirst({
            where: {
                OR: [
                    { name: name.trim() },
                    { code: cleanCode }
                ]
            }
        })

        if (existing) {
            return NextResponse.json({ error: 'اسم الفرع أو الرمز مسجل مسبقاً' }, { status: 400 })
        }

        const branch = await prisma.branch.create({
            data: {
                name: name.trim(),
                code: cleanCode,
                address: address || null,
                phone: phone || null
            }
        })

        // Automatically create a default settings record for the new branch
        await prisma.setting.create({
            data: {
                id: `branch-${branch.id}`,
                companyName: name.trim(),
                vatRate: 0,
                exchangeRate: 0,
                address: address || null,
                phone: phone || null,
                branchId: branch.id
            }
        })

        // Seed categories for this branch from Main Branch (branchId: 1) or defaults
        const mainCategories = await prisma.category.findMany({ where: { branchId: 1 } })
        const categoryMap: Record<string, number> = {}

        if (mainCategories.length > 0) {
            for (const cat of mainCategories) {
                const createdCat = await prisma.category.create({
                    data: {
                        name: cat.name,
                        sellingPricePerTonUSD: cat.sellingPricePerTonUSD || 0,
                        branchId: branch.id
                    }
                })
                categoryMap[cat.name] = createdCat.id
            }
        } else {
            const defaultCategories = [
                { name: 'حديد تسليح' },
                { name: 'مسطحات' },
                { name: 'قطاعات' },
                { name: 'مواسير' },
                { name: 'زوايا' },
            ]
            for (const cat of defaultCategories) {
                const createdCat = await prisma.category.create({
                    data: {
                        name: cat.name,
                        sellingPricePerTonUSD: 0,
                        branchId: branch.id
                    }
                })
                categoryMap[cat.name] = createdCat.id
            }
        }

        // Automatically create default user credentials for this branch (username: branchCode, password: 123456)
        const defaultUsername = cleanCode
        const existingBranchUser = await prisma.user.findUnique({ where: { username: defaultUsername } })
        if (!existingBranchUser) {
            const crypto = await import('crypto')
            const defaultPasswordHash = crypto.createHash('sha256').update('123456').digest('hex')
            await prisma.user.create({
                data: {
                    username: defaultUsername,
                    password: defaultPasswordHash,
                    role: 'CASHIER',
                    branchId: branch.id
                }
            })
        }

        return NextResponse.json(branch)
    } catch (error) {
        console.error('Error creating branch:', error)
        return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
    }
}
