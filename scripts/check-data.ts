
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const productsCount = await prisma.product.count()
        const salesCount = await prisma.sale.count()
        console.log(`DATA_STATUS: ${productsCount} products, ${salesCount} sales`)
    } catch (e: any) {
        console.log(`DATA_STATUS: ERROR ${e.message}`)
    } finally {
        await prisma.$disconnect()
    }
}

main()
