import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { name: { contains: "صاج" } },
        select: { id: true, name: true, quantity: true }
    });
    console.log("Products:", JSON.stringify(products, null, 2));

    const sales = await prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { items: true }
    });
    console.log("Recent Sales:", JSON.stringify(sales, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
