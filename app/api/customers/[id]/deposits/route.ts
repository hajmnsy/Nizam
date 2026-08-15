export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const customerId = parseInt(params.id)
        const branchId = getActiveBranchId()
        const body = await request.json()
        const { amount, paymentMethod, description, date } = body

        const depositVal = parseFloat(amount)
        if (!depositVal || depositVal <= 0) {
            return NextResponse.json({ error: 'مبلغ الإيداع يجب أن يكون أكبر من صفر' }, { status: 400 })
        }

        const deposit = await prisma.customerDeposit.create({
            data: {
                customerId,
                amount: depositVal,
                paymentMethod: paymentMethod || 'CASH',
                description: description?.trim() || 'إيداع نقدي بالحساب',
                date: date ? new Date(`${date}T00:00:00.000+02:00`) : new Date(),
                branchId
            }
        })

        return NextResponse.json(deposit, { status: 201 })
    } catch (error) {
        console.error('Error recording customer deposit:', error)
        return NextResponse.json({ error: 'فشل تسجيل الإيداع' }, { status: 500 })
    }
}
