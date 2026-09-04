export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const supplierId = parseInt(params.id)
        const branchId = getActiveBranchId()
        const body = await request.json()
        const {
            amount,
            currency = 'USD',
            currencyRate = 1,
            paymentMethod = 'BANK',
            bankName,
            bankRef,
            chequeNumber,
            chequeBank,
            description,
            date
        } = body

        const depositVal = parseFloat(amount)
        if (!depositVal || depositVal <= 0) {
            return NextResponse.json({ error: 'مبلغ الإيداع للمصنع يجب أن يكون أكبر من صفر' }, { status: 400 })
        }

        const deposit = await prisma.supplierDeposit.create({
            data: {
                supplierId,
                amount: depositVal,
                currency: currency || 'USD',
                currencyRate: parseFloat(currencyRate) || 1,
                paymentMethod: paymentMethod || 'BANK',
                bankName: bankName?.trim() || null,
                bankRef: bankRef?.trim() || null,
                chequeNumber: chequeNumber?.trim() || null,
                chequeBank: chequeBank?.trim() || null,
                description: description?.trim() || 'إيداع رصيد مسبق لدى المصنع/المورد',
                date: date ? new Date(`${date}T00:00:00.000+02:00`) : new Date(),
                branchId
            }
        })

        return NextResponse.json(deposit, { status: 201 })
    } catch (error) {
        console.error('Error recording supplier advance deposit:', error)
        return NextResponse.json({ error: 'فشل تسجيل إيداع المصنع' }, { status: 500 })
    }
}
