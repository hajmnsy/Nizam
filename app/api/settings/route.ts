import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        let setting = await prisma.setting.findUnique({
            where: { id: 'default' }
        })

        if (!setting) {
            setting = await prisma.setting.create({
                data: {
                    companyName: 'اسم الشركة',
                    vatRate: 0
                }
            })
        }

        return NextResponse.json(setting, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            }
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { companyName, phone, vatRate, address, logoUrl, initialBalance, initialBalanceDate } = body

        const updateData: any = {}
        const createData: any = { id: 'default', companyName: companyName || 'اسم الشركة' }

        if (companyName !== undefined) { updateData.companyName = companyName; createData.companyName = companyName; }
        if (phone !== undefined) { updateData.phone = phone; createData.phone = phone; }
        if (address !== undefined) { updateData.address = address; createData.address = address; }
        if (logoUrl !== undefined) { updateData.logoUrl = logoUrl; createData.logoUrl = logoUrl; }

        if (vatRate !== undefined) {
            updateData.vatRate = parseFloat(vatRate as string);
            createData.vatRate = parseFloat(vatRate as string);
        }

        if (initialBalance !== undefined && initialBalance !== '') {
            const parsedBalance = isNaN(parseFloat(initialBalance as string)) ? 0 : parseFloat(initialBalance as string);
            updateData.initialBalance = parsedBalance;
            createData.initialBalance = parsedBalance;
        }

        if (initialBalanceDate !== undefined) {
            const parsedDate = (initialBalanceDate && initialBalanceDate.trim() !== '') ? new Date(initialBalanceDate) : null;
            updateData.initialBalanceDate = parsedDate;
            createData.initialBalanceDate = parsedDate;
        }

        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            update: updateData,
            create: createData,
        })

        return NextResponse.json(setting)
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
