
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
    'كمر',
    'مواسير مستطيلة',
    'مواسير مربعة',
    'مواسير دائرية',
    'زاوية',
    'زنك أمريكي',
    'زنك بلدي',
    'صاج',
    'اكس بندة',
    'شرائح',
    'كانات',
    'سيخ',
    'منتجات أخرى'
]

async function main() {
    console.log('Seeding categories...')
    for (const name of categories) {
        const existing = await prisma.category.findFirst({ where: { name } })
        if (!existing) {
            await prisma.category.create({ data: { name } })
            console.log(`Created category: ${name}`)
        } else {
            console.log(`Category exists: ${name}`)
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
