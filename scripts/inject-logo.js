const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Reading image file...");
        const imagePath = path.join('C:\\Users\\GALA\\.gemini\\antigravity\\brain\\58de70c7-17e4-4183-b036-2436f0b632f6', 'media__1773037982663.png');
        const imageBuffer = fs.readFileSync(imagePath);

        console.log("Converting to base64...");
        const base64Data = imageBuffer.toString('base64');
        const fileUrl = `data:image/png;base64,${base64Data}`;

        console.log("Base64 length:", fileUrl.length);

        console.log("Updating database setting...");
        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            update: {
                companyName: 'مصنع الجودة',
                logoUrl: fileUrl
            },
            create: {
                id: 'default',
                companyName: 'مصنع الجودة',
                logoUrl: fileUrl,
                vatRate: 0
            }
        });

        console.log("Successfully updated settings!", setting.companyName);
    } catch (e) {
        console.error("Crash:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
