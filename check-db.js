const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        const products = await prisma.product.count();
        const sales = await prisma.sale.count();
        const categories = await prisma.category.count();

        console.log(`Users: ${users}`);
        console.log(`Categories: ${categories}`);
        console.log(`Products: ${products}`);
        console.log(`Sales: ${sales}`);
    } catch (e) {
        console.error("Error querying DB:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
