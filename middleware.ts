import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow login page and auth API routes
    if (
        pathname === '/login' ||
        pathname.startsWith('/api/auth/')
    ) {
        return NextResponse.next()
    }

    // Allow static files
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.svg')
    ) {
        return NextResponse.next()
    }

    // Check for session token
    const token = request.cookies.get('session_token')?.value

    if (!token) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // Add Role-Based Access Control logic
    // Warning: middleware runs on edge, can't use Prisma directly or fetch API endpoints that use Prisma.
    // Since we use DB sessions, we will handle role protection inside layout/client side to prevent edge crashes.

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image).*)'],
}
