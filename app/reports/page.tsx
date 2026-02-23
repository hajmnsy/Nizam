'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, BarChart2, AlertCircle, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function Reports() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports/analytics')
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(console.error)
    }, [])

    const maxSales = data ? Math.max(...data.salesChart.map((d: any) => d.sales)) : 0

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <PieChart className="text-blue-600" />
                            التقارير التحليلية
                        </h1>
                        <p className="text-gray-500 mt-1">نظرة شاملة على أداء المصنع المالي والتشغيلي</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/reports/export')
                                    const exportData = await res.json()

                                    const wb = XLSX.utils.book_new()

                                    // Sales Sheet
                                    const salesWs = XLSX.utils.json_to_sheet(exportData.sales.map((s: any) => ({
                                        'رقم الفاتورة': s.id,
                                        'العميل': s.customer || 'نقدي',
                                        'المبلغ الكلي': s.total,
                                        'الحالة': s.status,
                                        'التاريخ': new Date(s.createdAt).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, salesWs, "المبيعات")

                                    // Expenses Sheet
                                    const expensesWs = XLSX.utils.json_to_sheet(exportData.expenses.map((e: any) => ({
                                        'التصنيف': e.category,
                                        'الوصف': e.description,
                                        'المبلغ': e.amount,
                                        'التاريخ': new Date(e.date).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, expensesWs, "المصروفات")

                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                                    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                                    saveAs(blob, `تقرير_المصنع_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`)

                                } catch (error) {
                                    alert('حدث خطأ أثناء التصدير')
                                }
                            }}
                            className="hidden md:flex bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold items-center gap-2 transition-all shadow-sm"
                        >
                            <Download size={18} />
                            تصدير Excel
                        </button>

                        <div className="text-left hidden md:block border-r pr-6 border-gray-200">
                            <p className="text-sm font-bold text-slate-400">آخر تحديث</p>
                            <p className="font-mono text-slate-600">{new Date().toLocaleTimeString('ar-SD')}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* 1. Financial Overview (Left Column) */}
                        <div className="space-y-4">
                            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-lg shadow-emerald-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <TrendingUp size={24} className="text-white" />
                                    </div>
                                    <span className="text-emerald-100 text-xs font-bold bg-white/10 px-2 py-1 rounded">هذا الشهر</span>
                                </div>
                                <h3 className="text-emerald-100 font-medium mb-1">صافي الأرباح (التقديري)</h3>
                                <p className="text-3xl font-black tracking-tight">{data.stats.netProfit.toLocaleString()} <span className="text-lg opacity-70 font-normal">ج.س</span></p>
                            </Card>

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border-l-4 border-blue-500">
                                    <h3 className="text-gray-400 text-xs font-bold mb-1">إجمالي المبيعات</h3>
                                    <p className="text-xl font-bold text-slate-800">{data.stats.monthlySales.toLocaleString()}</p>
                                </Card>
                                <Card className="border-l-4 border-red-500">
                                    <h3 className="text-gray-400 text-xs font-bold mb-1">إجمالي المصروفات</h3>
                                    <p className="text-xl font-bold text-slate-800">{data.stats.monthlyExpenses.toLocaleString()}</p>
                                </Card>
                            </div>

                            <Link href="/inventory" className="block">
                                <Card className="border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-200 text-amber-700 rounded-full group-hover:scale-110 transition-transform">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-amber-800 font-bold text-lg">{data.stats.lowStockCount} منتجات</h3>
                                            <p className="text-amber-600 text-sm">أوشكت على النفاد من المخزون</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>

                        {/* 2. Sales Chart (Center - spanning 2 cols) */}
                        <Card className="lg:col-span-2 flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="text-blue-500" />
                                    حركة المبيعات (آخر 7 أيام)
                                </h2>
                            </div>

                            {/* Custom CSS Bar Chart */}
                            <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-2 border-b border-gray-100">
                                {data.salesChart.map((item: any, i: number) => {
                                    const heightPercent = maxSales > 0 ? (item.sales / maxSales) * 100 : 0
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                                            {/* Tooltip */}
                                            <div className="absolute -top-12 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {item.sales.toLocaleString()} ج.س
                                            </div>

                                            {/* Bar */}
                                            <div
                                                className="w-full max-w-[40px] bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-all cursor-pointer relative overflow-hidden"
                                                style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min 2% height
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-transparent opacity-50"></div>
                                            </div>

                                            {/* Label */}
                                            <span className="text-xs font-bold text-gray-500">{item.date}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        {/* 3. Top Products (Bottom Row - Wide) */}
                        <Card className="lg:col-span-3">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <BarChart2 className="text-purple-500" />
                                المنتجات الأكثر مبيعاً
                            </h2>
                            <div className="space-y-4">
                                {data.topProducts.map((p: any, i: number) => (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-bold text-slate-700">{p.name}</span>
                                            <span className="font-mono text-gray-500">{p.quantity} قطعة</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                                style={{ width: `${(p.quantity / data.topProducts[0].quantity) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {data.topProducts.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">لا توجد بيانات كافية</p>
                                )}
                            </div>
                        </Card>

                    </div>
                )}
            </div>
        </main>
    )
}
