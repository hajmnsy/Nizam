
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start updating categories and sample data...')

    // 1. Clear existing data to avoid duplicates (optional, but good for reset)
    // Be careful with this in production!
    await prisma.saleItem.deleteMany({})
    await prisma.sale.deleteMany({})
    await prisma.product.deleteMany({})
    // We won't delete categories to avoid foreign key issues if we missed something, 
    // but we will upsert them.

    // 2. Define the User's Categories
    const categoryNames = [
        'مواسير مستطيلة',
        'مواسير مربعة',
        'مواسير دائرية',
        'صاج',
        'شرائح',
        'زنك أمريكي',
        'زنك بلدي',
        'زوايا',
        'كمر',
        'سيخ',
        'أخرى'
    ]

    const categoryMap = new Map<string, number>()

    for (const name of categoryNames) {
        const cat = await prisma.category.upsert({
            where: { id: 0 }, // Hacky trigger for create
            update: {},
            create: { name },
        }).catch(async () => {
            // Fallback find if upsert fails
            let c = await prisma.category.findFirst({ where: { name } })
            if (!c) {
                c = await prisma.category.create({ data: { name } })
            }
            return c
        })

        // Re-fetch to be sure we have the ID
        const finalCat = await prisma.category.findFirst({ where: { name } })
        if (finalCat) {
            categoryMap.set(name, finalCat.id)
        }
    }

    // 3. Create Sample Products for the new categories
    const products = [
        {
            name: 'ماسورة مستطيلة 4x8 سم - 2مم',
            type: 'Local',
            thickness: 2,
            width: 40,
            length: 6,
            weightPerUnit: 12.5,
            quantity: 100,
            price: 550,
            categoryId: categoryMap.get('مواسير مستطيلة'),
        },
        {
            name: 'ماسورة مربعة 5x5 سم - 1.5مم',
            type: 'Local',
            thickness: 1.5,
            width: 50,
            length: 6,
            weightPerUnit: 9.2,
            quantity: 150,
            price: 420,
            categoryId: categoryMap.get('مواسير مربعة'),
        },
        {
            name: 'ماسورة دائرية 2 بوصة',
            type: 'Imported',
            thickness: 3,
            width: 50,
            length: 6,
            weightPerUnit: 15.0,
            quantity: 80,
            price: 900,
            categoryId: categoryMap.get('مواسير دائرية'),
        },
        {
            name: 'لوح صاج أسود 1.5مم',
            type: 'Local',
            thickness: 1.5,
            width: 1220,
            length: 2440,
            weightPerUnit: 35.0,
            quantity: 60,
            price: 1800,
            categoryId: categoryMap.get('صاج'),
        },
        {
            name: 'شريحة صاج مجلفن 0.5مم',
            type: 'Local',
            thickness: 0.5,
            width: 200,
            length: 3000,
            weightPerUnit: 2.5,
            quantity: 500,
            price: 150,
            categoryId: categoryMap.get('شرائح'),
        },
        {
            name: 'زنك أمريكي 0.30مم',
            type: 'Imported',
            thickness: 0.30,
            width: 900,
            length: 3000,
            weightPerUnit: 6.0,
            quantity: 200,
            price: 450,
            categoryId: categoryMap.get('زنك أمريكي'),
        },
        {
            name: 'زاوية حديد 5x5 سم',
            type: 'Local',
            thickness: 5,
            width: 50,
            length: 6,
            weightPerUnit: 18.5,
            quantity: 120,
            price: 750,
            categoryId: categoryMap.get('زوايا'),
        },
        {
            name: 'كمر H-Beam 100mm',
            type: 'China',
            thickness: 6,
            width: 100,
            length: 12,
            weightPerUnit: 120,
            quantity: 20,
            price: 8500,
            categoryId: categoryMap.get('كمر'),
        },
        {
            name: 'سيخ حديد 12مم (4 لينية)',
            type: 'Ezz Steel',
            thickness: 12,
            length: 12,
            weightPerUnit: 10.6,
            quantity: 2000,
            price: 580,
            categoryId: categoryMap.get('سيخ'),
        }
    ]

    for (const product of products) {
        if (product.categoryId) {
            await prisma.product.create({
                data: product as any,
            })
        }
    }

    // 4. Create Sample Sale with new products
    const product1 = await prisma.product.findFirst()
    if (product1) {
        await prisma.sale.create({
            data: {
                customer: 'مؤسسة البناء الحديث',
                total: product1.price * 20,
                status: 'PAID',
                items: {
                    create: [
                        {
                            productId: product1.id,
                            quantity: 20,
                            price: product1.price,
                        },
                    ],
                },
            },
        })
    }

    // 5. Create Sample Expenses (if not exists)
    const expenseCount = await prisma.expense.count()
    if (expenseCount === 0) {
        await prisma.expense.createMany({
            data: [
                { description: 'فاتورة كهرباء المصنع', amount: 2500, date: new Date() },
                { description: 'صيانة رافعة شوكية', amount: 1200, date: new Date() },
            ]
        })
    }

    console.log('Categories updated and data restored successfully.')
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
