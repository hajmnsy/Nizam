export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getActiveBranchId } from '@/lib/branch';

export async function GET(request: Request) {
    try {
        const branchId = getActiveBranchId()
        const setting = await prisma.setting.findFirst({
            where: { branchId },
            select: { exchangeRate: true }
        });

        return NextResponse.json({ rate: setting?.exchangeRate || 0 });
    } catch (error) {
        console.error('Exchange Rate API Error:', error);
        return NextResponse.json({ rate: 0, error: 'Failed to fetch exchange rate' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const rate = parseFloat(json.rate);

        if (isNaN(rate) || rate <= 0) {
            return NextResponse.json({ error: 'معدل صرف غير صالح' }, { status: 400 });
        }
        
        const branchId = getActiveBranchId()
        const setting = await prisma.setting.findFirst({
            where: { branchId }
        })
        const settingId = setting?.id || `branch-${branchId}`

        const updatedSetting = await prisma.setting.upsert({
            where: { id: settingId },
            create: { id: settingId, exchangeRate: rate, branchId },
            update: { exchangeRate: rate }
        });

        // To preserve historical data in the expenses report without manual entry,
        // we silently maintain an expense record for today.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingExpense = await prisma.expense.findFirst({
            where: {
                category: 'سعر الصرف',
                branchId,
                date: {
                    gte: today.toISOString(),
                    lt: tomorrow.toISOString()
                }
            }
        });

        if (existingExpense) {
            await prisma.expense.update({
                where: { id: existingExpense.id },
                data: { amount: rate }
            });
        } else {
            await prisma.expense.create({
                data: {
                    description: 'سعر الصرف اليومي (تلقائي)',
                    amount: rate,
                    category: 'سعر الصرف',
                    date: new Date().toISOString(),
                    branchId
                }
            });
        }

        return NextResponse.json({ rate: updatedSetting.exchangeRate, success: true });
    } catch (error) {
        console.error('Exchange Rate Update Error:', error);
        return NextResponse.json({ error: 'فشل حفظ التحديث' }, { status: 500 });
    }
}
