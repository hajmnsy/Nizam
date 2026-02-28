'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Plus, Eye, FileText, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Sale {
    id: number
    invoiceNumber?: number
    customer: string
    total: number
    paidAmount?: number
    remainingAmount?: number
    status: string
    createdAt: string
    items: any[]
}

export default function SalesList() {
    // Default to today in YYYY-MM-DD local format
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'PAID' | 'CREDIT' | 'QUOTATION'>('PAID')
    const [date, setDate] = useState<string>(getTodayLocal())

    useEffect(() => {
        setLoading(true)
        const dateQuery = date ? `&date=${date}` : ''
        fetch(`/api/sales?status=${tab}${dateQuery}`)
            .then(res => res.json())
            .then(data => {
                setSales(data)
                setLoading(false)
            })
            .catch(console.error)
    }, [tab, date])

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {tab === 'PAID' ? <CheckCircle className="text-emerald-500" /> : tab === 'CREDIT' ? <Clock className="text-amber-500" /> : <FileText className="text-blue-500" />}
                            {tab === 'PAID' ? 'فواتير المبيعات' : tab === 'CREDIT' ? 'مبيعات آجلة' : 'عروض الأسعار'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {tab === 'PAID' ? 'سجل عمليات البيع المكتملة الدفع' : tab === 'CREDIT' ? 'مبيعات غير مسددة بالكامل' : 'المسودات وعروض الأسعار المحفوظة'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/sales/daily">
                            <Button variant="outline" className="flex items-center gap-2 py-3 px-6 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
                                <FileText size={20} />
                                تقرير اليومية
                            </Button>
                        </Link>
                        <Link href="/sales/new">
                            <Button className="flex items-center gap-2 py-3 px-6 shadow-lg shadow-blue-200">
                                <Plus size={20} />
                                فاتورة جديدة
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b border-gray-200">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('PAID')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'PAID'
                                ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            الفواتير المسددة
                        </button>
                        <button
                            onClick={() => setTab('CREDIT')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'CREDIT'
                                ? 'border-amber-500 text-amber-700 bg-amber-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            المبيعات الآجلة
                        </button>
                        <button
                            onClick={() => setTab('QUOTATION')}
                            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 -mb-[1px] ${tab === 'QUOTATION'
                                ? 'border-blue-500 text-blue-700 bg-blue-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            عروض الأسعار
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2 sm:mb-0 sm:pb-2">
                        <span className="text-sm font-bold text-slate-600 font-sans">تاريخ العرض:</span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setDate('')}
                            className={`text-xs px-2 py-1.5 rounded-lg border font-bold transition-all ${date === '' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300'}`}
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
                                    <th className="p-4">{tab === 'QUOTATION' ? 'الرمز' : 'رقم الفاتورة'}</th>
                                    <th className="p-4">العميل</th>
                                    <th className="p-4">التاريخ</th>
                                    <th className="p-4">الإجمالي</th>
                                    <th className="p-4">تفاصيل الأصناف</th>
                                    <th className="p-4">الحالة</th>
                                    <th className="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">جاري التحميل...</td>
                                    </tr>
                                ) : sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-gray-400 flex flex-col items-center">
                                            <FileText size={48} className="mb-2 opacity-50" />
                                            لا توجد {tab === 'PAID' ? 'فواتير' : 'عروض أسعار'} حتى الآن
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map(sale => (
                                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono font-bold text-slate-700">
                                                {tab === 'QUOTATION' ? '-' : `#${sale.invoiceNumber || sale.id}`}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{sale.customer || 'عميل نقدي'}</td>
                                            <td className="p-4 text-gray-600 text-sm">
                                                {new Date(sale.createdAt).toLocaleDateString('ar-SD')}
                                                <br />
                                                <span className="text-xs text-gray-400">
                                                    {new Date(sale.createdAt).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{sale.total.toLocaleString()}ج</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 max-w-[250px]">
                                                    {sale.items.map((item: any, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 w-fit whitespace-normal text-right leading-tight">
                                                            <span className="font-bold text-blue-600 text-sm">{item.quantity}</span> × {item.product?.name || 'محذوف'} {item.product?.thickness ? `(${item.product.thickness}mm)` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {sale.status === 'PAID' ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <CheckCircle size={12} /> مسددة
                                                    </span>
                                                ) : sale.status === 'CREDIT' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                            <Clock size={12} /> آجلة
                                                        </span>
                                                        <span className="text-xs text-red-500 font-bold whitespace-nowrap">الباقي: {sale.remainingAmount?.toLocaleString() || 0}</span>
                                                    </div>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <FileText size={12} /> عرض سعر
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Link href={`/sales/${sale.id}`}>
                                                    <Button variant="outline" className="px-3 py-1 text-xs border-blue-200 text-blue-600 hover:bg-blue-50">
                                                        <Eye size={14} className="ml-1" />
                                                        عرض
                                                    </Button>
                                                </Link>
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
