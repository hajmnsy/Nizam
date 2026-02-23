import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching most recent sales with a discount...')

    const sales = await prisma.sale.findMany({
        where: {
            discount: {
                gt: 0
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 3,
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    })

    if (sales.length === 0) {
        console.log("No recent sales with discount found.");
        return;
    }

    for (const sale of sales) {
        console.log(`\n=== Sale ID: ${sale.id} | Status: ${sale.status} ===`)
        console.log(`Subtotal (approx before discount): ${sale.total + sale.discount}`)
        console.log(`Discount: ${sale.discount}`)
        console.log(`Saved Total: ${sale.total}`)
        console.log(`Paid: ${sale.paidAmount} | Remaining: ${sale.remainingAmount}`)

        console.log(`Items:`)
        let sumOfItems = 0;
        for (const item of sale.items) {
            console.log(`  - ${item.product.name} | Qty: ${item.quantity} | Original DB Product Price: ${item.product.price} | SAVED SaleItem Price: ${item.price}`)
            sumOfItems += item.price * item.quantity;
        }
        console.log(`Sum of SAVED SaleItem prices * qty = ${sumOfItems}`)
        if (sumOfItems !== sale.total) {
            console.log(`!!! MISMATCH: Sum of items (${sumOfItems}) != Sale Total (${sale.total}) !!!`)
        } else {
            console.log(`MATCH: Sum of items exactly matches Sale Total.`)
        }
    }
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
