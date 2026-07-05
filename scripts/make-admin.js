const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.user.update({
        where: { username: 'admin' },
        data: { role: 'ADMIN' }
    });
    console.log('✅ Updated user admin to role ADMIN:', updated);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
