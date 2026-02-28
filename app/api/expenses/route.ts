export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        let whereClause: any = {}

        if (startDateParam && endDateParam) {
            const startDate = new Date(startDateParam)
            startDate.setUTCHours(0, 0, 0, 0)

            const endDate = new Date(endDateParam)
            endDate.setUTCHours(23, 59, 59, 999)

            whereClause.date = {
                gte: startDate,
                lte: endDate
            }
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'asc' } // Sort asc for the report chronological view
        })
        return NextResponse.json(expenses)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const { description, amount, date, category } = json

        if (!description || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                category: category || 'تشغيلية'
            }
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error creating expense:', error)
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }
}
