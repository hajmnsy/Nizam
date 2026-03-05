export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        // Default to today if no dates provided
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let startDate = startDateParam ? new Date(startDateParam) : new Date(today.getFullYear(), today.getMonth(), 1) // Default to start of month
        let endDate = endDateParam ? new Date(endDateParam) : new Date()

        // Ensure endDate covers the whole day
        endDate.setHours(23, 59, 59, 999)

        // Fetch Settings to check for manual Initial Balance
        const setting = await prisma.setting.findUnique({ where: { id: 'default' } })
        const hasInitialBalance = setting && setting.initialBalanceDate;
        const initialDate = hasInitialBalance ? new Date(setting.initialBalanceDate!) : undefined;

        // 1. Calculate Opening Balance
        let openingBalance = 0;

        if (hasInitialBalance && initialDate && startDate > initialDate) {
            // If report starts AFTER the initial balance date:
            // Calculate movement BETWEEN initialDate and startDate, then add to the initialBalance.
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { gte: initialDate, lt: startDate } },
                _sum: { paidAmount: true, total: true }
            });

            const pastLegacyPaidSales = await prisma.sale.aggregate({
                where: { createdAt: { gte: initialDate, lt: startDate }, status: 'PAID', paidAmount: 0 },
                _sum: { total: true }
            });

            const totalPastReceipts = (pastSales._sum.paidAmount || 0) + (pastLegacyPaidSales._sum.total || 0);

            const pastExpenses = await prisma.expense.aggregate({
                where: { date: { gte: initialDate, lt: startDate } },
                _sum: { amount: true }
            });

            openingBalance = (setting.initialBalance || 0) + totalPastReceipts - (pastExpenses._sum.amount || 0);

        } else if (hasInitialBalance && initialDate && startDate <= initialDate) {
            // If the report starts ON or BEFORE the initial date:
            // The opening balance is exactly the initial balance. (It assumes they are viewing the start point).
            openingBalance = setting.initialBalance || 0;
        } else {
            // Legacy behavior: No initial balance set, calculate all history BEFORE startDate
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { lt: startDate } },
                _sum: { paidAmount: true, total: true }
            });

            const pastLegacyPaidSales = await prisma.sale.aggregate({
                where: {
                    createdAt: { lt: startDate },
                    status: 'PAID',
                    paidAmount: 0 // assuming old records have 0 or null. Schema says default 0.
                },
                _sum: { total: true }
            });

            const totalPastReceipts = (pastSales._sum.paidAmount || 0) + (pastLegacyPaidSales._sum.total || 0);

            const pastExpenses = await prisma.expense.aggregate({
                where: {
                    date: { lt: startDate }
                },
                _sum: { amount: true }
            });

            openingBalance = totalPastReceipts - (pastExpenses._sum.amount || 0);
        }

        // 2. Fetch data WITHIN the date range
        const salesInPeriod = await prisma.sale.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: { createdAt: true, paidAmount: true, total: true, status: true }
        });

        const expensesInPeriod = await prisma.expense.findMany({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            select: { date: true, amount: true }
        });

        // 3. Group by Day
        const dailyData = new Map<string, { dateObj: Date, receipts: number, expenses: number }>();

        salesInPeriod.forEach(sale => {
            const dateStr = new Date(sale.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD local
            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, { dateObj: new Date(sale.createdAt), receipts: 0, expenses: 0 });
            }

            let amount = sale.paidAmount;
            if (sale.status === 'PAID' && amount === 0) {
                amount = sale.total; // Legacy record fallback
            }
            dailyData.get(dateStr)!.receipts += amount;
        });

        expensesInPeriod.forEach(expense => {
            const dateStr = new Date(expense.date).toLocaleDateString('en-CA');
            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, { dateObj: new Date(expense.date), receipts: 0, expenses: 0 });
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
                date: day.dateObj.toLocaleDateString('ar-EG', { month: '2-digit', day: '2-digit' }), // MM/DD like in the image
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

    } catch (error) {
        console.error('Movement Report Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
