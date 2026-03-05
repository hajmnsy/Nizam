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

        // 1. Calculate Opening Balance (All history BEFORE startDate)
        const pastSales = await prisma.sale.aggregate({
            where: {
                createdAt: { lt: startDate }
            },
            _sum: { paidAmount: true, total: true }
        });

        // For older records before paidAmount was introduced, if paidAmount is 0 but it's PAID status, fallback to total (as done in daily report)
        const pastLegacyPaidSales = await prisma.sale.aggregate({
            where: {
                createdAt: { lt: startDate },
                status: 'PAID',
                paidAmount: 0 // assuming old records have 0 or null. Schema says default 0.
            },
            _sum: { total: true }
        });

        // Summing up actual paid amounts + legacy paid totals
        const totalPastReceipts = (pastSales._sum.paidAmount || 0) + (pastLegacyPaidSales._sum.total || 0);

        const pastExpenses = await prisma.expense.aggregate({
            where: {
                date: { lt: startDate }
            },
            _sum: { amount: true }
        });
        const totalPastExpenses = pastExpenses._sum.amount || 0;

        const openingBalance = totalPastReceipts - totalPastExpenses;

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
