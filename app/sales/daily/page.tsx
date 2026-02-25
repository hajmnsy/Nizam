'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Calendar as CalendarIcon, FileText, Printer, ArrowLeft, TrendingUp, HandCoins, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'

interface SaleItem {
    id: number
    quantity: number
    price: number
    product: {
        name: string
        type: string | null
        thickness: number | null
    }
}

interface Sale {
    id: number
    invoiceNumber?: number
    customer: string
    total: number
    paidAmount?: number
    remainingAmount?: number
    status: string
    createdAt: string
    items: SaleItem[]
}

export default function DailyReport() {
    // Default to today in YYYY-MM-DD local format
    const getTodayLocal = () => {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset * 60 * 1000))
        return local.toISOString().split('T')[0]
    }

    const [date, setDate] = useState(getTodayLocal())
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSales = (selectedDate: string) => {
        setLoading(true)
        fetch(`/api/sales?date=${selectedDate}`)
            .then(res => res.json())
            .then(data => {
                // Ignore quotations
                const actualSales = data.filter((s: Sale) => s.status !== 'QUOTATION')
                setSales(actualSales)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchSales(date)
    }, [date])

    const handlePrint = () => {
        window.print()
    }

    // Calculations
    const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0)
    const totalRemaining = sales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0)

    // Items aggregate
    const itemMap = new Map<string, { name: string, type: string | null, thickness: number | null, qty: number, totalVal: number }>()
    sales.forEach(s => {
        s.items.forEach(item => {
            const key = `${item.product.name}-${item.product.type || 'none'}-${item.product.thickness || 'none'}`
            const existing = itemMap.get(key) || {
                name: item.product.name,
                type: item.product.type,
                thickness: item.product.thickness,
                qty: 0,
                totalVal: 0
            }
            existing.qty += item.quantity
            existing.totalVal += item.price * item.quantity
            itemMap.set(key, existing)
        })
    })

    const aggregatedItems = Array.from(itemMap.values()).sort((a, b) => b.totalVal - a.totalVal)

    return (
        <main className="min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:m-0 print:p-0">
            <div className="print:hidden">
                <Navbar />
            </div>

            <div className="container mx-auto p-4 max-w-5xl print:max-w-none print:w-full print:p-0">
                {/* Header Actions - hidden in print */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/sales" className="text-gray-500 hover:text-blue-600 flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded text-sm font-bold">
                            <ArrowLeft size={16} />
                            العودة للمبيعات
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-500" />
                                تقرير اليومية
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                تقرير ملخص المبيعات والتحصيلات لحركة يوم محدد
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                            <CalendarIcon size={18} className="text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-slate-700"
                            />
                        </div>
                        <Button onClick={handlePrint} className="flex items-center gap-2 shadow-sm font-bold">
                            <Printer size={18} />
                            طباعة التقرير
                        </Button>
                    </div>
                </div>

                {/* Printable Report Area */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:border-none print:shadow-none print:p-0">

                    {/* Report Header for Print */}
                    <div className="hidden print:block text-center border-b-2 border-slate-300 pb-4 mb-6">
                        <h2 className="text-3xl font-black text-slate-800 mb-2">تقرير اليومية</h2>
                        <p className="text-lg font-bold text-slate-600">التاريخ: {new Date(date).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="print:hidden mb-6 flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-black text-slate-800">تاريخ: {new Date(date).toLocaleDateString('ar-EG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h2>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-gray-500 text-lg font-bold">جاري تحميل البيانات...</div>
                    ) : sales.length === 0 ? (
                        <div className="py-20 text-center text-gray-500 text-lg flex flex-col items-center gap-3">
                            <AlertCircle size={48} className="text-gray-300" />
                            لا توجد أي مبيعات أو حركات مسجلة في هذا اليوم.
                        </div>
                    ) : (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
                                <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl print:border-slate-300 print:bg-transparent">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="text-blue-500" size={24} />
                                        <h3 className="font-bold text-slate-700 print:text-black">إجمالي مبيعات اليوم</h3>
                                    </div>
                                    <p className="text-3xl font-black text-blue-700 print:text-black">{totalSales.toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.س</span></p>
                                    <p className="text-sm text-blue-600/80 mt-2 font-medium">{sales.length} فاتورة</p>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl print:border-slate-300 print:bg-transparent">
                                    <div className="flex items-center gap-3 mb-2">
                                        <HandCoins className="text-emerald-500" size={24} />
                                        <h3 className="font-bold text-slate-700 print:text-black">التحصيل النقدي</h3>
                                    </div>
                                    <p className="text-3xl font-black text-emerald-700 print:text-black">{totalPaid.toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.س</span></p>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl print:border-slate-300 print:bg-transparent">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertCircle className="text-amber-500" size={24} />
                                        <h3 className="font-bold text-slate-700 print:text-black">مبيعات آجلة (متبقي)</h3>
                                    </div>
                                    <p className="text-3xl font-black text-amber-700 print:text-black">{totalRemaining.toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.س</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Aggregated Items Table */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ملخص الأصناف المباعة</h3>
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead className="bg-slate-100 print:bg-slate-50">
                                            <tr>
                                                <th className="p-3 border-b-2 border-slate-200">الصنف</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">النوع</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">السماكة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-center">الكمية المباعة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-left">إجمالي القيمة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aggregatedItems.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-3 font-bold text-slate-700">{item.name}</td>
                                                    <td className="p-3 text-center text-slate-500">{item.type || '-'}</td>
                                                    <td className="p-3 text-center text-slate-500 text-xs" dir="ltr">{item.thickness ? `${item.thickness} mm` : '-'}</td>
                                                    <td className="p-3 text-center font-mono text-slate-600 bg-slate-50 print:bg-transparent">{item.qty}</td>
                                                    <td className="p-3 text-left font-mono font-bold text-slate-800">{item.totalVal.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50 print:bg-transparent font-black">
                                                <td className="p-3 text-left" colSpan={3}>الإجمالي</td>
                                                <td className="p-3 text-center font-mono text-blue-600">{aggregatedItems.reduce((sum, item) => sum + item.qty, 0)}</td>
                                                <td className="p-3 text-left font-mono text-blue-600">{totalSales.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Invoices List */}
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">سجل الفواتير ({sales.length})</h3>
                                    <table className="w-full text-right border-collapse text-sm">
                                        <thead className="bg-slate-100 print:bg-slate-50">
                                            <tr>
                                                <th className="p-3 border-b-2 border-slate-200">رقم</th>
                                                <th className="p-3 border-b-2 border-slate-200">الحالة</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-left">تاريخ / وقت</th>
                                                <th className="p-3 border-b-2 border-slate-200 text-left">قيمة الفاتورة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map(s => (
                                                <tr key={s.id} className="border-b border-slate-100">
                                                    <td className="p-3 font-mono font-bold text-slate-700">#{s.invoiceNumber || s.id}</td>
                                                    <td className="p-3">
                                                        {s.status === 'PAID' ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100">مسددة</span>
                                                        ) : (
                                                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-100">آجلة</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-left font-mono text-slate-500 text-xs">
                                                        {new Date(s.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="p-3 text-left font-mono font-bold text-slate-800">{s.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
        </main>
    )
}
