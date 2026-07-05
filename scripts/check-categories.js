const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany({
        include: { branch: true }
    });
    console.log(JSON.stringify(categories, null, 2));
}

main().finally(() => prisma.$disconnect());
