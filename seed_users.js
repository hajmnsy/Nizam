const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
    console.log('Seeding core users and branches...')

    // 1. Ensure Branch 1 (فرع الجودة) and Branch 2 (فرع السوق) exist
    let branch1 = await prisma.branch.findFirst({ where: { OR: [{ id: 1 }, { code: 'aljawda' }] } })
    if (!branch1) {
        branch1 = await prisma.branch.create({
            data: {
                name: 'فرع الجودة',
                code: 'aljawda'
            }
        })
        console.log('Created Branch 1: فرع الجودة')
    } else if (branch1.name !== 'فرع الجودة') {
        branch1 = await prisma.branch.update({
            where: { id: branch1.id },
            data: { name: 'فرع الجودة' }
        })
    }

    let branch2 = await prisma.branch.findFirst({ where: { OR: [{ id: 2 }, { code: 'alsouq' }] } })
    if (!branch2) {
        branch2 = await prisma.branch.create({
            data: {
                name: 'فرع السوق',
                code: 'alsouq'
            }
        })
        console.log('Created Branch 2: فرع السوق')
    } else if (branch2.name !== 'فرع السوق') {
        branch2 = await prisma.branch.update({
            where: { id: branch2.id },
            data: { name: 'فرع السوق' }
        })
    }

    // 2. Super Admin User: Mnsy / Mnsy@199511
    const adminUser = await prisma.user.upsert({
        where: { username: 'Mnsy' },
        update: {
            password: hashPassword('Mnsy@199511'),
            role: 'ADMIN',
            branchId: null
        },
        create: {
            username: 'Mnsy',
            password: hashPassword('Mnsy@199511'),
            role: 'ADMIN',
            branchId: null
        }
    })
    console.log('Configured Super Admin: Mnsy')

    // 3. Al-Jawda Branch User: admin / Mnsy1995
    const jawdaUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashPassword('Mnsy1995'),
            role: 'CASHIER',
            branchId: branch1.id
        },
        create: {
            username: 'admin',
            password: hashPassword('Mnsy1995'),
            role: 'CASHIER',
            branchId: branch1.id
        }
    })
    console.log(`Configured Al-Jawda User: admin (Branch ID: ${branch1.id})`)

    // 4. Al-Souq Branch User: alsouq / Alsouq202689
    const souqUser = await prisma.user.upsert({
        where: { username: 'alsouq' },
        update: {
            password: hashPassword('Alsouq202689'),
            role: 'CASHIER',
            branchId: branch2.id
        },
        create: {
            username: 'alsouq',
            password: hashPassword('Alsouq202689'),
            role: 'CASHIER',
            branchId: branch2.id
        }
    })
    console.log(`Configured Al-Souq User: alsouq (Branch ID: ${branch2.id})`)

    console.log('All core users seeded successfully!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
