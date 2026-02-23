const { PrismaClient } = require('@prisma/client')
const cryptoLib = require('crypto')

const prisma = new PrismaClient()

function hashPassword(password: string): string {
    return cryptoLib.createHash('sha256').update(password).digest('hex')
}

async function main() {
    const existing = await prisma.user.findUnique({
        where: { username: 'admin' }
    })

    if (existing) {
        console.log('Admin user already exists, updating password...')
        await prisma.user.update({
            where: { username: 'admin' },
            data: { password: hashPassword('admin123') }
        })
    } else {
        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashPassword('admin123'),
            }
        })
    }

    console.log('✅ Admin user ready (admin / admin123)')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
