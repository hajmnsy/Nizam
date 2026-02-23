
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Categories ---')
    const categories = await prisma.category.findMany()
    console.table(categories)

    console.log('\n--- Products with Categories ---')
    const products = await prisma.product.findMany({
        include: { category: true }
    })

    // Print a simplified view
    const simplified = products.map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId,
        categoryName: p.category?.name || 'NO CATEGORY'
    }))
    console.table(simplified)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
