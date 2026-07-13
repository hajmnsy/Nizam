const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find the sale with invoiceNumber 18 in Branch 2 (or all branches)
    const sales = await prisma.sale.findMany({
        where: { invoiceNumber: 18 },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
    console.log('SALES WITH INVOICE 18:', JSON.stringify(sales, null, 2));

    // Also let's search for products with names containing "عز" or "مراكبي" to see their current stock
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: 'عز' } },
                { name: { contains: 'مراكبي' } }
            ]
        }
    });
    console.log('PRODUCTS:', JSON.stringify(products, null, 2));
}

main().finally(() => prisma.$disconnect());
