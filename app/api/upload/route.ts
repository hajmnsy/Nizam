export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Instead of writing to disk (which fails on Vercel's read-only filesystem),
        // we convert the image to a base64 data URL and save it directly in the DB.
        const mimeType = file.type || 'image/png';
        const base64Data = buffer.toString('base64');
        const fileUrl = `data:${mimeType};base64,${base64Data}`;

        return NextResponse.json({ url: fileUrl })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}
