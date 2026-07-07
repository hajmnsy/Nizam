const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Setting initialBalanceRate to 5000 for Branch 2 settings...");
    await prisma.setting.updateMany({
        where: { branchId: 2 },
        data: { initialBalanceRate: 5000 }
    });
    console.log("Done!");
}

main().finally(() => prisma.$disconnect());
