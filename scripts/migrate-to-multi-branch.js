const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration to multi-branch...');

    // 1. Create or get the default branch
    const defaultBranch = await prisma.branch.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'الفرع الرئيسي',
            code: 'main',
            address: 'الموقع الرئيسي',
            phone: '0123456789'
        }
    });
    console.log('✅ Default branch verified:', defaultBranch);

    // 2. Update all categories
    const categories = await prisma.category.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${categories.count} categories`);

    // 3. Update all products
    const products = await prisma.product.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${products.count} products`);

    // 4. Update all sales
    const sales = await prisma.sale.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${sales.count} sales`);

    // 5. Update all expenses
    const expenses = await prisma.expense.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${expenses.count} expenses`);

    // 6. Update all employees
    const employees = await prisma.employee.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${employees.count} employees`);

    // 7. Update all settings
    const settings = await prisma.setting.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${settings.count} settings`);

    // 8. Update all notifications
    const notifications = await prisma.notification.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${notifications.count} notifications`);

    // 9. Update all purchases
    const purchases = await prisma.purchase.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${purchases.count} purchases`);

    // 10. Update all users
    const users = await prisma.user.updateMany({
        where: { branchId: null },
        data: { branchId: 1 }
    });
    console.log(`✅ Updated ${users.count} users`);

    console.log('Migration completed successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
