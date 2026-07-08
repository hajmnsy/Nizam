export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const branchId = getActiveBranchId()

        // 1. Calculate Daily Sales
        const todaySales = await prisma.sale.findMany({
            where: {
                branchId,
                createdAt: {
                    gte: today
                }
            }
        })
        const dailySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0)

        // 2. Calculate Monthly Sales
        const monthSales = await prisma.sale.findMany({
            where: {
                branchId,
                createdAt: {
                    gte: firstDayOfMonth
                },
                status: { not: 'QUOTATION' }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })
        const monthlySalesTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0)

        // 3. Calculate Monthly Expenses
        const monthExpenses = await prisma.expense.findMany({
            where: {
                branchId,
                date: {
                    gte: firstDayOfMonth
                }
            }
        })
        const monthlyExpensesTotal = monthExpenses
            .filter((exp: any) => exp.category !== 'سعر الصرف')
            .reduce((sum, exp) => sum + exp.amount, 0)

        // Calculate actual net profit from trading (selling price SDG - cost price USD * rate)
        const setting = await prisma.setting.findFirst({ where: { branchId } })
        const globalRate = setting?.exchangeRate || 1;

        const rateExpenses = await prisma.expense.findMany({
            where: {
                branchId,
                category: 'سعر الصرف',
                date: { gte: firstDayOfMonth }
            },
            select: { date: true, amount: true }
        })
        const rateMap = new Map<string, number>()
        rateExpenses.forEach(exp => {
            const dateStr = new Date(exp.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            rateMap.set(dateStr, exp.amount)
        })

        let monthlyNetProfit = 0;
        monthSales.forEach(sale => {
            const dateStr = new Date(sale.createdAt).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            const saleRate = rateMap.get(dateStr) || globalRate;

            let saleCostSDG = 0;
            sale.items.forEach(item => {
                const productCostUSD = (item.product?.purchasePriceUSD || 0) + (item.product?.transportCostUSD || 0);
                saleCostSDG += productCostUSD * saleRate * item.quantity;
            });

            const saleProfitSDG = sale.total - saleCostSDG;
            monthlyNetProfit += saleProfitSDG;
        });

        // 4. Low Stock Items (Threshold < 10)
        const lowStockItems = await prisma.product.findMany({
            where: {
                branchId,
                quantity: {
                    lt: 10
                }
            },
            take: 5,
            orderBy: {
                quantity: 'asc'
            }
        })

        // 5. Recent Activity (Last 5 sales)
        const recentSales = await prisma.sale.findMany({
            where: { branchId },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        return NextResponse.json({
            dailySales: dailySalesTotal,
            monthlySales: monthlySalesTotal,
            monthlyExpenses: monthlyExpensesTotal,
            netProfit: Math.round(monthlyNetProfit),
            lowStockItems,
            recentSales
        })

    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
