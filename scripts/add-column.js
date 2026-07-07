const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Altering table to add initialBalanceRate...");
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Setting" ADD COLUMN IF NOT EXISTS "initialBalanceRate" DOUBLE PRECISION DEFAULT 0;
    `);
    console.log("Column initialBalanceRate added successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
