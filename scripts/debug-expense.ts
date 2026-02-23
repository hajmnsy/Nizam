
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Attempting to create expense...')
        const expense = await prisma.expense.create({
            data: {
                description: 'Test Expense',
                amount: 100.50,
                date: new Date()
            }
        })
        console.log('Expense created successfully:', expense)
    } catch (e) {
        console.error('Error creating expense:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
