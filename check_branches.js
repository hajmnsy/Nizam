const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const branches = await prisma.branch.findMany()
    console.log('--- BRANCHES ---')
    console.log(JSON.stringify(branches, null, 2))

    const users = await prisma.user.findMany({
        select: { id: true, username: true, role: true, branchId: true, branch: true }
    })
    console.log('--- USERS ---')
    console.log(JSON.stringify(users, null, 2))
}

main().finally(() => prisma.$disconnect())
