import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.setting.upsert({
        where: { id: 'default' },
        update: { logoUrl: '/logo.svg' },
        create: {
            id: 'default',
            companyName: 'الجودة للحديد',
            logoUrl: '/logo.svg'
        }
    })
    console.log('Logo updated successfully to /logo.svg')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
