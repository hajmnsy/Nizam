const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const updated = await prisma.setting.update({
            where: { id: 'default' },
            data: { logoUrl: '/custom_logo.png' }
        });
        console.log('Logo updated to:', updated.logoUrl);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
