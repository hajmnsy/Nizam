
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { date: 'desc' }
        })
        return NextResponse.json(expenses)
    } catch (error) {
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
