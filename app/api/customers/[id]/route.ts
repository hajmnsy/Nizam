export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    include: {
                        items: {
                            include: { product: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                deposits: {
                    orderBy: { date: 'desc' }
                }
            }
        })

        if (!customer) {
            return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 })
        }

        const totalSales = customer.sales.reduce((sum, s) => sum + s.total, 0)
        const totalDeposits = customer.deposits.reduce((sum, d) => sum + d.amount, 0)
        const remainingBalance = totalDeposits - totalSales

        return NextResponse.json({
            ...customer,
            totalSales,
            totalDeposits,
            remainingBalance
        })
    } catch (error) {
        console.error('Error fetching customer details:', error)
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const body = await request.json()
        const { name, phone, company, address, notes } = body

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name: name?.trim(),
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                address: address?.trim() || null,
                notes: notes?.trim() || null
            }
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error updating customer:', error)
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        await prisma.customer.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json({ error: 'فشل حذف العميل (قد يكون مرتبطاً بمبيعات أو إيداعات)' }, { status: 500 })
    }
}
