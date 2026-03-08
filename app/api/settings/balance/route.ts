export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { initialBalance, initialBalanceDate } = body

        // Only update these two specific fields to absolutely guarantee no logo/name data loss
        const updateData: any = {}
        const createData: any = { id: 'default' }

        if (initialBalance !== undefined) {
            const parsedBalance = isNaN(parseFloat(initialBalance as string)) ? 0 : parseFloat(initialBalance as string);
            updateData.initialBalance = parsedBalance;
            createData.initialBalance = parsedBalance;
        }

        if (initialBalanceDate !== undefined) {
            const parsedDate = (initialBalanceDate && initialBalanceDate.trim() !== '') ? new Date(initialBalanceDate) : null;
            updateData.initialBalanceDate = parsedDate;
            createData.initialBalanceDate = parsedDate;
        }

        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            update: updateData,
            create: createData,
        })

        return NextResponse.json({ success: true, initialBalance: (setting as any).initialBalance, initialBalanceDate: (setting as any).initialBalanceDate })
    } catch (error: any) {
        console.error('Error updating initial balance:', error)
        return NextResponse.json({ error: 'Failed to update balance', details: error?.message }, { status: 500 })
    }
}
