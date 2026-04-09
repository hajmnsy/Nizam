const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Check quantity of 113
    const p1 = await prisma.product.findUnique({ where: { id: 113 } });
    console.log("Before:", p1.quantity);

    // Call POST function directly or insert
    const res = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer: 'Test',
            status: 'PAID',
            items: [
                { productId: 113, quantity: 1, price: 155000 }
            ]
        })
    });
    console.log("Status:", res.status);

    const p2 = await prisma.product.findUnique({ where: { id: 113 } });
    console.log("After:", p2.quantity);
}
main().catch(console.error).finally(() => prisma.$disconnect());
