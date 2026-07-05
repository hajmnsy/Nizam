import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getActiveBranchId } from '@/lib/branch'

export const dynamic = 'force-dynamic'



export async function GET() {
    try {
        const branchId = getActiveBranchId()
        let setting = await prisma.setting.findFirst({
            where: { branchId }
        })

        if (!setting) {
            // Find default setting to clone its name or use default values
            const defaultSetting = await prisma.setting.findFirst({
                where: { id: 'default' }
            })
            setting = await prisma.setting.create({
                data: {
                    id: `branch-${branchId}`,
                    companyName: defaultSetting?.companyName || 'اسم الشركة',
                    vatRate: defaultSetting?.vatRate || 0,
                    exchangeRate: defaultSetting?.exchangeRate || 0,
                    address: defaultSetting?.address || null,
                    phone: defaultSetting?.phone || null,
                    branchId: branchId
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
        const branchId = getActiveBranchId()
        const body = await request.json()
        const { companyName, phone, vatRate, address, logoUrl, initialBalance, initialBalanceDate, transportCostUSD } = body

        // Find existing setting for this branch
        let existingSetting = await prisma.setting.findFirst({
            where: { branchId }
        })

        const settingId = existingSetting?.id || `branch-${branchId}`

        const updateData: any = {}
        const createData: any = { 
            id: settingId, 
            companyName: companyName || 'اسم الشركة',
            branchId
        }

        if (companyName !== undefined) { updateData.companyName = companyName; createData.companyName = companyName; }
        if (phone !== undefined) { updateData.phone = phone; createData.phone = phone; }
        if (address !== undefined) { updateData.address = address; createData.address = address; }
        if (logoUrl !== undefined) { updateData.logoUrl = logoUrl; createData.logoUrl = logoUrl; }

        if (vatRate !== undefined) {
            updateData.vatRate = parseFloat(vatRate as string);
            createData.vatRate = parseFloat(vatRate as string);
        }

        if (transportCostUSD !== undefined) {
            updateData.transportCostUSD = parseFloat(transportCostUSD as string);
            createData.transportCostUSD = parseFloat(transportCostUSD as string);
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
            where: { id: settingId },
            update: updateData,
            create: createData,
        })

        return NextResponse.json(setting)
    } catch (error: any) {
        console.error('Error updating settings:', error)
        console.error('Error Details:', error?.message || error)
        console.error('Failed Payload Body:', await request.clone().text().catch(() => 'Could not read body'))
        return NextResponse.json({ error: 'Failed to update settings', details: error?.message }, { status: 500 })
    }
}
