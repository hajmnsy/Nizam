process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Adding delivery columns to Sale table...");
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveryStatus" VARCHAR(50) DEFAULT 'PENDING';
    `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
    `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveredBy" VARCHAR(255);
    `);
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "deliveryNotes" TEXT;
    `);
    console.log("Columns added successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
