export const dynamic = 'force-dynamic';
// Forcing hot reload for total volume update

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        const now = new Date();
        const khartoumDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' });
        const [currentYear, currentMonth] = khartoumDateStr.split('-');
        
        // Ensure accurate start boundary in +02:00
        let startDate: Date;
        if (startDateParam) {
             startDate = new Date(`${startDateParam}T00:00:00.000+02:00`);
        } else {
             startDate = new Date(`${currentYear}-${currentMonth}-01T00:00:00.000+02:00`);
        }

        // Ensure accurate end boundary in +02:00
        let endDate: Date;
        if (endDateParam) {
             endDate = new Date(`${endDateParam}T23:59:59.999+02:00`);
        } else {
             endDate = new Date(`${khartoumDateStr}T23:59:59.999+02:00`);
        }

        // Fetch Settings to check for manual Initial Balance
        const setting: any = await prisma.setting.findUnique({ where: { id: 'default' } })
        const hasInitialBalance = setting && setting.initialBalanceDate;
        const initialDate = hasInitialBalance ? new Date(setting.initialBalanceDate) : undefined;

        // 1. Calculate Opening Balance
        let openingBalance = 0;

        if (hasInitialBalance && initialDate && startDate > initialDate) {
            // If report starts AFTER the initial balance date:
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { gte: initialDate, lt: startDate }, status: { not: 'QUOTATION' } },
                _sum: { total: true }
            });

            const pastExpenses = await prisma.expense.aggregate({
                where: {
                    date: { gte: initialDate, lt: startDate },
                    category: { not: 'سعر الصرف' }
                },
                _sum: { amount: true }
            });

            openingBalance = (setting.initialBalance || 0) + (pastSales._sum.total || 0) - (pastExpenses._sum.amount || 0);

        } else if (hasInitialBalance && initialDate && startDate <= initialDate) {
            openingBalance = setting.initialBalance || 0;
        } else {
            // Legacy behavior: No initial balance set, calculate all history BEFORE startDate
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { lt: startDate }, status: { not: 'QUOTATION' } },
                _sum: { total: true }
            });

            const pastExpenses = await prisma.expense.aggregate({
                where: {
                    date: { lt: startDate },
                    category: { not: 'سعر الصرف' }
                },
                _sum: { amount: true }
            });

            openingBalance = (pastSales._sum.total || 0) - (pastExpenses._sum.amount || 0);
        }

        // 2. Fetch data WITHIN the date range
        const salesInPeriod = await prisma.sale.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { not: 'QUOTATION' }
            },
            select: { createdAt: true, total: true }
        });

        const expensesInPeriod = await prisma.expense.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                category: { not: 'سعر الصرف' }
            },
            select: { date: true, amount: true }
        });

        // 3. Group by Day
        const dailyData = new Map<string, { dateObj: Date, receipts: number, expenses: number }>();

        salesInPeriod.forEach(sale => {
            const dateStr = new Date(sale.createdAt).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' }); // YYYY-MM-DD in Sudan
            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, { dateObj: new Date(`${dateStr}T12:00:00.000+02:00`), receipts: 0, expenses: 0 }); // Midday safe anchor
            }
            dailyData.get(dateStr)!.receipts += sale.total;
        });

        expensesInPeriod.forEach(expense => {
            const dateStr = new Date(expense.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' });
            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, { dateObj: new Date(`${dateStr}T12:00:00.000+02:00`), receipts: 0, expenses: 0 });
            }
            dailyData.get(dateStr)!.expenses += expense.amount;
        });

        // Convert Map to sorted array
        const sortedDays = Array.from(dailyData.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // 4. Calculate Running Balance
        let currentBalance = openingBalance;
        let totalReceiptsPeriod = 0;
        let totalExpensesPeriod = 0;

        const reportData = sortedDays.map(day => {
            currentBalance = currentBalance + day.receipts - day.expenses;
            totalReceiptsPeriod += day.receipts;
            totalExpensesPeriod += day.expenses;

            return {
                date: day.dateObj.toLocaleDateString('ar-EG', { month: '2-digit', day: '2-digit', timeZone: 'Africa/Khartoum' }), // MM/DD like in the image
                receipts: day.receipts,
                expenses: day.expenses,
                runningBalance: currentBalance
            };
        });

        return NextResponse.json({
            openingBalance,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            data: reportData,
            totals: {
                receipts: totalReceiptsPeriod,
                expenses: totalExpensesPeriod
            }
        });

    } catch (error: any) {
        console.error('Movement Report Error:', error)
        return NextResponse.json({ error: 'Failed', details: error?.message, stack: error?.stack }, { status: 500 })
    }
}
