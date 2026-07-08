export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET() {
    try {
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
        thirtyDaysAgo.setHours(0, 0, 0, 0)
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        
        const last30Days = new Array(30).fill(0).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            return d
        }).reverse()

        const branchId = getActiveBranchId()

        // 1. Cashflow Chart Data (Last 30 Days)
        const salesPeriod = await prisma.sale.findMany({
            where: { branchId, createdAt: { gte: thirtyDaysAgo }, status: { not: 'QUOTATION' } },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })
        const expensesPeriod = await prisma.expense.findMany({
            where: { branchId, date: { gte: thirtyDaysAgo }, category: { not: 'سعر الصرف' } },
            select: { date: true, amount: true }
        })

        const cashflowDataMap = new Map<string, any>()
        last30Days.forEach(date => {
            const str = date.toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            cashflowDataMap.set(str, { 
                date: date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }), 
                sales: 0, 
                expenses: 0, 
                profit: 0,
                sortDate: date
            })
        })

        const setting = await prisma.setting.findFirst({ where: { branchId } })
        const globalRate = setting?.exchangeRate || 1;

        const rateExpenses = await prisma.expense.findMany({
            where: {
                branchId,
                category: 'سعر الصرف',
                date: { gte: thirtyDaysAgo }
            },
            select: { date: true, amount: true }
        })
        const rateMap = new Map<string, number>()
        rateExpenses.forEach(exp => {
            const dateStr = new Date(exp.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            rateMap.set(dateStr, exp.amount)
        })

        salesPeriod.forEach(sale => {
            const str = new Date(sale.createdAt).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            if (cashflowDataMap.has(str)) {
                const dayData = cashflowDataMap.get(str)
                dayData.sales += sale.total

                // Calculate sale profit
                const saleRate = rateMap.get(str) || globalRate;
                let saleCostSDG = 0;
                sale.items.forEach(item => {
                    const productCostUSD = (item.product?.purchasePriceUSD || 0) + (item.product?.transportCostUSD || 0);
                    saleCostSDG += productCostUSD * saleRate * item.quantity;
                });
                dayData.profit += (sale.total - saleCostSDG);
            }
        })

        expensesPeriod.forEach(exp => {
            const str = new Date(exp.date).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
            if (cashflowDataMap.has(str)) cashflowDataMap.get(str).expenses += exp.amount
        })

        const cashflowChart = Array.from(cashflowDataMap.values()).map(d => ({
            date: d.date,
            sales: d.sales,
            expenses: d.expenses,
            profit: Math.round(d.profit)
        }))

        // 2. Expenses By Category (This Month)
        const monthlyExpensesRaw = await prisma.expense.groupBy({
            by: ['category'],
            where: { branchId, date: { gte: firstDayOfMonth }, category: { not: 'سعر الصرف' } },
            _sum: { amount: true }
        })
        const expensesByCategory = monthlyExpensesRaw.map(e => ({
            name: e.category,
            value: e._sum.amount || 0
        })).sort((a,b) => b.value - a.value)

        // 3. Sales By Category (This Month)
        const monthlySaleItems = await prisma.saleItem.findMany({
            where: { sale: { branchId, createdAt: { gte: firstDayOfMonth }, status: { not: 'QUOTATION' } } },
            include: { product: { include: { category: true } } }
        })
        
        const salesCategoryMap = new Map<string, number>()
        monthlySaleItems.forEach(item => {
            const catName = item.product?.category?.name || 'أخرى'
            const value = item.price * item.quantity
            salesCategoryMap.set(catName, (salesCategoryMap.get(catName) || 0) + value)
        })
        const salesByCategory = Array.from(salesCategoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)

        // 4. Top Selling Products (Extended - Revenue + Quantity)
        const topSelling = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: { sale: { branchId, createdAt: { gte: firstDayOfMonth }, status: { not: 'QUOTATION' } } },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        })

        const topProductsDetails = await Promise.all(topSelling.map(async (item) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } })
            // Calculate actual revenue for this product this month
            const revSource = monthlySaleItems.filter(s => s.productId === item.productId)
            const revenue = revSource.reduce((sum, s) => sum + (s.price * s.quantity), 0)
            return {
                name: product?.name || 'Unknown',
                quantity: item._sum.quantity,
                revenue
            }
        }))

        // 5. Top Customers (By Revenue)
        const topCustomersRaw = await prisma.sale.groupBy({
            by: ['customer'],
            where: { branchId, createdAt: { gte: firstDayOfMonth }, status: { not: 'QUOTATION' } },
            _sum: { total: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 5
        })
        
        const topCustomers = topCustomersRaw.map(c => ({
            name: c.customer && c.customer.trim() !== '' ? c.customer : 'عميل عام',
            total: c._sum.total || 0
        }))

        // 6. Global Stats (Low Stock, Month totals)
        const lowStock = await prisma.product.count({
            where: { branchId, quantity: { lt: 10 } }
        })
        
        const totalSalesMonth = Array.from(salesCategoryMap.values()).reduce((a,b)=>a+b, 0)
        const totalExpensesMonth = expensesByCategory.reduce((sum, e) => sum + e.value, 0)

        // Calculate actual net profit from trading (selling price SDG - cost price USD * rate) for the current month
        let totalProfitMonth = 0;
        salesPeriod.forEach(sale => {
            if (new Date(sale.createdAt) >= firstDayOfMonth) {
                const str = new Date(sale.createdAt).toLocaleDateString('en-CA', { timeZone: 'Africa/Khartoum' })
                const saleRate = rateMap.get(str) || globalRate;
                let saleCostSDG = 0;
                sale.items.forEach(item => {
                    const productCostUSD = (item.product?.purchasePriceUSD || 0) + (item.product?.transportCostUSD || 0);
                    saleCostSDG += productCostUSD * saleRate * item.quantity;
                });
                totalProfitMonth += (sale.total - saleCostSDG);
            }
        })

        return NextResponse.json({
            cashflowChart,
            expensesByCategory,
            salesByCategory,
            topProducts: topProductsDetails,
            topCustomers,
            stats: {
                monthlySales: totalSalesMonth,
                monthlyExpenses: totalExpensesMonth,
                netProfit: Math.round(totalProfitMonth),
                lowStockCount: lowStock
            }
        })

    } catch (error) {
        console.error('Analytics Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
