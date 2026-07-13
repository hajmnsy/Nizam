const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ezzId = 192;
    const marakbyId = 191;

    // Get all sales for Ezz
    const ezzSales = await prisma.saleItem.findMany({
        where: { productId: ezzId, sale: { branchId: 2 } },
        include: { sale: true }
    });
    console.log('EZZ SALES:', JSON.stringify(ezzSales, null, 2));

    // Get all purchases for Ezz
    const ezzPurchases = await prisma.purchaseItem.findMany({
        where: { productId: ezzId, purchase: { branchId: 2 } },
        include: { purchase: true }
    });
    console.log('EZZ PURCHASES:', JSON.stringify(ezzPurchases, null, 2));

    // Get all sales for Marakby
    const marakbySales = await prisma.saleItem.findMany({
        where: { productId: marakbyId, sale: { branchId: 2 } },
        include: { sale: true }
    });
    console.log('MARAKBY SALES:', JSON.stringify(marakbySales, null, 2));

    // Get all purchases for Marakby
    const marakbyPurchases = await prisma.purchaseItem.findMany({
        where: { productId: marakbyId, purchase: { branchId: 2 } },
        include: { purchase: true }
    });
    console.log('MARAKBY PURCHASES:', JSON.stringify(marakbyPurchases, null, 2));
}

main().finally(() => prisma.$disconnect());
