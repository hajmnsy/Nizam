export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        // Fetch the most recent expense with category "سعر الصرف" (Exchange Rate)
        const latestExchangeRate = await prisma.expense.findFirst({
            where: {
                category: 'سعر الصرف'
            },
            orderBy: {
                date: 'desc'
            },
            select: {
                amount: true,
                date: true
            }
        });

        // Return the amount if found, otherwise default to 0
        return NextResponse.json({ rate: latestExchangeRate?.amount || 0 });
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

        // Save it as an expense record with the category 'سعر الصرف'
        const newRate = await prisma.expense.create({
            data: {
                description: 'تحديث سعر الصرف التلقائي',
                amount: rate,
                category: 'سعر الصرف',
            }
        });

        return NextResponse.json({ rate: newRate.amount, success: true });
    } catch (error) {
        console.error('Exchange Rate Update Error:', error);
        return NextResponse.json({ error: 'فشل حفظ التحديث' }, { status: 500 });
    }
}
