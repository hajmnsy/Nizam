import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const targetDate = '2026-02-22'
    const startDate = new Date(`${targetDate}T00:00:00.000+02:00`)
    const endDate = new Date(`${targetDate}T23:59:59.999+02:00`)

    console.log(`Checking sales between ${startDate.toISOString()} and ${endDate.toISOString()}...`)

    const sales = await prisma.sale.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        include: { items: true }
    })

    console.log(`=========================================`)
    console.log(`Found ${sales.length} records.`)
    console.log(`=========================================`)

    let totalSum = 0
    let paidSum = 0
    let remainingSum = 0

    sales.forEach(s => {
        const itemSum = s.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

        console.log(`Invoice #${s.invoiceNumber || 'NoSeq'} (ID: ${s.id}) - Status: ${s.status}`)
        console.log(`  Items Sum: ${itemSum}`)
        console.log(`  Discount:  ${s.discount}`)
        console.log(`  Total:     ${s.total}`)
        console.log(`  Paid:      ${s.paidAmount}`)
        console.log(`  Remaining: ${s.remainingAmount}`)

        // Is Total logical? (Items Sum - Discount) == Total?
        const expectedTotal = itemSum - s.discount;
        if (expectedTotal !== s.total) {
            console.log(`  >>> MISMATCH! Expected Total ${expectedTotal}, got ${s.total}`)
        }

        // Is Payment logical? (Paid + Remaining) == Total?
        if (s.status !== 'QUOTATION') {
            const expectedPaymentSum = (s.paidAmount || 0) + (s.remainingAmount || 0)
            if (expectedPaymentSum !== s.total) {
                console.log(`  >>> PAYMENT MISMATCH! Paid + Remaining = ${expectedPaymentSum}, but Total = ${s.total}`)
            }
            totalSum += s.total
            paidSum += (s.paidAmount || 0)
            remainingSum += (s.remainingAmount || 0)
        }

        console.log(`-----------------------------------------`)
    })

    console.log(`\n### AGGREGATES FOR ACTUAL SALES (NON-QUOTATION) ###`)
    console.log(`Total Sales Value (totalSum):    ${totalSum}`)
    console.log(`Total Paid Cash (paidSum):       ${paidSum}`)
    console.log(`Total Remaining (remainingSum):  ${remainingSum}`)

    // Check if Paid + Remaining == Total Sales Value
    if (paidSum + remainingSum !== totalSum) {
        console.log(`>>> GLOBAL MISMATCH! Paid (${paidSum}) + Remaining (${remainingSum}) = ${paidSum + remainingSum}. DOES NOT MATCH Total Sales (${totalSum}).`)
    } else {
        console.log(`>>> Global Aggregates perfectly balanced.`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
