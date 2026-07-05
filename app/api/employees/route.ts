export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date') // usually passing a YYYY-MM date

        const dateObj = dateParam ? new Date(dateParam) : new Date()
        const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1)
        const endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999)

        const branchId = getActiveBranchId()

        // Fetch all employees with their specific expenses for the context month 
        const employees = await prisma.employee.findMany({
            where: { isActive: true, branchId },
            include: {
                expenses: {
                    where: {
                        date: {
                            gte: startOfMonth,
                            lte: endOfMonth
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Serialize the data to include `withdrawnAmount` and `remainingBalance`
        const employeesWithBalance = employees.map(emp => {
            const withdrawnAmount = emp.expenses.reduce((sum, exp) => sum + exp.amount, 0)
            const remainingBalance = emp.monthlySalary - withdrawnAmount
            return {
                ...emp,
                withdrawnAmount,
                remainingBalance
            }
        })

        return NextResponse.json(employeesWithBalance)
    } catch (error) {
        console.error('Failed to fetch employees:', error)
        return NextResponse.json({ error: 'Error fetching employees' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const branchId = getActiveBranchId()
        const employee = await prisma.employee.create({
            data: {
                name: json.name,
                monthlySalary: parseFloat(json.monthlySalary) || 0,
                branchId
            }
        })
        return NextResponse.json(employee)
    } catch (error) {
        console.error('Failed to create employee:', error)
        return NextResponse.json({ error: 'Error creating employee' }, { status: 500 })
    }
}
