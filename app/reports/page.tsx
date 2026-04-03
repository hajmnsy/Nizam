'use client'

import Navbar from '@/components/Navbar'
import Card from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, BarChart2, AlertCircle, Download, Users, Package } from 'lucide-react'
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

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-100 flex flex-col gap-1 text-sm font-bold text-slate-800 font-sans dir-rtl text-right">
                    <p className="text-slate-500 mb-1 border-b border-slate-100 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={`item-${index}`} className="flex justify-between items-center gap-4">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-black text-slate-900">{entry.value?.toLocaleString() || 0}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto p-4 max-w-7xl animate-fade-in-up">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
                            <Activity className="text-blue-600" />
                            لوحة المعلومات التحليلية
                        </h1>
                        <p className="text-gray-500 mt-1">نظرة شاملة ومخططات بيانية لأداء المصنع المالي والتشغيلي</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/reports/export', { cache: 'no-store' })
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
                        >
                            <Download size={18} />
                            تصدير البيانات Excel
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Top KPIs */}
                        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-lg shadow-emerald-200/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <TrendingUp size={24} className="text-white" />
                                    </div>
                                    <span className="text-emerald-100 text-xs font-bold bg-white/10 px-2 py-1 rounded">هذا الشهر</span>
                                </div>
                                <h3 className="text-emerald-100 font-medium mb-1">صافي الأرباح (التقديري)</h3>
                                <p className="text-3xl font-black tracking-tight">{data.stats.netProfit.toLocaleString()} <span className="text-lg opacity-70 font-normal">ج.س</span></p>
                            </Card>
                            
                            <Card className="border-l-4 border-blue-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <Activity className="absolute -left-4 -top-4 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" size={100} />
                                <div className="relative z-10">
                                    <h3 className="text-gray-500 text-sm font-bold mb-1">إجمالي المبيعات (الشهر)</h3>
                                    <p className="text-2xl font-black text-slate-800">{data.stats.monthlySales.toLocaleString()}</p>
                                </div>
                            </Card>

                            <Card className="border-l-4 border-red-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <TrendingDown className="absolute -left-4 -top-4 text-red-50 opacity-50 group-hover:scale-110 transition-transform" size={100} />
                                <div className="relative z-10">
                                    <h3 className="text-gray-500 text-sm font-bold mb-1">إجمالي المصروفات (الشهر)</h3>
                                    <p className="text-2xl font-black text-slate-800">{data.stats.monthlyExpenses.toLocaleString()}</p>
                                </div>
                            </Card>

                            <Link href="/inventory" className="block h-full">
                                <Card className="border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer group h-full flex flex-col justify-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-200 text-amber-700 rounded-full group-hover:scale-110 transition-transform">
                                            <AlertCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-amber-800 font-black text-2xl">{data.stats.lowStockCount}</h3>
                                            <p className="text-amber-600 text-sm font-bold mt-1">أوشكت على النفاد من المخزون</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>

                        {/* Main Cashflow Area Chart (Spans 4 cols horizontally) */}
                        <Card className="lg:col-span-4 h-[400px] flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 px-2">
                                <Activity className="text-blue-500" />
                                تحليلات التدفق المالي (الـ 30 يوماً الماضية)
                            </h2>
                            <div className="flex-1 w-full" dir="ltr">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.cashflowChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => val === 0 ? '0' : `${val/1000}k`} />
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ paddingTop: '20px', fontFamily: 'sans-serif', fontWeight: 'bold' }} />
                                        <Area type="monotone" name="المبيعات" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" name="المصروفات" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Top Selling Products (Composed Chart) */}
                        <Card className="lg:col-span-2 h-[350px] flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 px-2">
                                <BarChart2 className="text-purple-500" />
                                المنتجات الأكثر مبيعاً (كمية وعائد)
                            </h2>
                            <div className="flex-1 w-full" dir="ltr">
                                {data.topProducts && data.topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={data.topProducts} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid stroke="#f5f5f5" vertical={false}/>
                                            <XAxis dataKey="name" scale="band" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" height={60} />
                                            <YAxis yAxisId="left" tickFormatter={(val) => `${val/1000}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Bar yAxisId="left" dataKey="revenue" name="العائد (ج.س)" barSize={20} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="quantity" name="الكمية (قطعة)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-bold">لا توجد بيانات مبيعات لهذا الشهر</div>
                                )}
                            </div>
                        </Card>

                        {/* Top Customers */}
                        <Card className="lg:col-span-2 h-[350px] flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 px-2">
                                <Users className="text-indigo-500" />
                                أكبر العملاء
                            </h2>
                            <div className="flex-1 w-full" dir="ltr">
                                {data.topCustomers && data.topCustomers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 'bold' }} width={100} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                            <Bar dataKey="total" name="المشتريات" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-bold">لا توجد سجلات للعملاء</div>
                                )}
                            </div>
                        </Card>

                        {/* Sales Categories Donut */}
                        <Card className="lg:col-span-2 h-[350px] flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 px-2">
                                <Package className="text-emerald-500" />
                                مبيعات الأقسام
                            </h2>
                            <div className="flex-1 w-full" dir="ltr">
                                {data.salesByCategory && data.salesByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={data.salesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.salesByCategory.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold' }} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-bold">لا توجد مبيعات</div>
                                )}
                            </div>
                        </Card>

                        {/* Expenses By Category */}
                        <Card className="lg:col-span-2 h-[350px] flex flex-col shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 px-2">
                                <PieChart className="text-rose-500" />
                                توزيع المصروفات
                            </h2>
                            <div className="flex-1 w-full" dir="ltr">
                                {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={data.expensesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={0}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.expensesByCategory.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold' }} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 font-bold">لا توجد مصروفات</div>
                                )}
                            </div>
                        </Card>

                    </div>
                )}
            </div>
        </main>
    )
}
