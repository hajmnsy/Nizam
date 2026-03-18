import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting payment migration...');
    const sales = await prisma.sale.findMany({
        where: {
            OR: [
                { paidAmount: { gt: 0 } },
                { status: 'PAID', paidAmount: 0 } 
            ]
        }
    });

    console.log(`Found ${sales.length} sales to check for migration.`);
    let migratedCount = 0;

    // Fetch existing payment sale IDs to avoid retrieving them one by one
    const existingPayments = await prisma.payment.findMany({ select: { saleId: true } });
    const existingSaleIds = new Set(existingPayments.map(p => p.saleId));

    const paymentsToCreate = [];

    for (const sale of sales) {
        let amount = sale.paidAmount;
        if (sale.status === 'PAID' && amount === 0) {
            amount = sale.total;
        }

        if (amount > 0 && !existingSaleIds.has(sale.id)) {
            paymentsToCreate.push({
                saleId: sale.id,
                amount: amount,
                // For legacy records without an updatedAt, we must use createdAt
                createdAt: sale.createdAt,
                updatedAt: sale.createdAt
            });
        }
    }

    console.log(`Prepared ${paymentsToCreate.length} payment records to insert.`);

    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < paymentsToCreate.length; i += batchSize) {
        const batch = paymentsToCreate.slice(i, i + batchSize);
        if (batch.length > 0) {
            const result = await prisma.payment.createMany({
                data: batch,
                skipDuplicates: true
            });
            migratedCount += result.count;
            console.log(`Inserted batch of ${result.count} records...`);
        }
    }

    console.log(`Migration complete. Inserted a total of ${migratedCount} payment records.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
