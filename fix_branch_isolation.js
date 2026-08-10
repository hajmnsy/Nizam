const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
    console.log('Fixing branch hierarchy and user assignments...')

    // 1. Ensure Branch 1 is "الفرع الرئيسي"
    const mainBranch = await prisma.branch.upsert({
        where: { id: 1 },
        update: { name: 'الفرع الرئيسي', code: 'main' },
        create: { id: 1, name: 'الفرع الرئيسي', code: 'main' }
    })
    console.log('Updated Branch 1: الفرع الرئيسي')

    // 2. Ensure Branch 2 is "فرع الجودة"
    const jawdaBranch = await prisma.branch.upsert({
        where: { id: 2 },
        update: { name: 'فرع الجودة', code: 'aljawda' },
        create: { id: 2, name: 'فرع الجودة', code: 'aljawda' }
    })
    console.log('Updated Branch 2: فرع الجودة')

    // 3. Ensure Branch 3 is "فرع السوق"
    const souqBranch = await prisma.branch.upsert({
        where: { id: 3 },
        update: { name: 'فرع السوق', code: 'alsouq' },
        create: { id: 3, name: 'فرع السوق', code: 'alsouq' }
    })
    console.log('Updated Branch 3: فرع السوق')

    // 4. Configure Super Admin: Mnsy / Mnsy@199511 -> branchId: null (Access to all)
    await prisma.user.upsert({
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
    console.log('Super Admin Mnsy -> Full Access across all branches')

    // 5. Configure Al-Jawda User: admin / Mnsy1995 -> branchId: 2 (فرع الجودة)
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashPassword('Mnsy1995'),
            role: 'CASHIER',
            branchId: 2
        },
        create: {
            username: 'admin',
            password: hashPassword('Mnsy1995'),
            role: 'CASHIER',
            branchId: 2
        }
    })
    console.log('Al-Jawda User admin -> Assigned strictly to Branch 2 (فرع الجودة)')

    // 6. Configure Al-Souq User: alsouq / Alsouq202689 -> branchId: 3 (فرع السوق)
    await prisma.user.upsert({
        where: { username: 'alsouq' },
        update: {
            password: hashPassword('Alsouq202689'),
            role: 'CASHIER',
            branchId: 3
        },
        create: {
            username: 'alsouq',
            password: hashPassword('Alsouq202689'),
            role: 'CASHIER',
            branchId: 3
        }
    })
    console.log('Al-Souq User alsouq -> Assigned strictly to Branch 3 (فرع السوق)')

    console.log('Branch isolation and user credentials fixed successfully!')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
