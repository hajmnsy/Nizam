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
                        currency: true,
                        currencyRate: true,
                        paymentMethod: true,
                        depositDeducted: true,
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
                },
                deposits: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        currencyRate: true,
                        paymentMethod: true,
                        bankName: true,
                        bankRef: true,
                        chequeNumber: true,
                        chequeBank: true,
                        description: true,
                        date: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const suppliersWithBalances = suppliers.map(s => {
            const totalPurchases = s.purchases.reduce((sum, p) => sum + p.total, 0)
            const totalPayments = s.expenses.reduce((sum, e) => sum + e.amount, 0)
            const remainingBalance = totalPurchases - totalPayments // We owe the supplier money

            // Multi-currency advance deposits with factory
            const depositsByCurrency: Record<string, number> = { USD: 0, AED: 0, SDG: 0 }
            s.deposits.forEach(d => {
                const curr = d.currency || 'USD'
                depositsByCurrency[curr] = (depositsByCurrency[curr] || 0) + d.amount
            })

            // Total deposits deducted in purchases
            const deductedByCurrency: Record<string, number> = { USD: 0, AED: 0, SDG: 0 }
            s.purchases.forEach(p => {
                if (p.depositDeducted && p.depositDeducted > 0) {
                    const curr = p.currency || 'USD'
                    deductedByCurrency[curr] = (deductedByCurrency[curr] || 0) + p.depositDeducted
                }
            })

            const advanceBalanceByCurrency: Record<string, number> = {}
            Object.keys(depositsByCurrency).forEach(curr => {
                advanceBalanceByCurrency[curr] = (depositsByCurrency[curr] || 0) - (deductedByCurrency[curr] || 0)
            })

            return {
                ...s,
                totalPurchases,
                totalPayments,
                remainingBalance,
                depositsByCurrency,
                advanceBalanceByCurrency
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
