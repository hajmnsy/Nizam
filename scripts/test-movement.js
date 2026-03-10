const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching setting...");
        const setting = await prisma.setting.findUnique({ where: { id: 'default' } });
        console.log("Setting:", setting);

        const startDate = new Date('2026-03-01T00:00:00.000Z');
        const endDate = new Date('2026-03-08T23:59:59.999Z');

        const hasInitialBalance = setting && setting.initialBalanceDate;
        const initialDate = hasInitialBalance ? new Date(setting.initialBalanceDate) : undefined;

        console.log("hasInitialBalance:", hasInitialBalance);
        console.log("initialDate:", initialDate);

        if (hasInitialBalance && initialDate && startDate > initialDate) {
            console.log("Calculating past sales between", initialDate, "and", startDate);
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { gte: initialDate, lt: startDate } },
                _sum: { paidAmount: true, total: true }
            });
            console.log("pastSales:", pastSales);
        } else {
            console.log("Using legacy behavior...");
            const pastSales = await prisma.sale.aggregate({
                where: { createdAt: { lt: startDate } },
                _sum: { paidAmount: true, total: true }
            });
            console.log("Legacy pastSales:", pastSales);
        }
    } catch (e) {
        console.error("Crash:", e);
    }
}
main();
