import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
    title: 'مصنع الجودة للمنتجات الحديدية - نظام الإدارة التنفيذي',
    description: 'نظام إدارة المخازن والمبيعات والمنصرفات لمصنع الجودة',
    manifest: '/manifest.json',
}

export const viewport: Viewport = {
    themeColor: '#0f172a',
}

import OfflineSyncBanner from '@/components/OfflineSyncBanner'
import PWARegister from '@/components/PWARegister'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl" className={cairo.variable}>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0f172a" />
            </head>
            <body className={`${cairo.className} bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}>
                <PWARegister />
                <OfflineSyncBanner />
                {children}
            </body>
        </html>
    )
}
