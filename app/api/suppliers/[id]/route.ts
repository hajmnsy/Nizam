export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                purchases: {
                    include: { items: { include: { product: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                expenses: {
                    orderBy: { date: 'desc' }
                },
                deposits: {
                    orderBy: { date: 'desc' }
                }
            }
        })

        if (!supplier) {
            return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 })
        }

        const totalPurchases = supplier.purchases.reduce((sum, p) => sum + p.total, 0)
        const totalPayments = supplier.expenses.reduce((sum, e) => sum + e.amount, 0)
        const remainingBalance = totalPurchases - totalPayments

        const depositsByCurrency: Record<string, number> = { USD: 0, AED: 0, SDG: 0 }
        supplier.deposits.forEach(d => {
            const curr = d.currency || 'USD'
            depositsByCurrency[curr] = (depositsByCurrency[curr] || 0) + d.amount
        })

        const deductedByCurrency: Record<string, number> = { USD: 0, AED: 0, SDG: 0 }
        supplier.purchases.forEach(p => {
            if (p.depositDeducted && p.depositDeducted > 0) {
                const curr = p.currency || 'USD'
                deductedByCurrency[curr] = (deductedByCurrency[curr] || 0) + p.depositDeducted
            }
        })

        const advanceBalanceByCurrency: Record<string, number> = {}
        Object.keys(depositsByCurrency).forEach(curr => {
            advanceBalanceByCurrency[curr] = (depositsByCurrency[curr] || 0) - (deductedByCurrency[curr] || 0)
        })

        return NextResponse.json({
            ...supplier,
            totalPurchases,
            totalPayments,
            remainingBalance,
            depositsByCurrency,
            advanceBalanceByCurrency
        })
    } catch (error) {
        console.error('Error fetching supplier details:', error)
        return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const body = await request.json()
        const { name, phone, company, address, notes } = body

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: name?.trim(),
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                address: address?.trim() || null,
                notes: notes?.trim() || null
            }
        })

        return NextResponse.json(supplier)
    } catch (error) {
        console.error('Error updating supplier:', error)
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        await prisma.supplier.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting supplier:', error)
        return NextResponse.json({ error: 'فشل حذف المورد (قد يكون مرتبكاً بمشتريات أو مصروفات)' }, { status: 500 })
    }
}
