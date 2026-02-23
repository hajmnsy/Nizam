
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Testing Sale creation with discount...')
        const sale = await prisma.sale.create({
            data: {
                customer: 'Test Client',
                total: 100,
                discount: 10,
                status: 'QUOTATION',
                items: {
                    create: []
                }
            }
        })
        console.log('Successfully created sale:', sale)

        // Clean up
        await prisma.sale.delete({ where: { id: sale.id } })
        console.log('Cleaned up test sale')
    } catch (error) {
        console.error('Error creating sale:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
