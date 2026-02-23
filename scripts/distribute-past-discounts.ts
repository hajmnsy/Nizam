import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting discount distribution for past invoices...')

    // Find all sales with a discount greater than 0
    const sales = await prisma.sale.findMany({
        where: {
            discount: {
                gt: 0
            }
        },
        include: {
            items: true
        }
    })

    console.log(`Found ${sales.length} sales with discounts. Processing...`)

    let updatedCount = 0;

    for (const sale of sales) {
        if (!sale.items || sale.items.length === 0) continue;

        // Calculate the subtotal of the items using their CURRENT prices
        // Assuming current prices might already be discounted if this script runs twice, 
        // but let's assume they are the original prices without discount distributed yet.
        // If the user already edited the invoice, the new logic might have applied.
        // To be safe, we will calculate the original subtotal before discount.
        // actually, if it's already distributed, the total price * qty of items will be close to the sale.total

        const currentItemsTotal = sale.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // If the current items total already equals the sale.total (which is subtotal - discount), 
        // it means the discount was ALREADY distributed (e.g. they edited it).
        // Let's check with a small margin of error for floats.
        if (Math.abs(currentItemsTotal - sale.total) < 0.1) {
            console.log(`Sale #${sale.id} already has distributed prices. Skipping.`);
            continue;
        }

        // The current item prices are the "original" prices. Subtotal is currentItemsTotal.
        const subtotal = currentItemsTotal;
        const discountRatio = subtotal > 0 ? sale.discount / subtotal : 0;

        await prisma.$transaction(async (tx) => {
            for (const item of sale.items) {
                const originalItemTotal = item.price * item.quantity;
                const itemDiscount = originalItemTotal * discountRatio;
                const newUnitPrice = (originalItemTotal - itemDiscount) / item.quantity;

                await tx.saleItem.update({
                    where: { id: item.id },
                    data: {
                        price: parseFloat(newUnitPrice.toFixed(2))
                    }
                })
            }
        });

        updatedCount++;
        console.log(`Successfully distributed discount for Sale #${sale.id}`);
    }

    console.log(`\nFinished! Distributed discounts on ${updatedCount} sales.`);
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
