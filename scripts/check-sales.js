const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sales = await prisma.sale.findMany({
        where: { branchId: 2 },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
    console.log(JSON.stringify(sales, null, 2));
}

main().finally(() => prisma.$disconnect());
