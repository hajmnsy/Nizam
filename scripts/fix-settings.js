const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            update: {
                // don't overwrite if exists
            },
            create: {
                id: 'default',
                companyName: 'مصنع الجودة',
                vatRate: 0,
                logoUrl: '/logo.svg'
            }
        });
        console.log('Setting configured:', setting);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
