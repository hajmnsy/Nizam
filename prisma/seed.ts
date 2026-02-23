import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const categories = [
        { name: 'حديد تسليح' },
        { name: 'مسطحات' },
        { name: 'قطاعات' },
        { name: 'مواسير' },
        { name: 'زوايا' },
    ]

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { id: 0 }, // This is a hack, ideally use name if unique or findFirst
            update: {},
            create: cat,
        }).catch(async () => {
            // Fallback if upsert fails or just create
            const exists = await prisma.category.findFirst({ where: { name: cat.name } })
            if (!exists) {
                await prisma.category.create({ data: cat })
            }
        })
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
