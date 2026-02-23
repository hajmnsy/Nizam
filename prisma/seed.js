const { PrismaClient } = require('@prisma/client')

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
        const exists = await prisma.category.findFirst({ where: { name: cat.name } })
        if (!exists) {
            await prisma.category.create({ data: cat })
            console.log(`Created category: ${cat.name}`)
        } else {
            console.log(`Category exists: ${cat.name}`)
        }
    }
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
