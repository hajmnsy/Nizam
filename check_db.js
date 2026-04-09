const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { name: { contains: 'صاج' } },
        select: { id: true, name: true, type: true, thickness: true, quantity: true }
    });
    console.log("Products:", JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
