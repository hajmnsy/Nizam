process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Adding deliveredQuantity column to SaleItem table...");
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "SaleItem" ADD COLUMN IF NOT EXISTS "deliveredQuantity" INTEGER DEFAULT 0;
    `);
    console.log("Column deliveredQuantity added.");

    console.log("Backfilling deliveredQuantity for DELIVERED sales...");
    const updatedCount = await prisma.$executeRawUnsafe(`
        UPDATE "SaleItem" 
        SET "deliveredQuantity" = "quantity" 
        WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "deliveryStatus" = 'DELIVERED');
    `);
    console.log("Updated rows for delivered sales:", updatedCount);

    await prisma.$executeRawUnsafe(`
        UPDATE "SaleItem" 
        SET "deliveredQuantity" = 0 
        WHERE "deliveredQuantity" IS NULL;
    `);
    console.log("Partial delivery DB migration completed successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
