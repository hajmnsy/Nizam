export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const setting = await prisma.setting.findUnique({
            where: { id: 'default' },
            select: { exchangeRate: true, sellingPricePerTonUSD: true }
        });

        return NextResponse.json({ rate: setting?.exchangeRate || 0, sellingPricePerTonUSD: setting?.sellingPricePerTonUSD || 0 });
    } catch (error) {
        console.error('Exchange Rate API Error:', error);
        return NextResponse.json({ rate: 0, error: 'Failed to fetch exchange rate' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        
        const updateData: any = {};
        const createData: any = { id: 'default' };

        let processedRate = null;
        if (json.rate !== undefined) {
            const rate = parseFloat(json.rate);
            if (!isNaN(rate) && rate > 0) {
                updateData.exchangeRate = rate;
                createData.exchangeRate = rate;
                processedRate = rate;
            } else {
                return NextResponse.json({ error: 'معدل صرف غير صالح' }, { status: 400 });
            }
        }

        if (json.sellingPricePerTonUSD !== undefined) {
            const tonPrice = parseFloat(json.sellingPricePerTonUSD);
            if (!isNaN(tonPrice) && tonPrice >= 0) {
                updateData.sellingPricePerTonUSD = tonPrice;
                createData.sellingPricePerTonUSD = tonPrice;
            } else {
               return NextResponse.json({ error: 'سعر طن غير صالح' }, { status: 400 });
            }
        }

        if (Object.keys(updateData).length === 0) {
           return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
        }

        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            create: createData,
            update: updateData
        });

        if (processedRate !== null) {
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
                    data: { amount: processedRate }
                });
            } else {
                await prisma.expense.create({
                    data: {
                        description: 'سعر الصرف اليومي (تلقائي)',
                        amount: processedRate,
                        category: 'سعر الصرف',
                        date: new Date().toISOString()
                    }
                });
            }
        }

        return NextResponse.json({ rate: setting.exchangeRate, sellingPricePerTonUSD: setting.sellingPricePerTonUSD, success: true });
    } catch (error) {
        console.error('Exchange Rate Update Error:', error);
        return NextResponse.json({ error: 'فشل حفظ التحديث' }, { status: 500 });
    }
}
