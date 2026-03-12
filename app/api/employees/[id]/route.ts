export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const json = await request.json()
        const employee = await prisma.employee.update({
            where: { id },
            data: {
                name: json.name,
                monthlySalary: parseFloat(json.monthlySalary),
                isActive: json.isActive !== undefined ? json.isActive : true
            }
        })
        return NextResponse.json(employee)
    } catch (error) {
        console.error('Failed to update employee:', error)
        return NextResponse.json({ error: 'Error updating employee' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        // Check for attached expenses before deleting
        const attachedExpenses = await prisma.expense.count({
            where: { employeeId: id }
        })

        if (attachedExpenses > 0) {
            // Soft delete
            await prisma.employee.update({
                where: { id },
                data: { isActive: false }
            })
            return NextResponse.json({ success: true, message: 'Employee soft-deleted as they have existing advances.' })
        } else {
            // Hard delete
            await prisma.employee.delete({
                where: { id }
            })
            return NextResponse.json({ success: true })
        }
    } catch (error) {
        console.error('Failed to delete employee:', error)
        return NextResponse.json({ error: 'Error deleting employee' }, { status: 500 })
    }
}
