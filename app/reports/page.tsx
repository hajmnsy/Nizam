'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, BarChart2, AlertCircle, Download, Users, Package, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart as RePieChart, Pie, Cell, ComposedChart, Line
} from 'recharts'

export default function Reports() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports/analytics', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(console.error)
    }, [])

    // Modern vibrant palette
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f97316'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/40 flex flex-col gap-2 text-sm font-bold text-slate-800 font-sans dir-rtl text-right min-w-[160px]">
                    <p className="text-slate-400 mb-1 border-b border-slate-100 pb-2 text-xs uppercase tracking-wider">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex justify-between items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-slate-600">{entry.name}</span>
                            </div>
                            <span className="font-black text-slate-900 text-base">{entry.value?.toLocaleString() || 0}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-[#f8fafc] pb-12 selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar />

            <div className="container mx-auto p-4 md:p-6 mb-8 max-w-[1400px] animate-fade-in-up">
                
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/60 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                                <Activity size={28} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                لوحة التحكم التحليلية
                            </h1>
                        </div>
                        <p className="text-slate-500 font-medium mr-16">إحصائيات متقدمة، نظرة شاملة، ومؤشرات الأداء المالي والتشغيلي للمصنع.</p>
                    </div>
                    <div className="flex gap-3 items-center mr-16 md:mr-0">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/reports/export', { cache: 'no-store' })
                                    const exportData = await res.json()

                                    const wb = XLSX.utils.book_new()

                                    const salesWs = XLSX.utils.json_to_sheet(exportData.sales.map((s: any) => ({
                                        'رقم الفاتورة': s.id,
                                        'العميل': s.customer || 'نقدي',
                                        'المبلغ الكلي': s.total,
                                        'الحالة': s.status,
                                        'التاريخ': new Date(s.createdAt).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, salesWs, "المبيعات")

                                    const expensesWs = XLSX.utils.json_to_sheet(exportData.expenses.map((e: any) => ({
                                        'التصنيف': e.category,
                                        'الوصف': e.description,
                                        'المبلغ': e.amount,
                                        'التاريخ': new Date(e.date).toLocaleDateString('ar-SD')
                                    })))
                                    XLSX.utils.book_append_sheet(wb, expensesWs, "المصروفات")

                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                                    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                                    saveAs(blob, `تقرير_قيادي_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`)

                                } catch (error) {
                                    alert('حدث خطأ أثناء التصدير')
                                }
                            }}
                            className="bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <Download size={20} />
                            تصدير تقرير شامل Excel
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64 flex-col gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <span className="text-slate-400 font-bold animate-pulse">جاري معالجة مليارات البيانات...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">

                        {/* Top KPI Row (3 Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Net Profit */}
                            <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
                                        <TrendingUp size={28} className="text-white" />
                                    </div>
                                    <span className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-indigo-100 border border-white/10 shadow-sm">الأداء الشهري</span>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-indigo-100 font-bold mb-2 text-lg opacity-90">صافي الأرباح (التقديري)</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">
                                            {data.stats.netProfit.toLocaleString()}
                                        </p>
                                        <span className="text-xl font-bold opacity-70">ج.س</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Sales */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="absolute -left-6 -top-6 bg-emerald-50 w-32 h-32 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-inner">
                                        <ArrowUpRight size={28} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-slate-500 font-bold mb-2 text-lg">إجمالي المبيعات</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-slate-800 tracking-tight">
                                            {data.stats.monthlySales.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Expenses */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="absolute -left-6 -top-6 bg-rose-50 w-32 h-32 rounded-full blur-3xl opacity-60 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-inner">
                                        <ArrowDownRight size={28} />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-slate-500 font-bold mb-2 text-lg">إجمالي المصروفات</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-slate-800 tracking-tight">
                                            {data.stats.monthlyExpenses.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Row (2 Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Inventory Alert Link */}
                            <Link href="/inventory" className="block focus:outline-none focus:ring-4 focus:ring-amber-500/20 rounded-[2rem]">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-[2rem] p-6 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group flex items-center gap-6 cursor-pointer">
                                    <div className="p-4 bg-amber-200 text-amber-700 rounded-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-amber-900 font-black text-2xl">{data.stats.lowStockCount}</h3>
                                            <span className="text-amber-700 font-bold text-lg">منتجات</span>
                                        </div>
                                        <p className="text-amber-600/80 font-bold text-sm">أوشكت على النفاد من المخزون وتحتاج لتعبئة</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Movement Report Link (The Missing Feature) */}
                            <Link href="/reports/movement" className="block focus:outline-none focus:ring-4 focus:ring-blue-500/20 rounded-[2rem]">
                                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300 group flex items-center gap-6 cursor-pointer">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner group-hover:scale-110 group-hover:-rotate-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-800 font-black text-xl mb-1">حركة المقبوضات والمصروفات</h3>
                                        <p className="text-slate-500 font-bold text-sm">شاشة تفصيلية لعرض وطباعة كشوفات الحركة اليومية</p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Main Cashflow Area Chart (Spans 2 cols) */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[450px]">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                        <div className="w-3 h-8 bg-indigo-500 rounded-full"></div>
                                        تحليلات التدفق المالي المنحنى (الـ 30 يوماً الماضية)
                                    </h2>
                                </div>
                                <div className="flex-1 w-full" dir="ltr">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.cashflowChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 600 }} dy={15} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => val === 0 ? '0' : `${val/1000}k`} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                            <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'sans-serif', fontWeight: 'bold' }} iconType="circle" />
                                            <Area type="monotone" name="المبيعات" dataKey="sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 8, strokeWidth: 0, fill: '#10b981' }} />
                                            <Area type="monotone" name="المصروفات" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenses)" activeDot={{ r: 8, strokeWidth: 0, fill: '#f43f5e' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Selling Products (Composed Chart) */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[450px]">
                                <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                                    <div className="w-3 h-8 bg-amber-500 rounded-full"></div>
                                    المنتجات الذهبية (نجوم المبيعات)
                                </h2>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.topProducts && data.topProducts.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={data.topProducts} margin={{ top: 20, right: -20, bottom: 20, left: -20 }} layout="vertical">
                                                <CartesianGrid stroke="#f1f5f9" horizontal={true} vertical={false} strokeDasharray="4 4" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} width={80} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                                                <Bar dataKey="revenue" name="العائد (ج.س)" barSize={16} fill="#6366f1" radius={[0, 8, 8, 0]} />
                                                <Line dataKey="quantity" name="الكمية المباعة" type="monotone" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">لا توجد بيانات لهذا الشهر</div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Third Row (Donuts & Bars) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Sales Categories Donut */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[400px]">
                                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                                    <div className="w-3 h-8 bg-sky-500 rounded-full"></div>
                                    مبيعات الأقسام
                                </h2>
                                <div className="flex-1 w-full relative" dir="ltr">
                                    {data.salesByCategory && data.salesByCategory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.salesByCategory}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={6}
                                                    dataKey="value"
                                                    stroke="none"
                                                    cornerRadius={8}
                                                >
                                                    {data.salesByCategory.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold' }} iconType="circle" />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold">لا توجد مبيعات</div>
                                    )}
                                </div>
                            </div>

                            {/* Expenses By Category */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[400px]">
                                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                                    <div className="w-3 h-8 bg-rose-500 rounded-full"></div>
                                    توزيع نفقات المصنع
                                </h2>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={data.expensesByCategory}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={0}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {data.expensesByCategory.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold' }} iconType="circle" />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold">لا توجد مصروفات</div>
                                    )}
                                </div>
                            </div>

                            {/* Top Customers */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-[400px]">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="w-3 h-8 bg-teal-500 rounded-full"></div>
                                    أكبر العملاء قوة شرائية
                                </h2>
                                <div className="flex-1 w-full" dir="ltr">
                                    {data.topCustomers && data.topCustomers.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.topCustomers} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#475569', fontWeight: 'bold' }} width={80} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 8}} />
                                                <Bar dataKey="total" name="إجمالي المشتريات (ج.س)" fill="#14b8a6" radius={[0, 8, 8, 0]} barSize={20}>
                                                    {data.topCustomers.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">لا توجد سجلات للعملاء</div>
                                    )}
                                </div>
                            </div>
                            
                        </div>

                    </div>
                )}
            </div>
        </main>
    )
}
