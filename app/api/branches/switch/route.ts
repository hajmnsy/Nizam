import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const { branchId } = await request.json()

        if (!branchId || isNaN(parseInt(branchId))) {
            return NextResponse.json({ error: 'Invalid branch ID' }, { status: 400 })
        }

        const cookieStore = cookies()
        // Set the active branch cookie for 30 days
        cookieStore.set('active_branch_id', branchId.toString(), {
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            httpOnly: false, // allow reading client-side if needed
            sameSite: 'lax',
        })

        return NextResponse.json({ success: true, activeBranchId: parseInt(branchId) })
    } catch (error) {
        console.error('Error switching branch:', error)
        return NextResponse.json({ error: 'Failed to switch branch' }, { status: 500 })
    }
}
