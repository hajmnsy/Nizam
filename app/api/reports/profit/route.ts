export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        const branchId = getActiveBranchId()

        let startDate: Date
        let endDate: Date

        if (dateParam) {
            startDate = new Date(`${dateParam}T00:00:00.000+02:00`)
            endDate = new Date(`${dateParam}T23:59:59.999+02:00`)
        } else if (startDateParam && endDateParam) {
            startDate = new Date(`${startDateParam}T00:00:00.000+02:00`)
            endDate = new Date(`${endDateParam}T23:59:59.999+02:00`)
        } else {
            // Default to today in Khartoum local time
            const todayStr = new Date(new Date().getTime() + (2 * 60 * 60 * 1000)).toISOString().split('T')[0]
            startDate = new Date(`${todayStr}T00:00:00.000+02:00`)
            endDate = new Date(`${todayStr}T23:59:59.999+02:00`)
        }

        // Global exchange rate fallback
        const setting = await prisma.setting.findFirst({ where: { branchId } })
        const globalRate = setting?.exchangeRate || 1

        // Exchange rate map for period
        const rateExpenses = await prisma.expense.findMany({
            where: {
                branchId,
                category: 'سعر الصرف',
                date: { gte: startDate, lte: endDate }
            },
            select: { date: true, amount: true }
        })
        const rateMap = new Map<string, number>()
        rateExpenses.forEach(exp => {
            const dateStr = new Date(exp.date).toISOString().split('T')[0]
            rateMap.set(dateStr, exp.amount)
        })

        // Fetch sales
        const sales = await prisma.sale.findMany({
            where: {
                branchId,
                createdAt: { gte: startDate, lte: endDate },
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

        // Fetch expenses (excluding exchange rate category)
        const expenses = await prisma.expense.findMany({
            where: {
                branchId,
                date: { gte: startDate, lte: endDate },
                category: { not: 'سعر الصرف' }
            }
        })

        let totalSalesSDG = 0
        let totalSalesUSD = 0
        let totalCostSDG = 0
        let totalCostUSD = 0
        let totalProfitSDG = 0
        let totalProfitUSD = 0
        let totalItemsQuantity = 0

        sales.forEach(sale => {
            const saleDateStr = new Date(sale.createdAt).toISOString().split('T')[0]
            const saleRate = rateMap.get(saleDateStr) || globalRate

            const saleTotalSDG = sale.total
            const saleTotalUSD = saleRate > 0 ? saleTotalSDG / saleRate : 0

            let saleCostUSD = 0
            sale.items.forEach(item => {
                const productCostUSD = item.product?.purchasePriceUSD || 0
                saleCostUSD += productCostUSD * item.quantity
                totalItemsQuantity += item.quantity
            })

            const saleCostSDG = saleCostUSD * saleRate
            const saleProfitSDG = saleTotalSDG - saleCostSDG
            const saleProfitUSD = saleRate > 0 ? saleProfitSDG / saleRate : 0

            totalSalesSDG += saleTotalSDG
            totalSalesUSD += saleTotalUSD
            totalCostSDG += saleCostSDG
            totalCostUSD += saleCostUSD
            totalProfitSDG += saleProfitSDG
            totalProfitUSD += saleProfitUSD
        })

        let totalExpensesSDG = 0
        let totalExpensesUSD = 0
        expenses.forEach(exp => {
            const expDateStr = new Date(exp.date).toISOString().split('T')[0]
            const expRate = rateMap.get(expDateStr) || globalRate
            totalExpensesSDG += exp.amount
            totalExpensesUSD += expRate > 0 ? exp.amount / expRate : 0
        })

        const netProfitAfterExpensesSDG = totalProfitSDG - totalExpensesSDG
        const netProfitAfterExpensesUSD = totalProfitUSD - totalExpensesUSD
        const averageExchangeRate = totalProfitUSD > 0 ? (totalProfitSDG / totalProfitUSD) : globalRate

        return NextResponse.json({
            period: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            },
            salesCount: sales.length,
            totalItemsQuantity,
            totalSalesSDG: Math.round(totalSalesSDG),
            totalSalesUSD: parseFloat(totalSalesUSD.toFixed(2)),
            totalCostSDG: Math.round(totalCostSDG),
            totalCostUSD: parseFloat(totalCostUSD.toFixed(2)),
            profitSDG: Math.round(totalProfitSDG),
            profitUSD: parseFloat(totalProfitUSD.toFixed(2)),
            expensesSDG: Math.round(totalExpensesSDG),
            expensesUSD: parseFloat(totalExpensesUSD.toFixed(2)),
            netProfitAfterExpensesSDG: Math.round(netProfitAfterExpensesSDG),
            netProfitAfterExpensesUSD: parseFloat(netProfitAfterExpensesUSD.toFixed(2)),
            averageExchangeRate: Math.round(averageExchangeRate)
        })

    } catch (error) {
        console.error('Error fetching profit report:', error)
        return NextResponse.json({ error: 'Failed to calculate profit report' }, { status: 500 })
    }
}
