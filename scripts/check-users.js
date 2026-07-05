const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ select: { username: true, role: true } });
    console.log('USERS:', JSON.stringify(users, null, 2));
    const branches = await prisma.branch.findMany();
    console.log('BRANCHES:', JSON.stringify(branches, null, 2));
}
main().finally(() => prisma.$disconnect());
