import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // 1. Calculate Daily Sales
        const todaySales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: today
                }
            }
        })
        const dailySalesTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0)

        // 2. Calculate Monthly Sales
        const monthSales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: firstDayOfMonth
                }
            }
        })
        const monthlySalesTotal = monthSales.reduce((sum, sale) => sum + sale.total, 0)

        // 3. Calculate Monthly Expenses
        const monthExpenses = await prisma.expense.findMany({
            where: {
                date: {
                    gte: firstDayOfMonth
                }
            }
        })
        const monthlyExpensesTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

        // 4. Low Stock Items (Threshold < 10)
        const lowStockItems = await prisma.product.findMany({
            where: {
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
            netProfit: monthlySalesTotal - monthlyExpensesTotal,
            lowStockItems,
            recentSales
        })

    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
