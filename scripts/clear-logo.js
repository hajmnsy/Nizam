const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Clearing logoUrl from database...");
        const setting = await prisma.setting.update({
            where: { id: 'default' },
            data: {
                logoUrl: null
            }
        });

        console.log("Successfully cleared logoUrl for:", setting.companyName);
    } catch (e) {
        console.error("Crash:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
