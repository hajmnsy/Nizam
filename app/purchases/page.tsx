'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Package, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Purchase {
    id: number
    invoiceNumber?: string
    supplier: string
    total: number
    status: string
    createdAt: string
    items: any[]
}

export default function PurchasesList() {
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState<string>('')

    const refreshPurchases = () => {
        setLoading(true)
        const dateQuery = date ? `?date=${date}` : ''
        fetch(`/api/purchases${dateQuery}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setPurchases(data)
                setLoading(false)
            })
            .catch(console.error)
    }

    useEffect(() => {
        refreshPurchases()
    }, [date])

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم خصم الكميات من المخزن.')) return

        try {
            const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
            if (res.ok) {
                refreshPurchases()
            } else {
                const data = await res.json()
                alert(data.error || 'حدث خطأ أثناء الحذف')
            }
        } catch (e) {
            console.error(e)
            alert('تعذر الاتصال بالخادم')
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="text-purple-500" />
                            فواتير المشتريات
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            سجل عمليات الشراء وإضافة المخزون
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/purchases/new">
                            <Button className="flex items-center gap-2 py-3 px-6 shadow-lg shadow-purple-200 bg-purple-600 hover:bg-purple-700">
                                <Plus size={20} />
                                فاتورة شراء جديدة
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600 font-sans hidden md:inline">تاريخ الفاتورة:</span>
                        <div className="flex items-center bg-white rounded-lg border border-slate-300 shadow-sm px-2">
                            <Calendar size={16} className="text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="border-none px-2 py-2 text-sm font-bold text-slate-800 outline-none w-32 bg-transparent"
                            />
                        </div>
                        <button
                            onClick={() => setDate('')}
                            className={`text-xs px-3 py-2 rounded-lg border font-bold transition-all ${date === '' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'}`}
                        >
                            الكل
                        </button>
                    </div>
                </div>

                <Card className="overflow-hidden border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">رقم الفاتورة</th>
                                    <th className="p-4">المورد</th>
                                    <th className="p-4">التاريخ</th>
                                    <th className="p-4">الإجمالي</th>
                                    <th className="p-4">تفاصيل الأصناف</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                    </tr>
                                ) : purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                            <Package size={48} className="mb-2 opacity-50" />
                                            لا توجد مشتريات حتى الآن
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map(purchase => (
                                        <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-slate-700">
                                                #{purchase.invoiceNumber || purchase.id}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{purchase.supplier || 'مورد عام'}</td>
                                            <td className="p-4 text-gray-600 text-sm">
                                                {new Date(purchase.createdAt).toLocaleDateString('ar-SD')}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{purchase.total.toLocaleString()}ج</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    {purchase.items.map((item: any, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 w-fit whitespace-normal text-right leading-tight">
                                                            <span className="font-bold text-purple-600 text-sm">{item.quantity}</span> × {item.product?.name || 'محذوف'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleDelete(purchase.id)}
                                                    className="px-3 py-1 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                                                >
                                                    حذف
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </main>
    )
}
