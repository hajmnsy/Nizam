export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const branchId = getActiveBranchId()
        const customers = await prisma.customer.findMany({
            where: { branchId },
            include: {
                sales: {
                    select: {
                        id: true,
                        total: true,
                        paidAmount: true,
                        remainingAmount: true,
                        createdAt: true,
                        invoiceNumber: true,
                        status: true,
                        paymentMethod: true
                    }
                },
                deposits: {
                    select: {
                        id: true,
                        amount: true,
                        paymentMethod: true,
                        description: true,
                        date: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const customersWithBalances = customers.map(c => {
            const totalSales = c.sales.reduce((sum, s) => sum + s.total, 0)
            const totalDeposits = c.deposits.reduce((sum, d) => sum + d.amount, 0)
            // Balance: deposits minus total goods purchased
            // Positive (>0): Customer has remaining deposit / credit balance in store (له رصيد مودع)
            // Negative (<0): Customer has unpaid credit / debt (عليه مستحق)
            const remainingBalance = totalDeposits - totalSales

            return {
                ...c,
                totalSales,
                totalDeposits,
                remainingBalance,
                salesCount: c.sales.length,
                depositsCount: c.deposits.length
            }
        })

        return NextResponse.json(customersWithBalances)
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const body = await request.json()
        const { name, phone, company, address, notes, initialDeposit, depositPaymentMethod } = body

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'اسم العميل مطلوب' }, { status: 400 })
        }

        const customer = await prisma.customer.create({
            data: {
                name: name.trim(),
                phone: phone?.trim() || null,
                company: company?.trim() || null,
                address: address?.trim() || null,
                notes: notes?.trim() || null,
                branchId
            }
        })

        // If an initial deposit was provided upon registration
        const depositVal = parseFloat(initialDeposit || '0')
        if (depositVal > 0) {
            await prisma.customerDeposit.create({
                data: {
                    customerId: customer.id,
                    amount: depositVal,
                    paymentMethod: depositPaymentMethod || 'CASH',
                    description: 'إيداع رصيد افتتاحي عند التسجيل',
                    date: new Date(),
                    branchId
                }
            })
        }

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        console.error('Error creating customer:', error)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }
}
