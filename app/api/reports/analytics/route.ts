export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const today = new Date()
        const last7Days = new Array(7).fill(0).map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            return d
        }).reverse()

        // 1. Sales Chart Data (Last 7 Days)
        const salesData = await Promise.all(last7Days.map(async (date) => {
            const nextDay = new Date(date)
            nextDay.setDate(date.getDate() + 1)

            const sales = await prisma.sale.aggregate({
                where: {
                    createdAt: { gte: date, lt: nextDay },
                    status: 'PAID'
                },
                _sum: { total: true }
            })
            return {
                date: date.toLocaleDateString('ar-SD', { weekday: 'short' }),
                sales: sales._sum.total || 0
            }
        }))

        // 2. Top Selling Products
        const topSelling = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        })

        const topProductsDetails = await Promise.all(topSelling.map(async (item) => {
            const product = await prisma.product.findUnique({ where: { id: item.productId } })
            return {
                name: product?.name || 'Unknown',
                quantity: item._sum.quantity
            }
        }))

        // 3. Low Stock 
        const lowStock = await prisma.product.count({
            where: { quantity: { lt: 10 } }
        })

        // 4. Total Net Profit Estimate (Simplified: Sales - Expenses) for this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthlySales = await prisma.sale.aggregate({
            where: { createdAt: { gte: firstDayOfMonth }, status: 'PAID' },
            _sum: { total: true }
        })
        const monthlyExpenses = await prisma.expense.aggregate({
            where: { date: { gte: firstDayOfMonth } },
            _sum: { amount: true }
        })

        return NextResponse.json({
            salesChart: salesData,
            topProducts: topProductsDetails,
            stats: {
                monthlySales: monthlySales._sum.total || 0,
                monthlyExpenses: monthlyExpenses._sum.amount || 0,
                netProfit: (monthlySales._sum.total || 0) - (monthlyExpenses._sum.amount || 0),
                lowStockCount: lowStock
            }
        })

    } catch (error) {
        console.error('Analytics Error:', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
