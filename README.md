# Steel Retail Warehouse System (نظام مستودع الحديد)

A web-based system for managing a retail steel warehouse, including inventory, sales, and customers.

## Technologies
- **Framework**: Next.js 14
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features
- **Inventory Management**: Track steel products with specific dimensions and weights.
- **Sales/POS**: Create invoices and calculate totals automatically.
- **Reports**: View daily sales and stock levels.
