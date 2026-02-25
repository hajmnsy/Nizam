const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting backfill for invoice numbers...");
    const sales = await prisma.sale.findMany({
        where: {
            status: {
                not: 'QUOTATION'
            }
        }
    });

    for (const sale of sales) {
        await prisma.sale.update({
            where: { id: sale.id },
            data: { invoiceNumber: sale.id }
        });
        console.log(`Updated sale ${sale.id} with invoiceNumber ${sale.id}`);
    }

    console.log("Backfill completed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
