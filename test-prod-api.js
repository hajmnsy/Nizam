const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function main() {
    const prisma = new PrismaClient();
    try {
        // 1. Get the admin user
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("No user found");

        // 2. Generate a fresh session token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // 3. Save it to DB
        await prisma.session.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            }
        });

        console.log("Injected session token for testing:", token);

        // 4. Fetch the products from the live server using this token
        // Use Node fetch (available in newer Node versions)
        const response = await fetch('https://nizam-ruddy.vercel.app/api/products', {
            headers: {
                'Cookie': `session_token=${token}`
            }
        });

        const status = response.status;
        const text = await response.text();

        console.log(`API Response Status: ${status}`);
        console.log(`API Response Body: ${text.substring(0, 500)}`);

        // Clean up session
        await prisma.session.delete({ where: { token } });

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
