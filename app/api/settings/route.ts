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

        const setting = await prisma.setting.upsert({
            where: { id: 'default' },
            update: {
                companyName,
                phone,
                vatRate: parseFloat(vatRate as string),
                address,
                logoUrl,
                initialBalance: isNaN(parseFloat((initialBalance || 0) as string)) ? 0 : parseFloat((initialBalance || 0) as string),
                initialBalanceDate: (initialBalanceDate && initialBalanceDate.trim() !== '') ? new Date(initialBalanceDate) : null
            },
            create: {
                id: 'default',
                companyName: companyName || 'اسم الشركة',
                phone,
                vatRate: parseFloat((vatRate || 0) as string),
                address,
                logoUrl,
                initialBalance: isNaN(parseFloat((initialBalance || 0) as string)) ? 0 : parseFloat((initialBalance || 0) as string),
                initialBalanceDate: (initialBalanceDate && initialBalanceDate.trim() !== '') ? new Date(initialBalanceDate) : null
            }
        })

        return NextResponse.json(setting)
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
