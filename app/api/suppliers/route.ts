export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const branchId = getActiveBranchId()
        const suppliers = await prisma.supplier.findMany({
            where: { branchId },
            include: {
                purchases: {
                    select: {
                        id: true,
                        total: true,
                        createdAt: true,
                        invoiceNumber: true
                    }
                },
                expenses: {
                    select: {
                        id: true,
                        amount: true,
                        description: true,
                        date: true,
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const suppliersWithBalances = suppliers.map(s => {
            const totalPurchases = s.purchases.reduce((sum, p) => sum + p.total, 0)
            const totalPayments = s.expenses.reduce((sum, e) => sum + e.amount, 0)
            const remainingBalance = totalPurchases - totalPayments // Positive means we owe the supplier money

            return {
                ...s,
                totalPurchases,
                totalPayments,
                remainingBalance
            }
        })

        return NextResponse.json(suppliersWithBalances)
    } catch (error) {
        console.error('Error fetching suppliers:', error)
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const body = await request.json()
        const { name, phone, company, address, notes } = body

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'اسم المورد مطلوب' }, { status: 400 })
        }

        const supplier = await prisma.supplier.create({
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                address: address?.trim() || null,
                notes: notes?.trim() || null,
                branchId
            }
        })

        return NextResponse.json(supplier, { status: 201 })
    } catch (error) {
        console.error('Error creating supplier:', error)
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
    }
}
