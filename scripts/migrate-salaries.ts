import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Migrating old salaries...')

    const result = await prisma.expense.updateMany({
        where: { category: 'رواتب' },
        data: { category: 'الرواتب' }
    });

    console.log(`Changed 'رواتب' -> 'الرواتب' for ${result.count} expenses.`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
