'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Settings2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PricingCalculatorRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to /settings where Pricing Calculator is merged
        const timer = setTimeout(() => {
            router.push('/settings')
        }, 1500)
        return () => clearTimeout(timer)
    }, [router])

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            <div className="container mx-auto p-4 max-w-2xl flex-1 flex flex-col justify-center items-center text-center">
                <Card className="p-8 bg-white border border-slate-200 shadow-lg rounded-3xl space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Settings2 size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">
                        تم دمج حاسبة الأسعار داخل صفحة الإعدادات المتقدمة
                    </h1>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-md mx-auto">
                        تم دمج جميع أدوات ومعايير التسعير وحساب المنصرفات التشغيلية وسعر الطن داخل صفحة الإعدادات الموحدة للمدير. جاري تحويلك تلقائياً...
                    </p>
                    <div className="pt-2">
                        <Link href="/settings">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 mx-auto">
                                <span>الانتقال للإعدادات الآن</span>
                                <ArrowLeft size={16} />
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </main>
    )
}
