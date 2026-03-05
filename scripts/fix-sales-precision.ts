import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting cleanup of floating point precision in Sales...");

    const sales = await prisma.sale.findMany({
        include: { items: true },
    });

    let updatedCount = 0;

    for (const sale of sales) {
        // Round all main numbers
        const roundedTotal = Math.round(sale.total);
        const roundedPaidAmount = Math.round(sale.paidAmount);
        const roundedRemainingAmount = Math.round(sale.remainingAmount);
        const roundedDiscount = Math.round(sale.discount);

        let needsUpdate = false;

        // Check if rounding changed the value
        if (
            roundedTotal !== sale.total ||
            roundedPaidAmount !== sale.paidAmount ||
            roundedRemainingAmount !== sale.remainingAmount ||
            roundedDiscount !== sale.discount
        ) {
            needsUpdate = true;
        }

        if (needsUpdate) {
            await prisma.sale.update({
                where: { id: sale.id },
                data: {
                    total: roundedTotal,
                    paidAmount: roundedPaidAmount,
                    remainingAmount: roundedRemainingAmount,
                    discount: roundedDiscount
                }
            });
            updatedCount++;
            console.log(`Updated Sale ID ${sale.id} (Total was ${sale.total}, now ${roundedTotal})`);
        }
    }

    // Now update sale items if their prices have decimals
    const saleItems = await prisma.saleItem.findMany();
    let updatedItemsCount = 0;

    for (const item of saleItems) {
        const roundedPrice = Math.round(item.price);
        if (roundedPrice !== item.price) {
            await prisma.saleItem.update({
                where: { id: item.id },
                data: { price: roundedPrice }
            });
            updatedItemsCount++;
        }
    }

    console.log(`\nCleanup complete.`);
    console.log(`Updated ${updatedCount} sales.`);
    console.log(`Updated ${updatedItemsCount} sale items.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
