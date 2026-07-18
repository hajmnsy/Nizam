export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        await prisma.expense.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting expense' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const json = await request.json()
        const { description, amount, date, category, employeeId } = json

        if (!description || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                category: category || 'عام',
                employeeId: employeeId ? parseInt(employeeId) : null,
            }
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error updating expense:', error)
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }
}
