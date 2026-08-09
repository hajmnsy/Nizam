import './globals.css'
import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
})

export const metadata: Metadata = {
    title: 'مصنع الجودة للمنتجات الحديدية - نظام الإدارة التنفيذي',
    description: 'نظام إدارة المخازن والمبيعات والمنصرفات لمصنع الجودة',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl" className={cairo.variable}>
            <body className={`${cairo.className} bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white`}>
                {children}
            </body>
        </html>
    )
}
