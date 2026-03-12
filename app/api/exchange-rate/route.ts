export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const setting = await prisma.setting.findUnique({
            where: { id: 'default' },
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
        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            create: { id: 'default', exchangeRate: rate },
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
                    date: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({ rate: setting.exchangeRate, success: true });
    } catch (error) {
        console.error('Exchange Rate Update Error:', error);
        return NextResponse.json({ error: 'فشل حفظ التحديث' }, { status: 500 });
    }
}
