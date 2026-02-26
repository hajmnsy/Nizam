import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting expenses categories update...')

    const mappings = {
        'خامات': 'توريدات',
        'تشغيلية': 'عتالة وترحيل',
        'إيجار': 'عام',
        'صيانة': 'الفطور',
        'نثريات': 'صدقة',
    }

    let updatedCount = 0;

    for (const [oldValue, newValue] of Object.entries(mappings)) {
        const result = await prisma.expense.updateMany({
            where: { category: oldValue },
            data: { category: newValue }
        });

        console.log(`Changed ${oldValue} -> ${newValue} for ${result.count} expenses.`);
        updatedCount += result.count;
    }

    console.log(`Total expenses migrated: ${updatedCount}`);
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
