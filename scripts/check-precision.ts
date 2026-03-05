import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Checking for floating point precision or strange rounding issues in sales...");

    const sales = await prisma.sale.findMany({
        where: {
            status: { not: 'QUOTATION' }
        },
        include: { items: true },
        orderBy: { id: 'desc' }
    });

    let foundIssues = 0;

    for (const s of sales) {
        // Find sales where the total is not an integer, or ends in something weird like 999 or 001 or 002
        // Assuming typical SDG prices shouldn't end in 1 or 2 or 9 since they are usually in the thousands or at least hundreds.
        const isNotInteger = Math.round(s.total) !== s.total;
        const lastThreeDigits = Math.abs(Math.round(s.total)) % 1000;
        const looksLikePrecisionError = [999, 998, 1, 2].includes(lastThreeDigits);

        if (isNotInteger || looksLikePrecisionError) {
            foundIssues++;
            console.log(`\n--- Sale ID: ${s.id} (Inv: ${s.invoiceNumber}) ---`);
            console.log(`Total: ${s.total}, Paid: ${s.paidAmount}, Rem: ${s.remainingAmount}, Discount: ${s.discount}`);

            let calcSubtotal = 0;
            for (const i of s.items) {
                const itemTotal = i.quantity * i.price;
                calcSubtotal += itemTotal;
                console.log(`  - Item ${i.productId}: Qty ${i.quantity} * Price ${i.price} = ${itemTotal}`);
            }

            console.log(`  Calculated Subtotal: ${calcSubtotal}`);
            console.log(`  Final Calc Total: ${calcSubtotal - s.discount}`);
        }
    }

    console.log(`\nFinished check. Found ${foundIssues} sales with potential precision/rounding issues.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
