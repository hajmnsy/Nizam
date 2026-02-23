import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Fetch sale 15
    const targetSale = await prisma.sale.findUnique({
        where: { id: 15 },
        include: { items: true }
    })

    if (!targetSale) {
        console.error('Sale #15 not found!')
        return
    }

    console.log('Found Sale #15. Backing up data...')

    // 2. Delete all sale items and sales
    console.log('Deleting all sales and their items...')
    await prisma.saleItem.deleteMany({})
    await prisma.sale.deleteMany({})

    // Reset sqlite sequence to start from 1 again
    console.log('Resetting auto-increment sequence...')
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='Sale';`)
        await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name='SaleItem';`)
    } catch (e) {
        console.log('Sequence reset skipped (might be fine if using another DB or if sequencetable empty)', e)
    }

    // 3. Re-create the sale as ID 1
    console.log('Re-creating sale as #1...')
    await prisma.sale.create({
        data: {
            id: 1,
            customer: targetSale.customer,
            total: targetSale.total,
            discount: targetSale.discount,
            status: targetSale.status,
            createdAt: targetSale.createdAt,
            items: {
                create: targetSale.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                }))
            }
        }
    })

    console.log('Successfully reset invoices. Invoice 15 is now Invoice 1, and all others are deleted.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
