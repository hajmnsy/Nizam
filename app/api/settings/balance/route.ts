export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function POST(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const body = await request.json()
        const { initialBalance, initialBalanceDate } = body

        // Find existing setting for this branch
        let existingSetting = await prisma.setting.findFirst({
            where: { branchId }
        })

        const settingId = existingSetting?.id || `branch-${branchId}`

        const updateData: any = {}
        const createData: any = { 
            id: settingId, 
            branchId,
            companyName: existingSetting?.companyName || 'اسم الشركة'
        }

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
            where: { id: settingId },
            update: updateData,
            create: createData,
        })

        return NextResponse.json({ success: true, initialBalance: (setting as any).initialBalance, initialBalanceDate: (setting as any).initialBalanceDate })
    } catch (error: any) {
        console.error('Error updating initial balance:', error)
        return NextResponse.json({ error: 'Failed to update balance', details: error?.message }, { status: 500 })
    }
}
